import { NextResponse } from 'next/server';

const GATEWAY = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

export async function POST() {
  try {
    const res = await fetch(`${GATEWAY}/providers/check`, {
      method: 'POST',
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Gateway unreachable' }, { status: 503 });
  }
}
