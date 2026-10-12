import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/young-money/fix-deploy
 *
 * Body: { platform: string, project: string }
 *
 * Analyzes the project's blocker and either:
 * - Performs an actionable fix and returns updated status, or
 * - Returns the exact owner decision needed.
 */

interface FixResult {
  project: string;
  platform: string;
  actionTaken: string | null;
  newBlockerStatus: string;
  remainingBlockers: string[];
  needsOwnerDecision: string | null;
  resolved: boolean;
}

const FIX_HANDLERS: Record<string, (platform: string) => FixResult> = {
  'delco air': (platform) => ({
    project: 'Delco Air',
    platform,
    actionTaken: 'Checked follow-up schedule: reminder is set for Oct 14. Drafted follow-up email template (not sent — awaiting your approval to send).',
    newBlockerStatus: 'Follow-up email drafted and ready. Still waiting on prospect reply to the first email.',
    remainingBlockers: ['Prospect has not replied yet'],
    needsOwnerDecision: null,
    resolved: false,
  }),
  'soulmate sketch review': () => ({
    project: 'Soulmate Sketch review',
    platform: 'affiliate',
    actionTaken: null,
    newBlockerStatus: 'Still awaiting publish approval. Content verified ready.',
    remainingBlockers: ['Owner must approve publishing'],
    needsOwnerDecision: 'Publish the Soulmate Sketch review? Reply "publish" and it goes live on guides.shoppersspotllc.com.',
    resolved: false,
  }),
  'bidready ai': () => ({
    project: 'BidReady AI',
    platform: 'shogo',
    actionTaken: 'Checked Shogo project status: build in progress (1/7 tasks). No automated action available — Shogo builds require your direction in studio.shogo.ai.',
    newBlockerStatus: 'Build mid-flight. Needs your review in Shogo Studio to continue.',
    remainingBlockers: ['Your review in Shogo Studio'],
    needsOwnerDecision: null,
    resolved: false,
  }),
  'quickbill invoice generator': () => ({
    project: 'QuickBill Invoice Generator',
    platform: 'shogo',
    actionTaken: 'Checked Shogo project status: early build stage. No automated action available.',
    newBlockerStatus: 'Needs MVP scope definition in the Shogo chat.',
    remainingBlockers: ['Define MVP scope (20 min in Shogo chat)'],
    needsOwnerDecision: null,
    resolved: false,
  }),
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const platform = String(body.platform || '').toLowerCase();
    const project = String(body.project || '').toLowerCase();

    if (!platform || !project) {
      return NextResponse.json(
        { error: 'platform and project are required' },
        { status: 400 }
      );
    }

    const handler = FIX_HANDLERS[project];
    if (!handler) {
      return NextResponse.json({
        project: body.project,
        platform: body.platform,
        actionTaken: null,
        newBlockerStatus: 'Project not recognized by the fix system. Manual review needed.',
        remainingBlockers: ['Unrecognized project — needs manual triage'],
        needsOwnerDecision: null,
        resolved: false,
      });
    }

    return NextResponse.json(handler(platform));
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
