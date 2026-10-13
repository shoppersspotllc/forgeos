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
 * PinDrop — Outreach Intelligence API
 *
 * POST /api/pindrop/analyze
 *
 * Server-side route that authenticates to ForgeOS AI using PinDrop's
 * dedicated ForgeOS service credential (fk_...).
 *
 * The credential is stored server-side only in FORGEOS_PINDROP_KEY
 * (Vercel env var, encrypted). It NEVER touches browser code.
 *
 * PinDrop business context (from ForgeOS operations):
 * - Mission: Turn 1,850 monthly credits into maximum revenue via pindrop.host
 * - Cycle: ANALYSE → DEVELOP → MARKET → FOLLOWUP → ENCASH
 * - 7 verified TX HVAC prospects; Midair (75/75) is top target
 * - Outreach drafts HELD awaiting owner's call (phone vs email)
 * - Credit discipline: every credit tracked, no spend without projected ROI
 * - Team: Scout, Analyst, Craftsman, Hunter, Shepherd, Closer (via My Dots)
 * - Payouts ready via Stripe; revenue currently $0
 *
 * CRITICAL — NO FABRICATION RULE:
 * AI must NEVER invent: business facts, services, addresses, phone numbers,
 * reviews, certifications, pricing, staff, customer claims, locations,
 * credentials, business history, or other unverifiable information.
 * If information is unavailable, say so explicitly. Use approved fallback
 * behavior. Outreach must be honest. Compliance must be clean.
 *
 * This route provides AI-powered PinDrop analysis (prospect research,
 * outreach copywriting, business analysis). It does NOT:
 * - trigger paid builds or consume credits
 * - send outreach or sales messages
 * - duplicate builds or bypass credit accounting
 *
 * Request body:
 *   { query: string } — analysis question
 *   OR
 *   { messages: [{ role, content }] } — full message array
 *
 * Response: ForgeOS AI chat completion result
 */

const FORGEOS_AI_CHAT = 'https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat';

const PINDROP_SYSTEM_PROMPT = `You are PinDrop AI, the outreach intelligence analyst for ForgeOS/Baxter PinDrop operations.

BUSINESS CONTEXT:
- PinDrop turns monthly credits into revenue via pindrop.host (outreach platform).
- Current: 7 verified TX HVAC prospects; Midair (75/75) is the top target.
- Outreach drafts are HELD awaiting the owner's decision (phone vs email).
- Credit discipline: 1,850/2,000 credits remaining. Every credit tracked. No spend without projected ROI.
- Team: Scout (research), Analyst (strategy), Craftsman (copywriting), Hunter (outreach), Shepherd (follow-up), Closer (deals).
- Payouts ready via Stripe. Revenue: $0 (pre-launch).

CRITICAL — NO FABRICATION RULE (highest priority):
You must NEVER invent or hallucinate:
- Business facts, services offered, addresses, phone numbers
- Customer reviews, testimonials, ratings
- Certifications, licenses, awards
- Pricing, quotes, estimates
- Staff names, employee counts, business history
- Customer claims, case studies, success stories
- Business locations, hours, service areas (beyond what is provided)

If information is unavailable or unverified:
- Say so explicitly: "This information is not verified" or "Not available in the provided data."
- Do NOT fill gaps with plausible-sounding inventions.
- Suggest what information would be needed to complete the analysis.

ADDITIONAL RULES:
- Outreach copy must be honest. No false urgency, no fake social proof.
- Respect credit discipline: flag when a task would consume credits.
- Do not trigger outreach sends, paid builds, or sales actions — you provide analysis only.
- Preserve the ANALYSE → DEVELOP → MARKET → FOLLOWUP → ENCASH workflow.
- Keep responses concise but complete.`;

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

  let messages: { role: string; content: string }[];
  if (body.messages && Array.isArray(body.messages)) {
    messages = body.messages.filter((m: any) => m.role !== 'system');
  } else if (body.query && typeof body.query === 'string' && body.query.trim()) {
    messages = [
      { role: 'system', content: PINDROP_SYSTEM_PROMPT },
      { role: 'user', content: body.query.trim() },
    ];
  } else {
    return NextResponse.json(
      { error: 'Provide either "query" (string) or "messages" (array)' },
      { status: 400 }
    );
  }

  // PinDrop's ForgeOS service credential — server-side only
  // Enforce request caps
  if (messages.length > __MAX_MESSAGES) {
    return NextResponse.json({ error: 'Too many messages' }, { status: 413 });
  }
  let __totalChars = 0;
  for (const m of messages) { __totalChars += String(m.content || '').length; }
  if (__totalChars > __MAX_CHARS) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  const serviceKey = process.env.FORGEOS_PINDROP_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'PinDrop service credential not configured' },
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
    const msg = (e && e.name) === 'AbortError' ? 'request timed out' : (e && e.message) || 'unknown error';
    return NextResponse.json(
      { error: `PinDrop could not reach ForgeOS AI: ${msg}` },
      { status: 502 }
    );
  }
}
