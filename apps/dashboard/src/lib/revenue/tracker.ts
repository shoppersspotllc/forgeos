/**
 * Young Money Revenue Tracker — honest, auditable revenue records
 *
 * Tracks real leads, conversions, commissions, and collected revenue
 * across all Young Money engines. NEVER fabricate values — every
 * record must correspond to a real-world event.
 *
 * Storage: hybrid —
 *   1. In-memory (fast, per serverless instance)
 *   2. GitHub-persisted JSONL (durable, survives deploys) — requires
 *      GITHUB_TOKEN env var with repo write access. Falls back to
 *      in-memory + console log if not configured.
 *
 * Test detection: events with ?test=1 or x-test-mode header are
 * flagged isTest=true and excluded from genuine metrics.
 */

export interface RevenueEvent {
  id: string;
  timestamp: number;
  engine: 'affiliate' | 'pindrop' | 'quant' | 'other';
  type: 'lead' | 'click' | 'conversion' | 'commission' | 'payout' | 'expense' | 'impression' | 'visitor';
  description: string;
  amount: number;
  source?: string;
  evidence?: string;
  dotName?: string;
  isTest?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface RevenueStats {
  totalRevenue: number;
  totalCommissions: number;
  totalLeads: number;
  totalClicks: number;
  totalConversions: number;
  totalImpressions: number;
  totalVisitors: number;
  totalExpenses: number;
  netRevenue: number;
  byEngine: Record<string, { revenue: number; leads: number; conversions: number }>;
  bySource: Record<string, { clicks: number; conversions: number }>;
  eventCount: number;
  testEventCount: number;
  lastUpdated: number;
}

const events: RevenueEvent[] = [];
let seq = 0;
let githubSyncQueue: RevenueEvent[] = [];
let githubSyncInProgress = false;

function isTestEvent(req?: { url?: string; headers?: Record<string, string> }): boolean {
  if (!req) return false;
  try {
    if (req.url) {
      const url = new URL(req.url, 'http://localhost');
      if (url.searchParams.get('test') === '1') return true;
    }
    const headers = req.headers || {};
    const testHeader = headers['x-test-mode'] || headers['X-Test-Mode'];
    if (testHeader === '1' || testHeader === 'true') return true;
  } catch {}
  return false;
}

async function persistToGitHub(event: RevenueEvent): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return;
  githubSyncQueue.push(event);
  if (githubSyncInProgress) return;
  githubSyncInProgress = true;
  try {
    while (githubSyncQueue.length > 0) {
      const batch = githubSyncQueue.splice(0, 10);
      const path = 'data/revenue-events.jsonl';
      // Get current file
      const getRes = await fetch(
        `https://api.github.com/repos/usaaboo75/forgeos/contents/${path}?ref=main`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' } }
      );
      let sha: string | undefined;
      let existing = '';
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
        existing = Buffer.from(data.content, 'base64').toString('utf-8');
      }
      const newLines = batch.map(e => JSON.stringify(e)).join('\n');
      const content = existing + (existing ? '\n' : '') + newLines;
      await fetch(`https://api.github.com/repos/usaaboo75/forgeos/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `revenue: ${batch.length} event(s)`,
          content: Buffer.from(content).toString('base64'),
          sha,
          branch: 'main',
        }),
      });
    }
  } catch (err) {
    console.error('[revenue] GitHub persist failed:', err);
  } finally {
    githubSyncInProgress = false;
  }
}

export function recordEvent(
  e: Omit<RevenueEvent, 'id' | 'timestamp'>,
  req?: { url?: string; headers?: Record<string, string> }
): RevenueEvent {
  const event: RevenueEvent = {
    ...e,
    id: `rev_${Date.now()}_${seq++}`,
    timestamp: Date.now(),
    isTest: isTestEvent(req) || e.isTest || false,
  };
  events.push(event);
  if (events.length > 1000) events.splice(0, events.length - 1000);
  const tag = event.isTest ? '[TEST]' : '[LIVE]';
  console.log(`[revenue]${tag} ${event.engine}/${event.type}: $${event.amount} — ${event.description}`);
  // Async persist (don't block)
  persistToGitHub(event).catch(() => {});
  return event;
}

export function getEvents(engine?: string, type?: string, limit = 100, includeTests = false): RevenueEvent[] {
  return events
    .filter(e => (!engine || e.engine === engine) && (!type || e.type === type) && (includeTests || !e.isTest))
    .slice(-limit)
    .reverse();
}

export function getStats(includeTests = false): RevenueStats {
  const filtered = includeTests ? events : events.filter(e => !e.isTest);
  const stats: RevenueStats = {
    totalRevenue: 0, totalCommissions: 0, totalLeads: 0, totalClicks: 0,
    totalConversions: 0, totalImpressions: 0, totalVisitors: 0,
    totalExpenses: 0, netRevenue: 0,
    byEngine: {}, bySource: {},
    eventCount: filtered.length,
    testEventCount: events.filter(e => e.isTest).length,
    lastUpdated: Date.now(),
  };
  for (const e of filtered) {
    if (!stats.byEngine[e.engine]) stats.byEngine[e.engine] = { revenue: 0, leads: 0, conversions: 0 };
    if (e.source && !stats.bySource[e.source]) stats.bySource[e.source] = { clicks: 0, conversions: 0 };
    switch (e.type) {
      case 'click': stats.totalClicks++; if (e.source && stats.bySource[e.source]) stats.bySource[e.source].clicks++; break;
      case 'conversion': stats.totalConversions++; if (e.source && stats.bySource[e.source]) stats.bySource[e.source].conversions++; break;
      case 'commission': stats.totalCommissions += e.amount; stats.totalRevenue += e.amount; break;
      case 'payout': stats.totalRevenue += e.amount; break;
      case 'lead': stats.totalLeads++; break;
      case 'impression': stats.totalImpressions++; break;
      case 'visitor': stats.totalVisitors++; break;
      case 'expense': stats.totalExpenses += e.amount; break;
    }
    if (e.type === 'lead') stats.byEngine[e.engine].leads++;
    if (e.type === 'conversion') stats.byEngine[e.engine].conversions++;
    if (e.type === 'commission' || e.type === 'payout') stats.byEngine[e.engine].revenue += e.amount;
  }
  stats.netRevenue = stats.totalRevenue - stats.totalExpenses;
  return stats;
}
