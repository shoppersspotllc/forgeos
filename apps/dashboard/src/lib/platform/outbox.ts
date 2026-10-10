/**
 * Young Money Platform — simulated-send outbox (TEST only).
 *
 * SAFETY CASE: approving a draft NEVER transmits anything. The "send" is
 * recorded here — an in-memory log on this server — and nothing else.
 * This module performs no network I/O by construction: it imports nothing
 * that can transmit (no fetch, no SMTP, no SMS/email SDKs), and no caller
 * in the platform may transmit on its behalf. See the safety tests in the
 * API smoke suite, which (a) statically scan this module and its callers
 * for network primitives and (b) run the approve flow with global fetch
 * replaced by a throwing stub to prove the path never touches the network.
 *
 * Every record is labeled simulated. Nothing here is a real message.
 */

export interface SimulatedSendRecord {
  id: string;
  approvalId: string;
  leadId: string;
  tenantId: string;
  channel: 'sms' | 'email';
  sentAt: string;
  note: string;
  /** Always true. If this is ever false, the safety case is broken. */
  simulated: true;
}

const outbox: SimulatedSendRecord[] = [];

let seq = 0;

/**
 * Record a simulated send. Local append-only write — no transmission.
 * Returns the recorded entry.
 */
export function recordSimulatedSend(input: {
  approvalId: string;
  leadId: string;
  tenantId: string;
  channel: 'sms' | 'email';
  note?: string;
}): SimulatedSendRecord {
  seq += 1;
  const record: SimulatedSendRecord = {
    id: `sim-${Date.now().toString(36)}-${seq}`,
    approvalId: input.approvalId,
    leadId: input.leadId,
    tenantId: input.tenantId,
    channel: input.channel,
    sentAt: new Date().toISOString(),
    note: input.note ?? 'SIMULATED send — nothing was actually transmitted.',
    simulated: true,
  };
  outbox.push(record);
  return record;
}

/** Read-only, tenant-scoped view of the simulated outbox. */
export function outboxFor(tenantId: string): SimulatedSendRecord[] {
  return outbox.filter((r) => r.tenantId === tenantId);
}

/** Total simulated sends across all tenants (health/metrics only). */
export function outboxCount(): number {
  return outbox.length;
}
