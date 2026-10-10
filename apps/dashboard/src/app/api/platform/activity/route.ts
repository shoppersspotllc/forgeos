import { NextRequest, NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO } from '@/lib/platform/store';
import { authorizeRequest } from '@/lib/platform/auth';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/** GET /api/platform/activity — this tenant's append-only activity history (TEST). */
export async function GET(req: NextRequest) {
  const auth = await authorizeRequest(req);
  if (!auth.ok) return NextResponse.json(envelope({ error: auth.error }), { status: auth.status });
  const activity = store.activityOf(auth.tenantId);
  const audit = store.auditOf(auth.tenantId);
  return NextResponse.json(
    envelope({
      activity: [...activity].reverse(),
      audit: [...audit].reverse(),
      count: activity.length,
      auditCount: audit.length,
    })
  );
}
