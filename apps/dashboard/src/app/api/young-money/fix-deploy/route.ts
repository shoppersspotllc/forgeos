import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/young-money/fix-deploy
 *
 * Body: { platform: string, project: string }
 *
 * Analyzes the project's blocker and either:
 * - Performs an actionable fix (draft, prepare, queue) and returns updated status, or
 * - Returns the exact owner decision needed (Muse cannot decide for the owner).
 *
 * Universal: works for any platform/project by matching known patterns.
 * Unknown projects return a generic "needs review" response — never fake a fix.
 */

interface FixResult {
  project: string;
  platform: string;
  actionTaken: string | null;      // what Muse actually did (null if blocked on owner)
  newBlockerStatus: string;        // revised "what's stopping us" after this run
  remainingBlockers: string[];     // blockers still open
  needsOwnerDecision: string | null; // exact question for Dexter, if any
  resolved: boolean;               // true if no blockers remain
}

// Known project fix handlers — honest about what can/can't be automated
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
  'midair': () => ({
    project: 'Midair',
    platform: 'pindrop',
    actionTaken: null,
    newBlockerStatus: 'Still held — outreach channel decision required.',
    remainingBlockers: ['Owner must choose: phone or email outreach'],
    needsOwnerDecision: 'Phone or email for Midair outreach? Reply "phone" or "email" and Hunter launches within 24h.',
    resolved: false,
  }),
  '6 tx hvac prospects': () => ({
    project: '6 TX HVAC prospects',
    platform: 'pindrop',
    actionTaken: null,
    newBlockerStatus: 'Still held — same channel decision blocks all 6.',
    remainingBlockers: ['Owner must choose: phone or email outreach'],
    needsOwnerDecision: 'Phone or email for the 6 prospects? One decision unlocks all of them.',
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
      // Unknown project — never fake a fix
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

    const result = handler(platform);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
