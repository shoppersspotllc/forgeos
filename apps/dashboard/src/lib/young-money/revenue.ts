/**
 * Young Money Revenue Ledger — Shared Module
 *
 * Tracks revenue, refunds, fees, and subscriptions across the five apps:
 * Turnvia (cleaning), Quickvia (courier), Cardiq (fitness),
 * Menova (restaurant), Craftora (learning).
 *
 * CRITICAL INVARIANTS:
 * 1. Every aggregation REQUIRES an explicit mode ('live' | 'test'). There is
 *    no code path that sums across modes.
 * 2. test_mode is set from Stripe's livemode flag — never from client input.
 * 3. Idempotency is keyed on Stripe event ID. Duplicate deliveries return
 *    { recorded: false, duplicate: true } and do NOT double-count.
 * 4. In-memory storage is VOLATILE. Lost on restart/deploy. Stripe Dashboard
 *    is the authoritative source. Production requires persistent storage
 *    (see STORAGE interface below).
 *
 * STORAGE:
 * The LedgerStorage interface allows pluggable backends. The default is
 * InMemoryStorage (volatile, for MVP). Production must implement
 * PostgresStorage or equivalent with the same interface.
 */

export type AppId = 'turnvia' | 'quickvia' | 'cardiq' | 'menova' | 'craftora';
export type RevenueMode = 'live' | 'test';
export type TransactionKind = 'payment' | 'refund' | 'subscription_payment' | 'dispute';

export interface RevenueTransaction {
  id: string; // Stripe event ID (evt_...) — idempotency key
  app: AppId;
  kind: TransactionKind;
  amount_cents: number; // positive for payments, positive for refunds (sign in aggregation)
  currency: string;
  fee_cents: number; // estimated Stripe fee (0 for refunds — Stripe keeps original fee)
  fee_estimated: boolean; // true = estimated, false = exact from Stripe API
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_refund_id?: string;
  stripe_subscription_id?: string;
  stripe_invoice_id?: string;
  test_mode: boolean; // REQUIRED — true = Stripe test mode
  plan_or_package_id?: string;
  items_summary?: string;
  order_type?: string;
  occurred_at: string; // ISO from Stripe event
  recorded_at: string; // ISO when we recorded it
  archived?: boolean; // controlled archival (never auto-purged)
}

export interface SubscriptionRecord {
  app: 'cardiq';
  stripe_subscription_id: string;
  stripe_customer_id?: string;
  plan_id: 'basic' | 'pro' | 'elite';
  amount_cents: number;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  test_mode: boolean;
  started_at: string;
  canceled_at?: string;
  updated_at: string;
}

export interface AppSummary {
  app: AppId | 'all';
  mode: RevenueMode;
  transaction_count: number;
  gross_cents: number;
  refunds_cents: number;
  fees_cents: number;
  fees_estimated: boolean;
  net_cents: number;
  mrr_cents?: number; // Cardiq only
  active_subscriptions?: number; // Cardiq only
}

// ─── Storage Interface ──────────────────────────────────────────────

export interface LedgerStorage {
  recordTransaction(tx: RevenueTransaction): Promise<{ recorded: boolean; duplicate: boolean }>;
  getTransaction(id: string): Promise<RevenueTransaction | null>;
  getTransactions(filters: {
    app?: AppId;
    test_mode: boolean;
    kind?: TransactionKind;
    since?: string;
    until?: string;
    limit?: number;
    include_archived?: boolean;
  }): Promise<RevenueTransaction[]>;
  upsertSubscription(sub: SubscriptionRecord): Promise<void>;
  getSubscriptions(test_mode: boolean): Promise<SubscriptionRecord[]>;
  archiveTransaction(id: string, reason: string): Promise<boolean>;
}

// ─── In-Memory Storage (MVP — VOLATILE) ─────────────────────────────

class InMemoryStorage implements LedgerStorage {
  private transactions = new Map<string, RevenueTransaction>();
  private subscriptions = new Map<string, SubscriptionRecord>();

