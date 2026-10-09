/**
 * Affiliate configuration — Young Money Experiment #1
 *
 * SETUP REQUIRED: Fill in CLICKBANK_NICKNAME and SOULMATE_VENDOR with
 * Abubakar's real ClickBank details. Until then, links run in TEST MODE
 * (tracking works, redirect goes to a placeholder — no commissions).
 *
 * HopLink format: https://NICKNAME.VENDOR.hop.clickbank.net/?tid=TID
 */

export const AFFILIATE_CONFIG = {
  // ⚠️ FILL IN: Abubakar's ClickBank affiliate nickname
  clickbankNickname: process.env.CLICKBANK_NICKNAME || '',
  // ⚠️ FILL IN: Soulmate Sketch vendor ID on ClickBank
  soulmateVendor: process.env.SOULMATE_VENDOR || '',

  tids: {
    soulmate_article: 'soulmate_article',
    soulmate_youtube: 'soulmate_youtube',
    soulmate_pinterest: 'soulmate_pinterest',
  } as Record<string, string>,

  // Fallback when not configured — honest test destination
  testDestination: 'https://www.clickbank.com/',
};

export function getHopLink(tid: string): { url: string; live: boolean } {
  const { clickbankNickname, soulmateVendor, tids, testDestination } = AFFILIATE_CONFIG;
  const trackingId = tids[tid];
  if (!trackingId) {
    return { url: testDestination, live: false };
  }
  if (clickbankNickname && soulmateVendor) {
    // Official ClickBank query-param format — uses hop.clickbank.net directly,
    // avoiding per-affiliate subdomain certificate issues.
    return {
      url: `https://hop.clickbank.net/?affiliate=${encodeURIComponent(clickbankNickname)}&vendor=${encodeURIComponent(soulmateVendor)}&tid=${encodeURIComponent(trackingId)}`,
      live: true,
    };
  }
  // Test mode: tracking works, no commission
  return { url: testDestination, live: false };
}

export function isAffiliateLive(): boolean {
  return !!(AFFILIATE_CONFIG.clickbankNickname && AFFILIATE_CONFIG.soulmateVendor);
}
