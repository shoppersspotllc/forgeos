import { NextRequest, NextResponse } from 'next/server';
import { CAPABILITIES, Capability } from '@/lib/capabilities';

async function probeCapability(cap: Capability): Promise<Capability> {
  // Live-probe capabilities that have endpoints
  if (cap.id === 'colibri' && cap.endpoint) {
    try {
      const res = await fetch(`${cap.endpoint}/api/version`, {
        signal: AbortSignal.timeout(3000),
      });
      return { ...cap, available: res.ok };
    } catch {
      return { ...cap, available: false };
    }
  }
  if (cap.id === 'forgeos-ai' && cap.endpoint) {
    try {
      const res = await fetch(`${cap.endpoint}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      // 401 = service up but needs auth; 200 = healthy
      return { ...cap, available: res.ok || res.status === 401 };
    } catch {
      return { ...cap, available: false };
    }
  }
  return cap;
}

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category');
  
  const probed = await Promise.all(CAPABILITIES.map(probeCapability));
  const filtered = category ? probed.filter(c => c.category === category) : probed;
  
  return NextResponse.json({
    capabilities: filtered,
    total: filtered.length,
    available: filtered.filter(c => c.available).length,
    portable: true,
    version: '2.0.0',
    liveProbed: true,
  });
}
