import { NextRequest, NextResponse } from 'next/server';

const GATEWAY = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

/**
 * Dashboard proxy → ForgeOS AI gateway /v1/chat/completions
 * All dashboard intelligence requests flow through here → gateway → provider.
 * NEVER call providers directly from the dashboard.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const res = await fetch(`${GATEWAY}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(180000),
      body: JSON.stringify({
        messages: body.messages,
        model: body.model,
        capability: body.capability,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        provider: body.provider,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'ForgeOS AI gateway unreachable', gateway: GATEWAY },
      { status: 503 }
    );
  }
}
