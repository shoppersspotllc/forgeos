import { NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO } from '@/lib/platform/store';
import { buildBriefing } from '@/lib/platform/rules';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/**
 * GET /api/platform/briefing — daily business briefing (Tool 4 slice).
 * Verified-data-only: every section carries source, freshness, and period
 * labels, plus explicit missing-data disclosure. Demo data is labeled as such.
 */
export async function GET() {
  const sections = buildBriefing(store.leads);
  return NextResponse.json(
    envelope({
      generatedAt: new Date().toISOString(),
      dataMode: DATA_MODE,
      sections,
    })
  );
}
