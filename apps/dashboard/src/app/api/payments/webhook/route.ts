/**
 * Stripe TEST webhook receiver + event viewer (controlled TEST pilot).
 *
 * POST /api/payments/webhook?app=<appId>
 *   Verifies the Stripe signature using the app's registered signing secret
 *   (fail-closed via verifyWebhookSignature), then records the verified event.
 *   Returns 400 on any verification failure — unverified events are never
 *   recorded or trusted.
 *
 * GET /api/payments/webhook?app=<appId>
 *   Returns recently recorded verified events (event ids + types only, no
 *   secrets). TEST visibility for the controlled pilot; storage is ephemeral
 *   (/tmp) and single-instance — a durable ledger is a later increment.
 */
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { verifyWebhookSignature } from '@/lib/payments/gateway';

const DATA_DIR = join('/tmp', 'payments-test');
const MAX_EVENTS = 50;

interface RecordedEvent {
  eventId: string;
  eventType: string;
  receivedAt: string;
}

async function eventFile(appId: string): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });
  const safe = appId.replace(/[^a-z0-9_-]/gi, '');
  return join(DATA_DIR, `webhook-events-${safe}.json`);
}

async function readEvents(appId: string): Promise<RecordedEvent[]> {
  try {
    const raw = await readFile(await eventFile(appId), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecordedEvent[]) : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const appId = new URL(req.url).searchParams.get('app') ?? '';
  if (!appId) {
    return NextResponse.json({ error: 'missing ?app=' }, { status: 400 });
  }
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');
  try {
    const verified = verifyWebhookSignature({
      appId,
      rawBody,
      signatureHeader: signature,
    });
    const events = await readEvents(appId);
    events.unshift({
      eventId: verified.eventId,
      eventType: verified.eventType,
      receivedAt: new Date().toISOString(),
    });
    await writeFile(
      await eventFile(appId),
      JSON.stringify(events.slice(0, MAX_EVENTS), null, 2)
    );
    return NextResponse.json({
      received: true,
      eventId: verified.eventId,
      eventType: verified.eventType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const appId = new URL(req.url).searchParams.get('app') ?? '';
  if (!appId) {
    return NextResponse.json({ error: 'missing ?app=' }, { status: 400 });
  }
  const events = await readEvents(appId);
  return NextResponse.json({ app: appId, testMode: true, events });
}
