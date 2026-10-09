/**
 * GET /api/workforce/objectives
 *
 * Returns the measurable objectives, key results, task templates,
 * and constraints for each Dot in the ForgeOS workforce.
 */

import { NextResponse } from 'next/server';
import { WORKFORCE_OBJECTIVES } from '@/lib/workforce/objectives';

export async function GET() {
  return NextResponse.json({
    objectives: WORKFORCE_OBJECTIVES,
    policy: {
      pinDropOutreach: 'HELD — research and preparation only, no contact until authorized',
      quant: 'RESEARCH-ONLY — no trading signals, no recommendations, $0 exposure',
      cost: '$0 — all capabilities use free keyless endpoints',
    },
  });
}
