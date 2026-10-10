import { NextRequest, NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO } from '@/lib/platform/store';
import { authorizeRequest } from '@/lib/platform/auth';
import { buildBriefing } from '@/lib/platform/rules';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/**
 * GET /api/platform/briefing — daily business briefing (Tool 4 slice) for
 * this tenant. Verified-data-only: every section carries source, freshness,
 * and period labels, plus explicit missing-data disclosure. Demo data is
 * labeled as such.
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeRequest(req);
  if (!auth.ok) return NextResponse.json(envelope({ error: auth.error }), { status: auth.status });
  const sections = buildBriefing(store.leadsOf(auth.tenantId));
  return NextResponse.json(
    envelope({
      generatedAt: new Date().toISOString(),
      dataMode: DATA_MODE,
      sections,
    })
  );
}
