import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
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
 * My Dots — Workforce AI Chat API
 *
 * POST /api/my-dots/chat
 *
 * Server-side route that authenticates to ForgeOS AI using My Dots'
 * dedicated ForgeOS service credential (fk_...).
 *
 * The credential is stored server-side only in FORGEOS_MYDOTS_KEY
 * (Vercel env var, encrypted). It NEVER touches browser code.
 *
 * Request body:
 *   {
 *     dot: { name: string, role: string, specialty: string, capability?: string },
 *     messages: [{ role: 'user'|'assistant', content: string }]
 *   }
 *   OR (simple):
 *   {
 *     dotName: string,
 *     message: string
 *   }
 *
 * The Dot's system prompt (persona) is constructed server-side from the
 * dot definition, preserving existing Dot roles/specialties. Inference
 * comes from ForgeOS AI — the Dot's identity and behavior are unchanged.
 *
 * Response: ForgeOS AI chat completion result
 */

const FORGEOS_AI_CHAT = 'https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat';

// Known Dot personas (server-side source of truth).
// The client may also pass dot details; these defaults preserve existing behavior.
const DOT_PERSONAS: Record<string, { role: string; specialty: string; capability: string }> = {
  Scout: { role: 'Research Specialist', specialty: 'Market intelligence & discovery', capability: 'chat' },
  Analyst: { role: 'Data Analyst', specialty: 'Deep analysis & insights', capability: 'chat' },
  Craftsman: { role: 'Build Engineer', specialty: 'Implementation & construction', capability: 'chat' },
  Hunter: { role: 'Outreach Specialist', specialty: 'Lead engagement & conversion', capability: 'chat' },
  Shepherd: { role: 'Relationship Manager', specialty: 'Nurturing & follow-up', capability: 'chat' },
  Closer: { role: 'Deal Closer', specialty: 'Final conversion & revenue', capability: 'chat' },
};

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

  // Resolve dot identity
  let dotName: string;
  let dotRole: string;
  let dotSpecialty: string;
  let capability = 'chat';
  let userMessages: { role: string; content: string }[];

  if (body.dot && typeof body.dot.name === 'string') {
    dotName = body.dot.name;
    const known = DOT_PERSONAS[dotName];
    dotRole = body.dot.role || known?.role || 'AI Specialist';
    dotSpecialty = body.dot.specialty || known?.specialty || 'General assistance';
    capability = body.dot.capability || known?.capability || 'chat';
    userMessages = Array.isArray(body.messages) ? body.messages : [];
  } else if (typeof body.dotName === 'string' && typeof body.message === 'string') {
    dotName = body.dotName;
    const known = DOT_PERSONAS[dotName];
    if (!known) {
      return NextResponse.json({ error: `Unknown dot: ${dotName}` }, { status: 400 });
    }
    dotRole = known.role;
    dotSpecialty = known.specialty;
    capability = known.capability;
    userMessages = [{ role: 'user', content: body.message }];
  } else {
    return NextResponse.json(
      { error: 'Provide either { dot: { name, ... }, messages: [...] } or { dotName, message }' },
      { status: 400 }
    );
  }

  if (userMessages.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  // Construct the Dot's system prompt server-side (persona preserved)
  const messages = [
    {
      role: 'system',
      content: `You are ${dotName}, a ${dotRole} in the ForgeOS AI workforce. Specialty: ${dotSpecialty}. Respond as ${dotName} would.`,
    },
    ...userMessages.filter(m => m.role !== 'system'),
  ];

  // My Dots' ForgeOS service credential — server-side only
  const serviceKey = process.env.FORGEOS_MYDOTS_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'My Dots service credential not configured' },
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
      body: JSON.stringify({ messages, capability }),
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
      { error: `${dotName} could not reach ForgeOS AI: ${msg}` },
      { status: 502 }
    );
  }
}
