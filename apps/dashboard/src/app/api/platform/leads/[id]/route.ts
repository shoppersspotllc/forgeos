import { NextRequest, NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO, type LeadOutcome } from '@/lib/platform/store';
import { authorizeRequest } from '@/lib/platform/auth';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/** PATCH /api/platform/leads/[id] — record a TEST outcome (won/lost/open) for this tenant's lead. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeRequest(req);
  if (!auth.ok) return NextResponse.json(envelope({ error: auth.error }), { status: auth.status });
  const { id } = await params;
  // Tenant-scoped lookup: another tenant's lead id resolves to 404 here,
  // so record existence is never leaked across tenants.
  const lead = store.findLead(auth.tenantId, id);
  if (!lead) {
    return NextResponse.json(envelope({ error: 'Lead not found' }), { status: 404 });
  }
  let body: { outcome?: LeadOutcome };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(envelope({ error: 'Invalid JSON body' }), { status: 400 });
  }
  if (body.outcome !== 'open' && body.outcome !== 'won' && body.outcome !== 'lost') {
    return NextResponse.json(envelope({ error: 'outcome must be open, won, or lost' }), { status: 400 });
  }
  lead.outcome = body.outcome;
  lead.status = body.outcome === 'open' ? lead.status : body.outcome;
  store.logActivity(auth.tenantId, 'growth-dot', 'outcome_recorded', lead.id, `TEST outcome set to ${body.outcome}`);
  store.logAudit(auth.tenantId, 'outcome_recorded', lead.id, 'ok', `outcome=${body.outcome} (TEST)`, 'n/a (demo)');
  return NextResponse.json(envelope({ lead }));
}