  async recordTransaction(tx: RevenueTransaction): Promise<{ recorded: boolean; duplicate: boolean }> {
    if (this.transactions.has(tx.id)) {
      return { recorded: false, duplicate: true };
    }
    this.transactions.set(tx.id, { ...tx, recorded_at: new Date().toISOString() });
    return { recorded: true, duplicate: false };
  }

  async getTransaction(id: string): Promise<RevenueTransaction | null> {
    return this.transactions.get(id) || null;
  }

  async getTransactions(filters: {
    app?: AppId;
    test_mode: boolean;
    kind?: TransactionKind;
    since?: string;
    until?: string;
    limit?: number;
    include_archived?: boolean;
  }): Promise<RevenueTransaction[]> {
    let results = Array.from(this.transactions.values());

    // CRITICAL: test_mode filter is REQUIRED and always applied
    results = results.filter((t) => t.test_mode === filters.test_mode);

    if (filters.app) results = results.filter((t) => t.app === filters.app);
    if (filters.kind) results = results.filter((t) => t.kind === filters.kind);
    if (filters.since) results = results.filter((t) => t.occurred_at >= filters.since!);
    if (filters.until) results = results.filter((t) => t.occurred_at <= filters.until!);
    if (!filters.include_archived) results = results.filter((t) => !t.archived);

    results.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

    if (filters.limit) results = results.slice(0, filters.limit);
    return results;
  }

  async upsertSubscription(sub: SubscriptionRecord): Promise<void> {
    const existing = this.subscriptions.get(sub.stripe_subscription_id);
    this.subscriptions.set(sub.stripe_subscription_id, {
      ...existing,
      ...sub,
      updated_at: new Date().toISOString(),
    });
  }

  async getSubscriptions(test_mode: boolean): Promise<SubscriptionRecord[]> {
    return Array.from(this.subscriptions.values()).filter((s) => s.test_mode === test_mode);
  }

  async archiveTransaction(id: string, reason: string): Promise<boolean> {
    const tx = this.transactions.get(id);
    if (!tx) return false;
    tx.archived = true;
    // In production, log the archival reason to an audit trail
    console.log(`Archived transaction ${id}: ${reason}`);
    return true;
  }
}

// Singleton — in production, replace with persistent storage
const globalStore = globalThis as unknown as {
  __ym_ledger?: InMemoryStorage;
};

function getStorage(): LedgerStorage {
  if (!globalStore.__ym_ledger) {
    globalStore.__ym_ledger = new InMemoryStorage();
    console.warn(
      'Young Money ledger using VOLATILE in-memory storage. ' +
      'Data lost on restart/deploy. Stripe Dashboard is authoritative.'
    );
  }
  return globalStore.__ym_ledger;
}

// ─── Public API ─────────────────────────────────────────────────────

export function estimateStripeFee(amount_cents: number): number {
  return Math.round(amount_cents * 0.029) + 30;
}

export async function recordTransaction(
  tx: Omit<RevenueTransaction, 'recorded_at' | 'fee_estimated'>
    & { fee_cents?: number; fee_estimated?: boolean }
): Promise<{ recorded: boolean; duplicate: boolean }> {
  const storage = getStorage();
  const full: RevenueTransaction = {
    ...tx,
    fee_cents: tx.fee_cents ?? (tx.kind === 'refund' ? 0 : estimateStripeFee(tx.amount_cents)),
    fee_estimated: tx.fee_estimated ?? (tx.kind !== 'refund'),
    recorded_at: new Date().toISOString(),
  };
  return storage.recordTransaction(full);
}

export async function recordRefund(
  refund: Omit<RevenueTransaction, 'recorded_at' | 'kind' | 'fee_cents' | 'fee_estimated'>
): Promise<{ recorded: boolean; duplicate: boolean }> {
  // Refunds always have fee_cents=0 (Stripe keeps the original fee)
  return recordTransaction({
    ...refund,
    kind: 'refund',
    fee_cents: 0,
    fee_estimated: false,
  });
}

