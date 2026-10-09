import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
// Phase 2.1: Request caps
const __MAX_MESSAGES = 100;
const __MAX_CHARS = 100000;

// Phase 2.1: Minimal in-memory rate limiter (per-instance, not distributed)
// For distributed protection, use Vercel KV/Upstash in future.
const __rateBuckets = new Map();
function __checkRate(key, maxReq, windowMs) {
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
function __getIp(req) {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}


/**
 * Quant — Trading Research AI API
 *
 * POST /api/quant/analyze
 *
 * Server-side route that authenticates to ForgeOS AI using Quant's
 * dedicated ForgeOS service credential (fk_...).
 *
 * The credential is stored server-side only in FORGEOS_QUANT_KEY
 * (Vercel env var, encrypted). It NEVER touches browser code.
 *
 * Quant domain context (from ForgeOS memory):
 * - Status: RESEARCH_HOLD — no deployable strategy (honest assessment)
 * - Capital: $20 hard cap, $0 currently at risk, paper-only
 * - Live trading: DISABLED (no viable strategy + explicit owner gates required)
 * - Risk controls: hard loss boundary, no leverage beyond cap, no auto-increase
 *
 * This route provides AI-powered trading RESEARCH and ANALYSIS only.
 * It does NOT execute trades, place orders, or move funds.
 *
 * Request body:
 *   { query: string } — research question
 *   OR
 *   { messages: [{ role, content }] } — full message array
 *
 * Response: ForgeOS AI chat completion result
 */

const FORGEOS_AI_CHAT = 'https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat';

const QUANT_SYSTEM_PROMPT = `You are Quant, the trading research analyst for ForgeOS/Baxter.

DOMAIN CONTEXT (must respect in all analysis):
- Status: RESEARCH_HOLD — no deployable strategy has been validated. Be honest about uncertainty.
- Capital: $20 hard ceiling on live capital-at-risk. Currently $0 at risk. Paper trading only.
- Live trading is DISABLED. Never recommend live deployment without explicit validation gates.
- Risk controls: hard loss boundary, no leverage beyond authorized capital, no auto-increase of position size.
- Past research: 5 strategy families tested across 2 regimes (534 daily candles, walk-forward validation) — no defensible edge found. Do not overstate backtest results.
- Never fabricate: returns, Sharpe ratios, win rates, or tradable edges.

YOUR ROLE:
- Provide rigorous, honest quantitative research and market analysis.
- When asked about strategies, discuss methodology, required validation (hypothesis, dataset, OOS testing, cost sensitivity, regime robustness), and stopping conditions.
- Capital preservation is the highest priority. Default to caution.
- If asked to execute trades or move funds, decline — you are a research analyst, not an execution system.
- Keep analysis concise but complete. Cite assumptions explicitly.`;

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
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let messages: { role: string; content: string }[];
  if (body.messages && Array.isArray(body.messages)) {
    messages = body.messages.filter((m: any) => m.role !== 'system');
  } else if (body.query && typeof body.query === 'string' && body.query.trim()) {
    messages = [
      { role: 'system', content: QUANT_SYSTEM_PROMPT },
      { role: 'user', content: body.query.trim() },
    ];
  } else {
    return NextResponse.json(
      { error: 'Provide either "query" (string) or "messages" (array)' },
      { status: 400 }
    );
  }

  // Quant's ForgeOS service credential — server-side only
  // Enforce request caps
  if (messages.length > __MAX_MESSAGES) {
    return NextResponse.json({ error: 'Too many messages' }, { status: 413 });
  }
  let __totalChars = 0;
  for (const m of messages) { __totalChars += String(m.content || '').length; }
  if (__totalChars > __MAX_CHARS) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  const serviceKey = process.env.FORGEOS_QUANT_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Quant service credential not configured' },
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
      body: JSON.stringify({ messages, capability: 'chat' }),
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
    const msg = e?.name === 'AbortError' ? 'request timed out' : e?.message || 'unknown error';
    return NextResponse.json(
      { error: `Quant could not reach ForgeOS AI: ${msg}` },
      { status: 502 }
    );
  }
}
