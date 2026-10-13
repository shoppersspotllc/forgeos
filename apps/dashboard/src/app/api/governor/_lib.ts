import { NextResponse } from 'next/server';
import { join } from 'node:path';

// The Governor module lives outside the dashboard bundle root, so it is
// loaded at RUNTIME (webpackIgnore) rather than bundled — the same pattern
// as the executor spawn helper. This keeps one authoritative Governor
// implementation (no fork) while satisfying the bundler.
let _governorMod: any = null;
async function governorModule(): Promise<any> {
  if (!_governorMod) {
    const govPath = join(process.cwd(), '..', '..', 'services', 'workforce', 'governor', 'governor.mjs');
    // webpackIgnore: runtime-only import — the bundler must not trace this.
    _governorMod = await import(/* webpackIgnore: true */ govPath);
  }
  return _governorMod;
}

// The Governor's authoritative store: the same SQLite file the executor uses.
function governorDb(): string {
  return (
    process.env.GOVERNOR_DB ||
    join(process.cwd(), '..', '..', 'services', 'workforce', 'dot-executor', 'runs', 'tasks.db')
  );
}

async function governor(): Promise<any> {
  const { Governor } = await governorModule();
  return new Governor(governorDb(), {
    executorScript:
      process.env.DOT_EXECUTOR_PATH ||
      join(process.cwd(), '..', '..', 'services', 'workforce', 'dot-executor', 'run-task.mjs'),
    runsDir: join(process.cwd(), '..', '..', 'services', 'workforce', 'dot-executor', 'runs'),
  });
}

/**
 * Human authority for this phase: a shared bearer token held by the owner.
 * - Token unset  -> 503 (refuse to operate without configured authority)
 * - Missing/wrong -> 401
 * The Governor module additionally enforces actor roles server-side, so
 * even a valid token cannot make an executor transition.
 */
export function requireHuman(request: Request): { id: string } | NextResponse {
  const expected = process.env.GOVERNOR_API_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: 'Governor API not configured (GOVERNOR_API_TOKEN unset) — refusing to operate' },
      { status: 503 }
    );
  }
  const got = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!got || got !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return { id: 'api-human' };
}

export async function gov(): Promise<any> {
  return governor();
}
