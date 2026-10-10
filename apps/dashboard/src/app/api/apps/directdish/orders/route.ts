import { NextResponse } from 'next/server';

export async function GET() {
  const store = globalThis as unknown as { __directdish_orders?: Array<object> };
  const orders = store.__directdish_orders || [];
  const safe = orders.map((o: Record<string, unknown>) => ({
    app: o.app,
    orderType: o.orderType,
    items: o.items,
    amountTotal: o.amountTotal,
    currency: o.currency,
    paidAt: o.paidAt,
    testMode: o.testMode,
  }));
  return NextResponse.json({
    orders: safe,
    count: safe.length,
    warning: 'Test mode: in-memory only, lost on restart',
  });
}
