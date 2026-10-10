import { NextRequest, NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO } from '@/lib/platform/store';
import { draftFollowUp } from '@/lib/platform/ai';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/**
 * POST /api/platform/leads/[id]/draft — create a follow-up draft for the approval queue.
 * Drafts are TEST stubs (see lib/platform/ai.ts). Nothing is sent here; the draft
 * enters the approval queue and only a later explicit approval records a SIMULATED send.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = store.leads.find((l) => l.id === id);
  if (!lead) {
    return NextResponse.json(envelope({ error: 'Lead not found' }), { status: 404 });
  }
  if (lead.outcome !== 'open') {
    return NextResponse.json(envelope({ error: 'Lead is not open; no follow-up needed' }), { status: 409 });
  }
  let channel: 'sms' | 'email' = 'sms';
  try {
    const body = await req.json().catch(() => ({}));
    if (body.channel === 'email') channel = 'email';
  } catch {
    /* default channel */
  }
  const result = await draftFollowUp(lead, channel);
  const item = {
    id: store.nextId('appr'),
    leadId: lead.id,
    channel: result.channel,
    draftText: result.draft,
    aiGenerated: result.aiGenerated,
    provider: result.provider,
    model: result.model,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    decidedAt: null,
    decisionNote: result.note,
    simulatedSend: true,
  };
  store.approvals.push(item);
  store.logActivity(
    'growth-dot',
    'draft_created',
    item.id,
    `TEST ${channel} draft for ${lead.customerName} queued for approval (aiGenerated=${result.aiGenerated})`
  );
  store.logAudit(
    'draft_created',
    item.id,
    'ok',
    `draft queued; aiGenerated=${result.aiGenerated}; ${result.note}`,
    'pending owner approval'
  );
  return NextResponse.json(envelope({ approval: item }), { status: 201 });
}
