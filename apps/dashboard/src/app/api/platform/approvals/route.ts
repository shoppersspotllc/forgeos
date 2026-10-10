import { NextRequest, NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO } from '@/lib/platform/store';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/** GET /api/platform/approvals — list the approval queue (pending first). */
export async function GET() {
  const pending = store.approvals.filter((a) => a.status === 'pending');
  const decided = store.approvals.filter((a) => a.status !== 'pending');
  return NextResponse.json(envelope({ pending, decided, pendingCount: pending.length }));
}

/**
 * POST /api/platform/approvals — approve or reject a queued draft.
 * Approving records a SIMULATED send: audited, but nothing is transmitted.
 * Drafted is never the same as sent.
 */
export async function POST(req: NextRequest) {
  let body: { id?: string; action?: 'approve' | 'reject'; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(envelope({ error: 'Invalid JSON body' }), { status: 400 });
  }
  const item = store.approvals.find((a) => a.id === body.id);
  if (!item) {
    return NextResponse.json(envelope({ error: 'Approval item not found' }), { status: 404 });
  }
  if (item.status !== 'pending') {
    return NextResponse.json(envelope({ error: `Already decided (${item.status})` }), { status: 409 });
  }
  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json(envelope({ error: "action must be 'approve' or 'reject'" }), { status: 400 });
  }
  const now = new Date().toISOString();
  item.status = body.action === 'approve' ? 'approved' : 'rejected';
  item.decidedAt = now;
  item.decisionNote = typeof body.note === 'string' ? body.note.slice(0, 280) : null;

  const lead = store.leads.find((l) => l.id === item.leadId);
  if (item.status === 'approved') {
    // SIMULATED SEND — no email/SMS/API call is made, by design.
    if (lead) {
      lead.lastFollowUpAt = now;
      if (lead.status === 'quote_sent') lead.status = 'followed_up';
    }
    store.logActivity(
      'owner',
      'simulated_send',
      item.id,
      `SIMULATED ${item.channel} send approved for lead ${item.leadId}. Nothing was actually transmitted.`
    );
    store.logAudit(
      'send_approved_simulated',
      item.id,
      'ok',
      'Owner approved; send SIMULATED (no transmission). Drafted != sent.',
      'owner approval (this request)'
    );
  } else {
    store.logActivity('owner', 'draft_rejected', item.id, `Draft rejected${item.decisionNote ? `: ${item.decisionNote}` : ''}`);
    store.logAudit('draft_rejected', item.id, 'ok', item.decisionNote ?? 'no reason given', 'owner approval (this request)');
  }
  return NextResponse.json(envelope({ approval: item }));
}
