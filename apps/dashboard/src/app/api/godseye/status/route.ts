import { NextResponse } from 'next/server';

// God's Eye is hosted on Vercel (cloud). Probe the upstream deployment directly.
// No Tailscale, no PC, no local network required.
const GODS_EYE_URL =
  process.env.GODS_EYE_URL || 'https://forgeos-godseye.vercel.app/gods-eye-view/';

export async function GET() {
  try {
    const res = await fetch(GODS_EYE_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json({ reachable: res.ok, url: '/gods-eye' });
  } catch {
    return NextResponse.json({ reachable: false, url: '/gods-eye' });
  }
}