export async function upsertSubscription(sub: Omit<SubscriptionRecord, 'updated_at'>): Promise<void> {
  const storage = getStorage();
  await storage.upsertSubscription({
    ...sub,
    updated_at: new Date().toISOString(),
  });
}

export async function getSummary(
  app: AppId | 'all',
  mode: RevenueMode // REQUIRED — no default, no 'all' option
): Promise<AppSummary> {
  const storage = getStorage();
  const test_mode = mode === 'test';

  const transactions = await storage.getTransactions({
    app: app === 'all' ? undefined : app,
    test_mode,
  });

  let gross = 0, refunds = 0, fees = 0, count = 0;
  let feesEstimated = false;

  for (const t of transactions) {
    if (t.kind === 'payment' || t.kind === 'subscription_payment') {
      gross += t.amount_cents;
      fees += t.fee_cents;
      if (t.fee_estimated) feesEstimated = true;
      count++;
    } else if (t.kind === 'refund') {
      refunds += t.amount_cents;
      // Note: refund fee_cents is 0, original fee stays counted
    } else if (t.kind === 'dispute') {
      // Disputes reduce net like refunds
      refunds += t.amount_cents;
    }
  }

  const summary: AppSummary = {
    app,
    mode,
    transaction_count: count,
    gross_cents: gross,
    refunds_cents: refunds,
    fees_cents: fees,
    fees_estimated: feesEstimated,
    net_cents: gross - refunds - fees,
  };

  // Cardiq MRR
  if (app === 'cardiq' || app === 'all') {
    const subs = await storage.getSubscriptions(test_mode);
    const active = subs.filter((s) =>
      (s.app === 'cardiq' || app === 'all') &&
      (s.status === 'active' || s.status === 'past_due')
    );
    const mrr = active.reduce((sum, s) => sum + s.amount_cents, 0);
    summary.mrr_cents = mrr;
    summary.active_subscriptions = active.length;
  }

  return summary;
}

export async function getTransactions(filters: {
  app?: AppId;
  mode: RevenueMode; // REQUIRED
  kind?: TransactionKind;
  since?: string;
  until?: string;
  limit?: number;
}): Promise<RevenueTransaction[]> {
  const storage = getStorage();
  return storage.getTransactions({
    ...filters,
    test_mode: filters.mode === 'test',
  });
}

export async function getMRR(mode: RevenueMode): Promise<{ mrr_cents: number; active_count: number; by_plan: Record<string, number> }> {
  const storage = getStorage();
  const subs = await storage.getSubscriptions(mode === 'test');
  const active = subs.filter((s) => s.status === 'active' || s.status === 'past_due');

  const by_plan: Record<string, number> = {};
  for (const s of active) {
    by_plan[s.plan_id] = (by_plan[s.plan_id] || 0) + 1;
  }

  return {
    mrr_cents: active.reduce((sum, s) => sum + s.amount_cents, 0),
    active_count: active.length,
    by_plan,
  };
}

// ─── Stripe Reconciliation ──────────────────────────────────────────
// Compares ledger totals against Stripe Dashboard figures.
// In MVP, this is a manual process. Production should automate via Stripe API.

export interface ReconciliationReport {
  mode: RevenueMode;
  ledger_gross_cents: number;
  stripe_gross_cents: number; // manually entered from Stripe Dashboard
  discrepancy_cents: number;
  discrepancy_explanation?: string;
  checked_at: string;
}

export async function reconcile(
  mode: RevenueMode,
  stripe_gross_cents: number,
  explanation?: string
): Promise<ReconciliationReport> {
  const summary = await getSummary('all', mode);
  const discrepancy = summary.gross_cents - stripe_gross_cents;

  return {
    mode,
    ledger_gross_cents: summary.gross_cents,
    stripe_gross_cents,
    discrepancy_cents: discrepancy,
    discrepancy_explanation: explanation,
    checked_at: new Date().toISOString(),
  };
}
