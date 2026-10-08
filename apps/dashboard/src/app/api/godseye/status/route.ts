import { NextResponse } from 'next/server';

const GODS_EYE_URL = process.env.GODS_EYE_URL || 'http://100.87.82.46:4173';

export async function GET() {
  try {
    const res = await fetch(GODS_EYE_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({ reachable: res.ok, url: GODS_EYE_URL });
  } catch {
    return NextResponse.json({ reachable: false, url: GODS_EYE_URL });
  }
}
