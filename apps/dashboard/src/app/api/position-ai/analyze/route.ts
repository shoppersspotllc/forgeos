import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
// Phase 2.1: Request caps
const __MAX_MESSAGES = 100;
const __MAX_CHARS = 100000;

// Phase 2.1: Minimal in-memory rate limiter (per-instance, not distributed)
// For distributed protection, use Vercel KV/Upstash in future.
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
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}


/**
 * Position AI — Strategic Intelligence API
 *
 * POST /api/position-ai/analyze
 *
 * Server-side route that authenticates to ForgeOS AI using Position AI's
 * dedicated ForgeOS service credential (fk_...).
 *
 * The credential is stored server-side only in FORGEOS_POSITION_AI_KEY
 * (Vercel env var, encrypted). It NEVER touches browser code.
 *
 * Request body:
 *   { query: string }  — strategic question to analyze
 *   OR
 *   { messages: [{role, content}] } — full message array
 *
 * Response: ForgeOS AI chat completion result
 */

const FORGEOS_AI_CHAT = 'https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat';
// Local fallback for dev (when FORGEOS_AI_CHAT is unreachable, use in-process)
const POSITION_SYSTEM_PROMPT =
  'You are Position AI, a strategic intelligence analyst for ForgeOS. Provide concise strategic positioning analysis.';

export async function POST(req: NextRequest) {
  // Rate limit: 30 req/min per IP
  const __ip = __getIp(req);
  if (!__checkRate('rl:' + __ip, 30, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch (_e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Build messages from query or use provided messages
  let messages: { role: string; content: string }[];
  if (body.messages && Array.isArray(body.messages)) {
    messages = body.messages.filter((m: any) => m.role !== 'system');
  } else if (body.query && typeof body.query === 'string' && body.query.trim()) {
    messages = [
      { role: 'system', content: POSITION_SYSTEM_PROMPT },
      { role: 'user', content: body.query.trim() },
    ];
  } else {
    return NextResponse.json(
      { error: 'Provide either "query" (string) or "messages" (array)' },
      { status: 400 }
    );
  }

  // Position AI's ForgeOS service credential — server-side only
  // Enforce request caps
  if (messages.length > __MAX_MESSAGES) {
    return NextResponse.json({ error: 'Too many messages' }, { status: 413 });
  }
  let __totalChars = 0;
  for (const m of messages) { __totalChars += String(m.content || '').length; }
  if (__totalChars > __MAX_CHARS) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  const serviceKey = process.env.FORGEOS_POSITION_AI_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Position AI service credential not configured' },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(FORGEOS_AI_CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        messages,
        capability: 'chat',
      }),
      signal: AbortSignal.timeout(120000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || 'ForgeOS AI request failed', details: data.details },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (e: any) {
    const msg = (e && e.name) === 'AbortError' ? 'request timed out' : (e && e.message) || 'unknown error';
    return NextResponse.json(
      { error: `Position AI could not reach ForgeOS AI: ${msg}` },
      { status: 502 }
    );
  }
}
