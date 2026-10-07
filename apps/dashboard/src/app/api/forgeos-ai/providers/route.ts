import { NextResponse } from 'next/server';

const GATEWAY = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY}/providers`, { signal: AbortSignal.timeout(20000) });
    const data = await res.json().catch(() => ({ providers: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ providers: [], error: 'Gateway unreachable' }, { status: 503 });
  }
}
