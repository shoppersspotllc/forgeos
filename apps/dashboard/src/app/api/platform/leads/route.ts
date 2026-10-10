import { NextRequest, NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO, type Lead } from '@/lib/platform/store';
import { authorizeRequest } from '@/lib/platform/auth';
import { findNeglectedLeads } from '@/lib/platform/rules';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/** GET /api/platform/leads — list TEST demo leads for this tenant, with neglect flags. */
export async function GET(req: NextRequest) {
  const auth = await authorizeRequest(req);
  if (!auth.ok) return NextResponse.json(envelope({ error: auth.error }), { status: auth.status });
  const leads = store.leadsOf(auth.tenantId);
  const neglectedIds = new Set(findNeglectedLeads(leads).map((l) => l.id));
  return NextResponse.json(
    envelope({
      leads: leads.map((l) => ({ ...l, neglected: neglectedIds.has(l.id) })),
      count: leads.length,
      neglectedCount: neglectedIds.size,
    })
  );
}

/** POST /api/platform/leads — add a TEST demo lead for this tenant. Input-validated; demo only. */
export async function POST(req: NextRequest) {
  const auth = await authorizeRequest(req);
  if (!auth.ok) return NextResponse.json(envelope({ error: auth.error }), { status: auth.status });
  let body: Partial<Lead>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(envelope({ error: 'Invalid JSON body' }), { status: 400 });
  }
  const { customerName, trade, phone, quoteAmount } = body;
  if (typeof customerName !== 'string' || customerName.trim().length === 0) {
    return NextResponse.json(envelope({ error: 'customerName is required' }), { status: 400 });
  }
  if (trade !== 'HVAC' && trade !== 'Plumbing' && trade !== 'Electrical') {
    return NextResponse.json(envelope({ error: 'trade must be HVAC, Plumbing, or Electrical' }), { status: 400 });
  }
  if (typeof quoteAmount !== 'number' || !Number.isFinite(quoteAmount) || quoteAmount <= 0) {
    return NextResponse.json(envelope({ error: 'quoteAmount must be a positive number' }), { status: 400 });
  }
  const lead: Lead = {
    id: store.nextId('lead'),
    tenantId: auth.tenantId,
    customerName: `DEMO — ${customerName.trim().slice(0, 60)}`,
    trade,
    phone: typeof phone === 'string' ? phone.slice(0, 20) : '555-0100',
    quoteAmount: Math.round(quoteAmount),
    quoteSentAt: new Date().toISOString(),
    lastFollowUpAt: null,
    status: 'quote_sent',
    outcome: 'open',
    notes: 'Manually added TEST demo lead.',
  };
  store.leads.push(lead);
  store.logActivity(auth.tenantId, 'growth-dot', 'lead_added', lead.id, `TEST demo lead added: ${lead.customerName} ($${lead.quoteAmount})`);
  store.logAudit(auth.tenantId, 'lead_added', lead.id, 'ok', 'manual TEST demo lead intake', 'n/a (demo)');
  return NextResponse.json(envelope({ lead }), { status: 201 });
}
