/**
 * Young Money Platform — TEST/demo data store (in-memory).
 *
 * HARD RULES:
 * - Every record here is DEMO data. Nothing is a real customer, quote, or message.
 * - All API responses from this platform include `demo: true` and `dataMode: 'TEST'`.
 * - Sends are SIMULATED: no email/SMS/API call is ever made. Approval only
 *   records an audited "simulated send" — drafted is never the same as sent.
 */

export type LeadStatus = 'new' | 'quote_sent' | 'followed_up' | 'won' | 'lost';
export type LeadOutcome = 'open' | 'won' | 'lost';

export interface Lead {
  id: string;
  /** DEMO customer name — fictional. */
  customerName: string;
  trade: 'HVAC' | 'Plumbing' | 'Electrical';
  /** Fictional 555-01xx number. Never dialed. */
  phone: string;
  quoteAmount: number;
  quoteSentAt: string; // ISO
  lastFollowUpAt: string | null; // ISO
  status: LeadStatus;
  outcome: LeadOutcome;
  notes: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalItem {
  id: string;
  leadId: string;
  channel: 'sms' | 'email';
  draftText: string;
  aiGenerated: boolean;
  provider: string | null;
  model: string | null;
  status: ApprovalStatus;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  /** Always true in this scaffold: nothing is actually transmitted. */
  simulatedSend: boolean;
}

export interface ActivityRecord {
  ts: string;
  actor: 'growth-dot' | 'bi-dot' | 'reliability-dot' | 'owner' | 'system';
  action: string;
  target: string;
  detail: string;
  demo: true;
}

/** AppOps-compatible audit record shape (see ~/workspace/appops/logs/audit.jsonl). */
export interface AuditRecord {
  ts: string;
  actor: string;
  app: 'young-money-platform';
  action: string;
  target: string;
  result: string;
  evidence: string;
  approval: string;
  mode: 'TEST';
}

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 24 * 3600 * 1000).toISOString();

function seedLeads(): Lead[] {
  return [
    {
      id: 'lead-demo-001',
      customerName: 'DEMO — Dana Homeowner',
      trade: 'HVAC',
      phone: '555-0101',
      quoteAmount: 850,
      quoteSentAt: daysAgo(6),
      lastFollowUpAt: null,
      status: 'quote_sent',
      outcome: 'open',
      notes: 'AC replacement quote sent; no follow-up yet. DEMO record.',
    },
    {
      id: 'lead-demo-002',
      customerName: 'DEMO — Pat Property',
      trade: 'Plumbing',
      phone: '555-0102',
      quoteAmount: 425,
      quoteSentAt: daysAgo(5),
      lastFollowUpAt: null,
      status: 'quote_sent',
      outcome: 'open',
      notes: 'Water heater install quote. DEMO record.',
    },
    {
      id: 'lead-demo-003',
      customerName: 'DEMO — Sam Shopowner',
      trade: 'Electrical',
      phone: '555-0103',
      quoteAmount: 1200,
      quoteSentAt: daysAgo(2),
      lastFollowUpAt: null,
      status: 'quote_sent',
      outcome: 'open',
      notes: 'Panel upgrade quote sent 2 days ago — not yet neglected. DEMO record.',
    },
    {
      id: 'lead-demo-004',
      customerName: 'DEMO — Robin Renter',
      trade: 'HVAC',
      phone: '555-0104',
      quoteAmount: 650,
      quoteSentAt: daysAgo(9),
      lastFollowUpAt: daysAgo(4),
      status: 'followed_up',
      outcome: 'open',
      notes: 'Followed up once 4 days ago; awaiting reply. DEMO record.',
    },
    {
      id: 'lead-demo-005',
      customerName: 'DEMO — Terry Tenant',
      trade: 'Plumbing',
      phone: '555-0105',
      quoteAmount: 380,
      quoteSentAt: daysAgo(12),
      lastFollowUpAt: null,
      status: 'won',
      outcome: 'won',
      notes: 'Job completed (simulated). DEMO record.',
    },
    {
      id: 'lead-demo-006',
      customerName: 'DEMO — Alex Apartment',
      trade: 'Electrical',
      phone: '555-0106',
      quoteAmount: 540,
      quoteSentAt: daysAgo(15),
      lastFollowUpAt: daysAgo(10),
      status: 'lost',
      outcome: 'lost',
      notes: 'Went with another shop (simulated). DEMO record.',
    },
  ];
}

class PlatformStore {
  leads: Lead[] = seedLeads();
  approvals: ApprovalItem[] = [];
  activity: ActivityRecord[] = [];
  audit: AuditRecord[] = [];
  private seq = 0;

  nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-demo-${String(this.seq).padStart(3, '0')}-${Date.now().toString(36)}`;
  }

  logActivity(actor: ActivityRecord['actor'], action: string, target: string, detail: string) {
    this.activity.push({ ts: new Date().toISOString(), actor, action, target, detail, demo: true });
  }

  logAudit(action: string, target: string, result: string, evidence: string, approval: string) {
    this.audit.push({
      ts: new Date().toISOString(),
      actor: 'muse',
      app: 'young-money-platform',
      action,
      target,
      result,
      evidence,
      approval,
      mode: 'TEST',
    });
  }
}

/** Module-singleton in-memory store. Volatile by design — TEST only. */
export const store = new PlatformStore();

export const DATA_MODE = 'TEST' as const;
export const DEMO = true as const;
