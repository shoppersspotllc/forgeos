/**
 * Young Money Platform — neglect detection, briefing builder, health checks.
 * Pure functions over the TEST store. All outputs carry source/freshness labels.
 */

import type { Lead } from './store';

export const NEGLECT_AFTER_DAYS = 3;
export const STALE_AFTER_DAYS = 7;

export function daysSince(iso: string, now: number = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / (24 * 3600 * 1000));
}

/** Quotes sent >= NEGLECT_AFTER_DAYS ago with no follow-up and still open. */
export function findNeglectedLeads(leads: Lead[], now: number = Date.now()): Lead[] {
  return leads.filter(
    (l) =>
      l.outcome === 'open' &&
      l.status === 'quote_sent' &&
      l.lastFollowUpAt === null &&
      daysSince(l.quoteSentAt, now) >= NEGLECT_AFTER_DAYS
  );
}

/** Open leads with no activity for >= STALE_AFTER_DAYS. */
export function findStaleLeads(leads: Lead[], now: number = Date.now()): Lead[] {
  return leads.filter((l) => {
    if (l.outcome !== 'open') return false;
    const last = l.lastFollowUpAt ?? l.quoteSentAt;
    return daysSince(last, now) >= STALE_AFTER_DAYS;
  });
}

export interface BriefingSection {
  title: string;
  /** Where the numbers came from. */
  source: string;
  /** When the underlying data was generated. */
  freshness: string;
  /** Period the numbers cover. */
  period: string;
  lines: string[];
  missing: string[];
}

export function buildBriefing(leads: Lead[], now: number = Date.now()): BriefingSection[] {
  const neglected = findNeglectedLeads(leads, now);
  const stale = findStaleLeads(leads, now);
  const open = leads.filter((l) => l.outcome === 'open');
  const won = leads.filter((l) => l.outcome === 'won');
  const lost = leads.filter((l) => l.outcome === 'lost');
  const openValue = open.reduce((s, l) => s + l.quoteAmount, 0);
  const neglectedValue = neglected.reduce((s, l) => s + l.quoteAmount, 0);
  const freshness = new Date(now).toISOString();
  const common = {
    source: 'TEST demo lead store (in-memory seed, DEMO records only)',
    freshness: `generated ${freshness}`,
    period: 'all seeded demo records (no date filter)',
  };
  return [
    {
      title: "What happened in the business (demo)",
      ...common,
      lines: [
        `${open.length} open quotes worth $${openValue.toLocaleString()} (demo)`,
        `${won.length} won, ${lost.length} lost (simulated outcomes)`,
      ],
      missing: ['No real CRM, phone system, or accounting data connected — demo figures only.'],
    },
    {
      title: 'Quotes needing follow-up',
      ...common,
      lines:
        neglected.length === 0
          ? ['No neglected quotes right now.']
          : neglected.map(
              (l) =>
                `${l.customerName} — $${l.quoteAmount} ${l.trade} quote sent ${daysSince(l.quoteSentAt, now)} days ago, no follow-up yet`
            ),
      missing:
        neglected.length === 0
          ? []
          : ['Follow-up drafts are TEST stubs; nothing has been sent to a real person.'],
    },
    {
      title: 'Where attention is leaking',
      ...common,
      lines: [
        `${stale.length} stale open lead(s) with no activity for ${STALE_AFTER_DAYS}+ days`,
        `At-risk demo pipeline value: $${neglectedValue.toLocaleString()}`,
      ],
      missing: ['Attribution is not measured — no campaigns are running in this scaffold.'],
    },
    {
      title: 'What to prioritize tomorrow',
      ...common,
      lines:
        neglected.length === 0
          ? ['Review the approval queue; keep demo data fresh.']
          : [
              `1. Draft follow-ups for the ${neglected.length} neglected quote(s) and route them to the approval queue`,
              '2. Owner approves or rejects each draft — nothing sends without approval',
              '3. Record outcomes (won/lost) to keep the demo pipeline honest',
            ],
      missing: [],
    },
  ];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'unknown';
  evidence: string;
  /** Areas this check does NOT cover. */
  notCovered: string;
}

export async function runHealthChecks(opts: {
  leadCount: number;
  pendingApprovals: number;
  oldestPendingApprovalAt: string | null;
  gatewayReachable: boolean;
}): Promise<HealthCheck[]> {
  const now = Date.now();
  const checks: HealthCheck[] = [
    {
      name: 'demo-lead-store',
      status: opts.leadCount > 0 ? 'pass' : 'fail',
      evidence: `${opts.leadCount} demo lead(s) loaded in the in-memory TEST store`,
      notCovered: 'Persistence across restarts (store is volatile by design)',
    },
    {
      name: 'approval-queue-not-stuck',
      status:
        opts.oldestPendingApprovalAt &&
        now - new Date(opts.oldestPendingApprovalAt).getTime() > 24 * 3600 * 1000
          ? 'fail'
          : 'pass',
      evidence: `${opts.pendingApprovals} approval(s) pending; oldest pending: ${opts.oldestPendingApprovalAt ?? 'none'}`,
      notCovered: 'Actual message delivery (sends are simulated in this scaffold)',
    },
    {
      name: 'ai-draft-mode',
      status: 'pass',
      evidence: `aiMode=test-stub (zero-spend). Gateway reachable: ${opts.gatewayReachable}. Live AI drafting is disabled by design until a platform credential is provisioned and approved.`,
      notCovered: 'Real AI draft quality — the stub is template-based and labeled as such',
    },
  ];
  return checks;
}

/** Cheap, read-only gateway reachability probe. No inference, no cost. */
export async function probeGateway(timeoutMs = 2000): Promise<boolean> {
  const url = process.env.FORGEOS_AI_URL ?? 'http://127.0.0.1:8788';
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${url}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
