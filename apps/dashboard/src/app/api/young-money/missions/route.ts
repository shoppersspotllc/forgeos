import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/young-money/missions
 *
 * POST: Create a build mission from a natural-language instruction.
 *       Parses niche, location, and count; returns a concrete plan.
 * GET:  List missions (in-memory; ephemeral on serverless).
 *
 * Mission execution is performed by Muse + Dots (browser/subagents).
 * This API is the instruction inbox and status board.
 */

interface Mission {
  id: string;
  instruction: string;
  platform: string;
  status: 'queued' | 'running' | 'done' | 'failed' | 'needs_approval';
  plan?: string;
  result?: string;
  parsed?: { niche: string; location: string; count: number };
  createdAt: string;
}

// In-memory store (ephemeral on Vercel serverless — missions are picked up
// by Muse promptly; a persistent store is a future upgrade).
const missions: Mission[] = [];

function parseInstruction(text: string): { niche: string; location: string; count: number } {
  const lower = text.toLowerCase();

  // Count: "create 3 websites", "build 2 sites", default 3
  const countMatch = lower.match(/(?:create|build|make)\s+(\d+)/);
  const count = countMatch ? Math.min(10, Math.max(1, parseInt(countMatch[1], 10))) : 3;

  // Niche: common patterns
  const niches = [
    'real estate', 'realtor', 'beautician', 'beauticians', 'salon', 'salons',
    'restaurant', 'restaurants', 'hvac', 'dentist', 'dentists', 'dental',
    'plumber', 'plumbers', 'plumbing', 'lawyer', 'lawyers', 'law firm',
    'gym', 'fitness', 'bakery', 'cafe', 'barber', 'spa', 'clinic',
  ];
  let niche = 'local business';
  for (const n of niches) {
    if (lower.includes(n)) { niche = n; break; }
  }

  // Location: "in Texas", "in Houston, TX", "near me", "in USA"
  let location = 'USA';
  const nearMe = lower.includes('near me');
  const inMatch = lower.match(/in\s+([a-z\s,]+?)(?:\s+for|\s*$)/);
  if (nearMe) {
    location = 'near you';
  } else if (inMatch) {
    location = inMatch[1].trim().replace(/\s+/g, ' ');
    // Clean up trailing words
    location = location.split(/\s+for\s+/)[0].trim();
  }

  return { niche, location, count };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const platform = String(body.platform || 'pindrop').toLowerCase();
    const instruction = String(body.instruction || '').trim();

    if (!instruction) {
      return NextResponse.json({ error: 'instruction is required' }, { status: 400 });
    }
    if (instruction.length > 500) {
      return NextResponse.json({ error: 'instruction too long (max 500 chars)' }, { status: 400 });
    }

    const parsed = parseInstruction(instruction);
    const estimatedCredits = parsed.count * 25; // ~25 credits per professional site (template-based)

    const mission: Mission = {
      id: `m-${Date.now().toString(36)}`,
      instruction,
      platform,
      status: 'queued',
      parsed,
      plan: `Plan: Research ${parsed.count} ${parsed.niche} prospects ${parsed.location === 'near you' ? 'near you' : 'in ' + parsed.location}, ` +
            `build professional websites (template-based, ~${estimatedCredits} credits total), ` +
            `deploy live, report URLs and status here.`,
      createdAt: new Date().toISOString(),
    };

    missions.unshift(mission);
    // Keep only recent 50
    if (missions.length > 50) missions.length = 50;

    return NextResponse.json(mission);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ missions });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || '');
    const status = String(body.status || '');
    const result = body.result ? String(body.result) : undefined;

    if (!id || !['queued', 'running', 'done', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'id and valid status required' }, { status: 400 });
    }

    const mission = missions.find((m) => m.id === id);
    if (!mission) {
      return NextResponse.json({ error: 'mission not found' }, { status: 404 });
    }

    mission.status = status as Mission['status'];
    if (result) mission.result = result;

    return NextResponse.json(mission);
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
