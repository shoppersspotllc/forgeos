import { NextResponse } from 'next/server';
import { requireHuman, gov } from '../_lib';


/**
 * POST /api/governor/tasks — create a Governor task and dispatch it.
 * Body: { dotId, title, url, objective?, idempotencyKey?, timeoutMs?, maxAttempts? }
 * Human bearer token required. The dispatch awaits the browser run
 * (like /api/tasks does); the task ends in complete/failed/interrupted.
 */
export async function POST(request: Request) {
  const auth = requireHuman(request);
  if (auth instanceof NextResponse) return auth;

  let body: any = {};
  try { body = await request.json(); } catch { /* empty body */ }
  const { dotId, title, url, objective, idempotencyKey, timeoutMs, maxAttempts } = body;
  if (!dotId || !title || !url) {
    return NextResponse.json({ error: 'dotId, title, url are required' }, { status: 400 });
  }

  const g = await gov();
  try {
    const { task, duplicate } = g.createTask({
      dotId, title, url, objective,
      idempotencyKey: idempotencyKey || null,
      policy: { timeoutMs, maxAttempts },
    });
    if (duplicate) {
      const v = g.view(task.id);
      return NextResponse.json({ duplicate: true, task: v }, { status: 200 });
    }
    const final = await g.dispatch(task.id);
    return NextResponse.json({ duplicate: false, task: g.view(final.id) }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message.includes('not onboarded') ? 403 : 500 });
  } finally {
    g.close();
  }
}
