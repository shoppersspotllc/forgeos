import { NextRequest, NextResponse } from 'next/server';

// Vercel: max 60s execution (Hobby plan limit)
export const maxDuration = 60;

// Phase 2: Request caps (prevent abuse/cost exhaustion)
const MAX_MESSAGES = 100;
const MAX_TOTAL_CHARS = 100000;
const MAX_TOKENS = 4000;

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

export async function POST(req: NextRequest)  {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let messages: { role: string; content: string }[];
  if (body.messages && Array.isArray(body.messages)) {
    messages = [
      { role: 'system', content: PINDROP_SYSTEM_PROMPT },
      ...body.messages.filter((m: any) => m.role !== 'system'),
    ];
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

  // PinDrop's ForgeOS service credential — server-side only
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
      { error: `PinDrop could not reach ForgeOS AI: ${msg}` },
      { status: 502 }
    );
  }
}
