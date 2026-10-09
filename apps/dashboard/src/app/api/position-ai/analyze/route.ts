import { NextRequest, NextResponse } from 'next/server';

// Vercel: max 60s execution (Hobby plan limit)
export const maxDuration = 60;

// Phase 2: Request caps (prevent abuse/cost exhaustion)
const MAX_MESSAGES = 100;
const MAX_TOTAL_CHARS = 100000;
const MAX_TOKENS = 4000;

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

export async function POST(req: NextRequest)  {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Build messages from query or use provided messages
  let messages: { role: string; content: string }[];
  if (body.messages && Array.isArray(body.messages)) {
    messages = [
      { role: 'system', content: POSITION_AI_SYSTEM_PROMPT },
      ...body.messages.filter((m: any) => m.role !== 'system'),
    ];
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
  
  // Phase 2: Enforce request caps
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Too many messages (max ${MAX_MESSAGES})` },
      { status: 413 }
    );
  }
  const totalChars = messages.reduce((sum: number, m: any) => sum + String(m.content || '').length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json(
      { error: `Total input too large (max ${MAX_TOTAL_CHARS} characters)` },
      { status: 413 }
    );
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
      signal: AbortSignal.timeout(50000),
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
    const msg = e?.name === 'AbortError' ? 'request timed out' : e?.message || 'unknown error';
    return NextResponse.json(
      { error: `Position AI could not reach ForgeOS AI: ${msg}` },
      { status: 502 }
    );
  }
}
