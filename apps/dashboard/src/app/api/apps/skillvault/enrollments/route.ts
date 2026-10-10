import { NextResponse } from 'next/server';

export async function GET() {
  const store = globalThis as unknown as { __skillvault_enrollments?: Array<object> };
  const enrollments = store.__skillvault_enrollments || [];
  const safe = enrollments.map((e: Record<string, unknown>) => ({
    app: e.app,
    courseId: e.courseId,
    amountTotal: e.amountTotal,
    currency: e.currency,
    enrolledAt: e.enrolledAt,
    testMode: e.testMode,
  }));
  return NextResponse.json({
    enrollments: safe,
    count: safe.length,
    warning: 'Test mode: in-memory only, lost on restart',
  });
}
