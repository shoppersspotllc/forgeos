import { NextResponse } from 'next/server';

const TERMINAL_SERVER = 'http://127.0.0.1:3457';

export async function GET() {
  try {
    const res = await fetch(`${TERMINAL_SERVER}/status`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error('Terminal server not responding');
    const data = await res.json();
    return NextResponse.json({ online: true, ...data });
  } catch {
    return NextResponse.json(
      { online: false, error: 'Terminal server not running on 127.0.0.1:3457' },
      { status: 503 }
    );
  }
}
