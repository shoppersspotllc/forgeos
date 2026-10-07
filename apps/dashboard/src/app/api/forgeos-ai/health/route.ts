import { NextResponse } from 'next/server';

const GATEWAY = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

async function proxy(path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${GATEWAY}${path}`, {
      ...init,
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'ForgeOS AI gateway unreachable', gateway: GATEWAY },
      { status: 503 }
    );
  }
}

export async function GET() {
  return proxy('/health');
}
