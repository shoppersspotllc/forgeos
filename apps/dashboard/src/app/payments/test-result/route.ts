/**
 * GET /payments/test-result?app=<appId>&status=success|cancelled
 *
 * Minimal TEST-mode result page for the controlled $1.00 pilot.
 * Plain HTML, no client JavaScript, no secrets. Clearly labeled TEST.
 */
import { NextRequest, NextResponse } from 'next/server';

function esc(s: string): string {
  return s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const app = esc(params.get('app') ?? 'unknown');
  const status = params.get('status') ?? 'unknown';
  const ok = status === 'success';
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TEST payment ${ok ? 'completed' : 'cancelled'}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:4rem auto;padding:0 1.5rem;">
<h1>${ok ? 'TEST payment completed' : 'TEST payment cancelled'}</h1>
<p><strong>TEST MODE</strong> — no real charge was made.</p>
<p>App: ${app} &middot; Amount: $1.00 USD (test)</p>
${ok ? '<p>The test charge succeeded. The webhook delivery can be checked at <code>/api/payments/webhook?app=' + app + '</code>.</p>' : '<p>No charge was created. You can retry the test checkout.</p>'}
</body></html>`;
  return new NextResponse(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
