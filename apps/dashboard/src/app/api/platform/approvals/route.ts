import { NextRequest, NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO } from '@/lib/platform/store';
import { authorizeRequest } from '@/lib/platform/auth';
import { recordSimulatedSend } from '@/lib/platform/outbox';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/** GET /api/platform/approvals — list this tenant's approval queue (pending first). */
export async function GET(req: NextRequest) {
  const auth = await authorizeRequest(req);
  if (!auth.ok) return NextResponse.json(envelope({ error: auth.error }), { status: auth.status });
  const items = store.approvalsOf(auth.tenantId);
  const pending = items.filter((a) => a.status === 'pending');
  const decided = items.filter((a) => a.status !== 'pending');
  return NextResponse.json(envelope({ pending, decided, pendingCount: pending.length }));
}

/**
 * POST /api/platform/approvals — approve or reject a queued draft belonging
 * to this tenant. Approving records a SIMULATED send via the local outbox:
 * audited, but nothing is transmitted. Drafted is never the same as sent.
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeRequest(req);
  if (!auth.ok) return NextResponse.json(envelope({ error: auth.error }), { status: auth.status });
  let body: { id?: string; action?: 'approve' | 'reject'; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(envelope({ error: 'Invalid JSON body' }), { status: 400 });
  }
  // Tenant-scoped lookup: another tenant's approval id resolves to 404.
  const item = store.findApproval(auth.tenantId, body.id ?? '');
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

  const lead = store.findLead(auth.tenantId, item.leadId);
  if (item.status === 'approved') {
    // SIMULATED SEND — recorded in the local outbox only. No email/SMS/API
    // call is made, by design (see lib/platform/outbox.ts safety case).
    const sim = recordSimulatedSend({
      approvalId: item.id,
      leadId: item.leadId,
      tenantId: auth.tenantId,
      channel: item.channel,
      note: `SIMULATED ${item.channel} send approved for lead ${item.leadId}. Nothing was actually transmitted.`,
    });
    if (lead) {
      lead.lastFollowUpAt = now;
      if (lead.status === 'quote_sent') lead.status = 'followed_up';
    }
    store.logActivity(
      auth.tenantId,
      'owner',
      'simulated_send',
      item.id,
      `SIMULATED ${item.channel} send recorded in local outbox (${sim.id}). Nothing was actually transmitted.`
    );
    store.logAudit(
      auth.tenantId,
      'send_approved_simulated',
      item.id,
      'ok',
      'Owner approved; send SIMULATED via local outbox (no transmission). Drafted != sent.',
      'owner approval (this request)'
    );
  } else {
    store.logActivity(auth.tenantId, 'owner', 'draft_rejected', item.id, `Draft rejected${item.decisionNote ? `: ${item.decisionNote}` : ''}`);
    store.logAudit(auth.tenantId, 'draft_rejected', item.id, 'ok', item.decisionNote ?? 'no reason given', 'owner approval (this request)');
  }
  return NextResponse.json(envelope({ approval: item }));
}
