import { NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO } from '@/lib/platform/store';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/** GET /api/platform/activity — append-only activity history (TEST). */
export async function GET() {
  return NextResponse.json(
    envelope({
      activity: [...store.activity].reverse(),
      audit: [...store.audit].reverse(),
      count: store.activity.length,
      auditCount: store.audit.length,
    })
  );
}
