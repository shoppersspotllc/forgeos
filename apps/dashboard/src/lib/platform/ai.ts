/**
 * Young Money Platform — follow-up drafting helper.
 *
 * ZERO-SPEND POLICY: this scaffold never calls a paid AI provider.
 *
 * Intended live path (NOT enabled here): the platform server route calls the
 * existing ForgeOS AI server-route pattern (browser → platform server route
 * holding a provisioned platform service credential → ForgeOS AI gateway).
 * That path requires (a) a provisioned `fk_` platform credential stored in the
 * approved secret store and (b) PLATFORM_AI_DRAFTS=1. Neither exists in this
 * scaffold, so every draft below is a deterministic TEST stub.
 *
 * The stub is always labeled: aiGenerated=false, provider/model=null, and a
 * note stating it is a TEST stub. AI output is never presented as real.
 */

import type { Lead } from './store';

export interface DraftResult {
  draft: string;
  channel: 'sms' | 'email';
  aiGenerated: boolean;
  provider: string | null;
  model: string | null;
  note: string;
}

const LIVE_DRAFTS_ENABLED = process.env.PLATFORM_AI_DRAFTS === '1';

function templateDraft(lead: Lead, channel: 'sms' | 'email'): string {
  const firstName = lead.customerName.replace(/^DEMO — /, '').split(' ')[0];
  const tradeLabel =
    lead.trade === 'HVAC' ? 'AC' : lead.trade === 'Plumbing' ? 'plumbing' : 'electrical';
  if (channel === 'sms') {
    return (
      `Hi ${firstName}, this is a TEST draft from [Your Shop]. ` +
      `Just checking in on the ${tradeLabel} quote ($${lead.quoteAmount}) we sent over. ` +
      `Happy to answer any questions or lock in a time — reply YES and we'll take care of it. ` +
      `[SIMULATED — not sent]`
    );
  }
  return (
    `Subject: Quick check-in on your ${tradeLabel} quote (TEST draft)\n\n` +
    `Hi ${firstName},\n\n` +
    `This is a TEST draft from [Your Shop]. We sent a $${lead.quoteAmount} quote for your ${tradeLabel} work ` +
    `and wanted to make sure you had everything you need. If the timing or price needs adjusting, ` +
    `just reply and we'll sort it out.\n\n` +
    `Thank you,\n[Your Shop]\n\n[SIMULATED — not sent]`
  );
}

export async function draftFollowUp(lead: Lead, channel: 'sms' | 'email'): Promise<DraftResult> {
  // Live path is intentionally not wired in this scaffold: no platform service
  // credential exists and zero-spend policy forbids paid inference without approval.
  if (LIVE_DRAFTS_ENABLED) {
    return {
      draft: templateDraft(lead, channel),
      channel,
      aiGenerated: false,
      provider: null,
      model: null,
      note:
        'PLATFORM_AI_DRAFTS=1 was set, but no platform service credential is provisioned in this scaffold — ' +
        'fell back to the labeled TEST stub. Live AI drafting remains disabled by design.',
    };
  }
  return {
    draft: templateDraft(lead, channel),
    channel,
    aiGenerated: false,
    provider: null,
    model: null,
    note:
      'TEST stub draft (template-based). The ForgeOS AI server-route pattern is the intended live path; ' +
      'it requires a provisioned platform credential and explicit approval before any paid inference.',
  };
}
