/**
 * GET /api/young-money/daily-report
 *
 * Generates a daily campaign report for Young Money Experiment #1.
 * Covers: published content, impressions, visitors, clicks, conversions,
 * commissions — all from real tracked data. Never fabricates values.
 */

import { NextResponse } from 'next/server';
import { getStats, getEvents } from '@/lib/revenue/tracker';

export async function GET() {
  const stats = getStats(false); // genuine only, no tests
  const recentClicks = getEvents('affiliate', 'click', 10, false);
  const recentConversions = getEvents('affiliate', 'conversion', 10, false);

  const report = {
    date: new Date().toISOString().split('T')[0],
    generatedAt: new Date().toISOString(),
    experiment: 'Young Money Experiment #1 — Soulmate Sketch',
    publishedContent: {
      guide: {
        url: 'https://guides.shoppersspotllc.com/guides/soulmate-sketch',
        status: 'LIVE',
      },
      devtoArticle: {
        url: 'https://dev.to/shoppers_spot_5aaae048176/i-researched-soulmate-sketch-so-you-dont-have-to-heres-the-honest-truth-4p7l',
        status: 'LIVE',
      },
      pinterestPins: {
        status: 'DRAFT — awaiting Standard access approval',
        count: 5,
      },
      mediumArticle: {
        status: 'DRAFT — Medium API unavailable',
        count: 1,
      },
    },
    metrics: {
      impressions: stats.totalImpressions,
      visitors: stats.totalVisitors,
      affiliateClicks: stats.totalClicks,
      conversions: stats.totalConversions,
      commissions: stats.totalCommissions,
      revenue: stats.totalRevenue,
      netRevenue: stats.netRevenue,
    },
    bySource: stats.bySource,
    recentClicks: recentClicks.map(c => ({
      timestamp: new Date(c.timestamp).toISOString(),
      source: c.source,
      utmSource: c.utmSource,
      utmCampaign: c.utmCampaign,
    })),
    recentConversions: recentConversions.map(c => ({
      timestamp: new Date(c.timestamp).toISOString(),
      source: c.source,
      amount: c.amount,
    })),
    testEventsExcluded: stats.testEventCount,
    note: 'All values from real tracked events. Zero means zero — not estimated.',
  };

  return NextResponse.json(report);
}
