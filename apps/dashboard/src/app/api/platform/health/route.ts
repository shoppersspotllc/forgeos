import { NextResponse } from 'next/server';
import { store, DATA_MODE, DEMO } from '@/lib/platform/store';
import { runHealthChecks, probeGateway } from '@/lib/platform/rules';

const envelope = (data: unknown) => ({ demo: DEMO, dataMode: DATA_MODE, data });

/**
 * GET /api/platform/health — workflow health checks (Tool 5 slice).
 * Reports what was actually checked with evidence; distinguishes monitored
 * conditions from untested areas. Never claims a check passed without evidence.
 */
export async function GET() {
  const pending = store.approvals.filter((a) => a.status === 'pending');
  const oldest = pending.length
    ? pending.map((a) => a.createdAt).sort()[0]
    : null;
  const gatewayReachable = await probeGateway(1500);
  const checks = await runHealthChecks({
    leadCount: store.leads.length,
    pendingApprovals: pending.length,
    oldestPendingApprovalAt: oldest,
    gatewayReachable,
  });
  const failed = checks.filter((c) => c.status === 'fail').length;
  return NextResponse.json(
    envelope({
      checkedAt: new Date().toISOString(),
      overall: failed === 0 ? 'healthy' : 'attention_needed',
      checks,
    })
  );
}
