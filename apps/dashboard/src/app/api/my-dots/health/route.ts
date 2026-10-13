import { NextResponse } from 'next/server';
import { getServiceKey } from '@/lib/mydots/chat-core';
import { getAllowedCapabilities } from '@/lib/capabilities/executor';

/**
 * GET /api/my-dots/health
 *
 * Reports the configuration health of the native Dots backend.
 * Never exposes secret values — only whether they are present.
 *
 * Use this to diagnose 503s: if `serviceKeyConfigured` is false,
 * set FORGEOS_MYDOTS_KEY in the Vercel project for the Preview
 * (and Production) environment, then redeploy.
 */
export async function GET() {
  const key = getServiceKey();
  const configured = !!key;

  // Check per-Dot tool permissions are loaded (no key needed for this)
  const dots = ['Scout', 'Analyst', 'Craftsman', 'Hunter', 'Shepherd', 'Closer', 'MediaPilot'];
  const toolPermissions: Record<string, number> = {};
  for (const d of dots) {
    toolPermissions[d] = getAllowedCapabilities(d).length;
  }

  return NextResponse.json({
    ok: configured,
    service: 'native-dots',
    timestamp: new Date().toISOString(),
    config: {
      // Boolean only — never the actual key value
      serviceKeyConfigured: configured,
      forgeosAiEndpoint: 'https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat',
    },
    dots: dots.map((d) => ({
      name: d,
      toolCount: toolPermissions[d] ?? 0,
    })),
    ...(configured
      ? {}
      : {
          fix: 'Set FORGEOS_MYDOTS_KEY in Vercel → Project → Settings → Environment Variables, enable for Preview and Production, then redeploy.',
        }),
  });
}
