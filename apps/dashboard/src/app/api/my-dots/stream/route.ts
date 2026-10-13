import { NextRequest } from 'next/server';
import { runDotChat, getServiceKey, getDotPersona } from '@/lib/mydots/chat-core';

export const maxDuration = 60;

// Request caps (mirror the JSON endpoint)
const __MAX_MESSAGES = 100;
const __MAX_CHARS = 100000;

// Minimal in-memory rate limiter (per-instance)
const __rateBuckets = new Map();
function __checkRate(key: string, maxReq: number, windowMs: number) {
  const now = Date.now();
  const b = __rateBuckets.get(key);
  if (!b || now >= b.resetAt) {
    __rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= maxReq) return false;
  b.count++;
  return true;
}
function __getIp(req: NextRequest) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * My Dots — Streaming Chat API
 *
 * POST /api/my-dots/stream
 * Returns text/event-stream (SSE).
 *
 * Request: { dotName: string, messages: [{role, content}] }
 *
 * Events:
 *   data: {"type":"meta","dot":"Scout","tools":3}      — start, tool count
 *   data: {"type":"token","text":"Hello"}               — text chunks
 *   data: {"type":"tool","capability":"web-search",...} — tool executed
 *   data: {"type":"done","tools":[...]}                 — complete
 *   data: {"type":"error","error":"..."}                — failure
 *
 * Auth: server holds FORGEOS_MYDOTS_KEY. Browser sends no credentials.
 * All inference via ForgeOS AI. Tool permissions enforced server-side.
 */
export async function POST(req: NextRequest) {
  const ip = __getIp(req);
  if (!__checkRate('stream:' + ip, 30, 60000)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const serviceKey = getServiceKey();
  if (!serviceKey) {
    // Return SSE-formatted error so the client renders it properly.
    // The operator fix: set FORGEOS_MYDOTS_KEY in Vercel env vars for
    // Preview + Production, then redeploy. See /api/my-dots/health.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'error', message: 'Dots backend not configured. Administrator: set FORGEOS_MYDOTS_KEY in Vercel environment variables (Preview + Production) and redeploy. Check /api/my-dots/health for status.' })}\n\n`
        ));
        controller.close();
      },
    });
    return new Response(stream, {
      status: 503,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const dotName = String(body.dotName || 'Scout');
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0 || messages.length > __MAX_MESSAGES) {
    return new Response('Invalid messages', { status: 400 });
  }
  let totalChars = 0;
  for (const m of messages) totalChars += String(m?.content || '').length;
  if (totalChars > __MAX_CHARS) {
    return new Response('Request too large', { status: 413 });
  }

  const persona = getDotPersona(dotName);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      try {
        send({ type: 'meta', dot: dotName, role: persona.role });

        // Run the full Dot turn (tool loop included) via shared core
        const result = await runDotChat(serviceKey, dotName, messages);

        // Emit tool trace events
        for (const t of result.toolTrace) {
          send({
            type: 'tool',
            capability: t.capability,
            operation: t.operation,
            success: t.success,
            denied: !!t.denied,
          });
        }

        // Stream the final text in word chunks (responsive UX)
        const words = result.text.split(/(\s+)/);
        let buf = '';
        for (const w of words) {
          buf += w;
          if (buf.length >= 24) {
            send({ type: 'token', text: buf });
            buf = '';
            // Small yield to flush
            await new Promise((r) => setTimeout(r, 12));
          }
        }
        if (buf) send({ type: 'token', text: buf });

        send({ type: 'done', toolCount: result.toolTrace.length });
      } catch (e: any) {
        const msg =
          e?.name === 'AbortError' ? 'request timed out' : e?.message || 'unknown error';
        send({ type: 'error', error: `${dotName} could not reach ForgeOS AI: ${msg}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
