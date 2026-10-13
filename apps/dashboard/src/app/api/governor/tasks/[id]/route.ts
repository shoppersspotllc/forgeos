import { NextResponse } from 'next/server';
import { requireHuman, gov } from '../../_lib';


/** GET /api/governor/tasks/[id] — full task view: state, honest label, transitions, verification, trace. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireHuman(request);
  if (auth instanceof NextResponse) return auth;
  const g = await gov();
  try {
    const v = g.view((await params).id);
    if (!v) return NextResponse.json({ error: 'task not found' }, { status: 404 });
    return NextResponse.json({ task: v });
  } finally {
    g.close();
  }
}
