/**
 * Young Money Revenue Tracker — honest, auditable revenue records
 *
 * Tracks real leads, conversions, commissions, and collected revenue
 * across all Young Money engines. NEVER fabricate values — every
 * record must correspond to a real-world event.
 *
 * Storage: in-memory (per serverless instance). For durable history,
 * export via GET /api/revenue/events and archive externally.
 * A future upgrade can back this with Vercel KV (free tier).
 */

export interface RevenueEvent {
  id: string;
  timestamp: number;
  engine: 'affiliate' | 'pindrop' | 'quant' | 'other';
  type: 'lead' | 'click' | 'conversion' | 'commission' | 'payout' | 'expense';
  description: string;
  amount: number; // USD; 0 for non-monetary events (leads, clicks)
  source?: string; // e.g. ClickBank TID, PinDrop campaign
  evidence?: string; // URL or reference to proof
  dotName?: string; // which Dot recorded it
}

interface RevenueStats {
  totalRevenue: number;
  totalCommissions: number;
  totalLeads: number;
  totalClicks: number;
  totalConversions: number;
  totalExpenses: number;
  netRevenue: number;
  byEngine: Record<string, { revenue: number; leads: number; conversions: number }>;
  eventCount: number;
  lastUpdated: number;
}

// In-memory store (per instance)
const events: RevenueEvent[] = [];
let seq = 0;

export function recordEvent(e: Omit<RevenueEvent, 'id' | 'timestamp'>): RevenueEvent {
  const event: RevenueEvent = {
    ...e,
    id: `rev_${Date.now()}_${seq++}`,
    timestamp: Date.now(),
  };
  events.push(event);
  // Cap at 1000 events to bound memory
  if (events.length > 1000) events.splice(0, events.length - 1000);
  console.log(`[revenue] ${event.engine}/${event.type}: $${event.amount} — ${event.description}`);
  return event;
}

export function getEvents(engine?: string, type?: string, limit: number = 100): RevenueEvent[] {
  return events
    .filter((e) => (!engine || e.engine === engine) && (!type || e.type === type))
    .slice(-limit)
    .reverse();
}

export function getStats(): RevenueStats {
  const byEngine: Record<string, { revenue: number; leads: number; conversions: number }> = {};
  let totalRevenue = 0;
  let totalCommissions = 0;
  let totalLeads = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalExpenses = 0;

  for (const e of events) {
    if (!byEngine[e.engine]) byEngine[e.engine] = { revenue: 0, leads: 0, conversions: 0 };
    switch (e.type) {
      case 'lead':
        totalLeads++;
        byEngine[e.engine].leads++;
        break;
      case 'click':
        totalClicks++;
        break;
      case 'conversion':
        totalConversions++;
        byEngine[e.engine].conversions++;
        break;
      case 'commission':
      case 'payout':
        totalRevenue += e.amount;
        totalCommissions += e.amount;
        byEngine[e.engine].revenue += e.amount;
        break;
      case 'expense':
        totalExpenses += e.amount;
        break;
    }
  }

  return {
    totalRevenue,
    totalCommissions,
    totalLeads,
    totalClicks,
    totalConversions,
    totalExpenses,
    netRevenue: totalRevenue - totalExpenses,
    byEngine,
    eventCount: events.length,
    lastUpdated: Date.now(),
  };
}
