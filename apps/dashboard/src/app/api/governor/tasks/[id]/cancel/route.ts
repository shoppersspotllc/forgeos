import { NextResponse } from 'next/server';
import { requireHuman, gov } from '../../../_lib';


/** POST /api/governor/tasks/[id]/cancel — human-only. Body: { verifier?, reason? } */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireHuman(request);
  if (auth instanceof NextResponse) return auth;
  let body: any = {};
  try { body = await request.json(); } catch { /* empty */ }
  const g = await gov();
  try {
    const t = g.cancel((await params).id, { type: 'human', id: body.verifier || auth.id }, body.reason || '');
    return NextResponse.json({ task: g.view(t.id) });
  } catch (e: any) {
    const status = e.name === 'GovernorTransitionError' ? 409 : 400;
    return NextResponse.json({ error: e.message }, { status });
  } finally {
    g.close();
  }
}
