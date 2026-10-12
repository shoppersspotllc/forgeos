#!/usr/bin/env node
/**
 * Dot task runner — ForgeOS workforce vertical slice.
 *
 * Lifecycle: create task (SQLite) -> plan -> spawn proxy shim -> execute
 * isolated browser task -> screenshots -> persist outcome -> kill shim ->
 * verify cleanup -> write status report -> print result JSON.
 *
 * Usage:
 *   node run-task.mjs --dot scout --url https://example.com \
 *     --objective "Report the page title and visible link count" \
 *     --db ./runs/tasks.db --out ./runs/<run-id>
 *
 * Exit 0 on completed, 2 on failed task, 1 on runner error.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { TaskHistoryStore } from '../../../../dot-foundation/task-history.ts';
import { executeBrowserTask, AllowlistViolation } from './browser-executor.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHIM = join(HERE, 'proxy-shim.py');
const TASK_TIMEOUT_MS = 60000;

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}

async function pickFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
  });
}

async function waitForPort(port, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const ok = await new Promise((res) => {
      const s = net.connect(port, '127.0.0.1');
      s.on('connect', () => { s.end(); res(true); });
      s.on('error', () => res(false));
    });
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function writeReport(outDir, task) {
  const shots = (task.result?.screenshots || [])
    .map((p) => `<div><p>${esc(p.split('/').pop())}</p><img src="${esc(p.split('/').pop())}" style="max-width:100%;border:1px solid #444"></div>`)
    .join('\n');
  const trace = (task.actions || [])
    .map((a) => `<li><code>${esc(a.at || '')}</code> <b>${esc(a.type)}</b> — ${esc(a.detail)}</li>`)
    .join('\n');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dot task ${esc(task.id)}</title>
<style>body{background:#111;color:#ddd;font-family:system-ui;max-width:900px;margin:2em auto;padding:0 1em}code{color:#8cf}li{margin:.4em 0}.ok{color:#6f6}.fail{color:#f66}</style>
</head><body>
<h1>Dot task report</h1>
<p>Task <code>${esc(task.id)}</code> · Dot <b>${esc(task.dotId)}</b> · Status <b class="${task.status === 'completed' ? 'ok' : 'fail'}">${esc(task.status)}</b></p>
<p>Objective: ${esc(task.objective)}</p>
<p>URL: <code>${esc(task.url)}</code></p>
<h2>Action trace</h2><ul>${trace}</ul>
<h2>Outcome</h2><pre>${esc(task.outcome || '(none)')}</pre>
<h2>Screenshots</h2>${shots || '<p>(none)</p>'}
</body></html>`;
  writeFileSync(join(outDir, 'report.html'), html);
}

async function main() {
  const dotId = arg('dot', 'scout');
  const url = arg('url');
  const objective = arg('objective', '');
  const dbPath = arg('db', join(HERE, 'runs', 'tasks.db'));
  const outDir = arg('out', join(HERE, 'runs', `run-${Date.now()}`));
  const governorTaskId = arg('task-id', ''); // Governor-owned task: reuse row, never write status
  if (!url) throw new Error('--url is required');

  mkdirSync(outDir, { recursive: true });
  mkdirSync(dirname(dbPath), { recursive: true });
  const shotsDir = join(outDir, 'screenshots');
  mkdirSync(shotsDir, { recursive: true });

  const store = new TaskHistoryStore(dbPath);
  // Governor mode: the Governor owns the lifecycle. The executor reuses the
  // Governor's task row, appends trace actions, writes its honest outcome via
  // setOutcome (status-neutral), and ALWAYS exits 0 reporting via JSON —
  // the Governor alone transitions the state.
  const governorMode = Boolean(governorTaskId);
  let taskId;
  if (governorMode) {
    const row = store.getTask(governorTaskId);
    if (!row) throw new Error(`governor task not found: ${governorTaskId}`);
    if (row.dot_id !== dotId) throw new Error(`governor task dot mismatch: ${row.dot_id} !== ${dotId}`);
    taskId = governorTaskId;
  } else {
    taskId = store.startTask(dotId, objective || `read-only browse: ${url}`);
  }
  const trace = [];
  const note = (type, detail) => {
    trace.push({ type, detail, at: new Date().toISOString() });
    store.recordAction(taskId, dotId, type, detail);
  };
  if (governorMode) {
    note('governor-mode', `reusing Governor task ${taskId} (no status writes; outcome only)`);
  }

  let shim = null;
  let outcome = null;
  let failed = false;
  let pidsBefore = new Set();
  try {
    note('received', `task ${taskId} received for Dot "${dotId}"`);
    if (!governorMode) {
      store.setPlan(taskId, dotId, JSON.stringify({
        steps: ['allowlist-check', 'browser-launch', 'navigate', 'screenshot', 'extract', 'browser-close'],
        readOnly: true,
      }));
    }
    note('routed', `assigned to workforce Dot "${dotId}" (browser executor)`);
    // Snapshot live Chromium PIDs now; the finally-block compares after the
    // run to prove no browser process leaked (PID-delta cleanup check).
    const { execSync: _ex } = await import('node:child_process');
    pidsBefore = (() => {
      try {
        return new Set(
          _ex('ps -eo pid,args | grep "[c]hrome-linux64/chrome" || true')
            .toString().split('\n').filter(Boolean)
            .map((l) => l.trim().split(/\s+/)[0])
        );
      } catch { return new Set(); }
    })();
    // The task allowlist is a single hostname derived from the task URL.
    // It is enforced at THREE layers: pre-navigation check, Playwright
    // request interception, and the proxy shim's network-level filter.
    const hostname = new URL(url).hostname;
    // Per-run ephemeral shim port: avoids cross-run collisions and stale
    // listeners (a stale shim on a fixed port could silently serve with the
    // wrong policy — verified 2026-10-12).
    const shimPort = await pickFreePort();
    note('executing', `spawning proxy shim ${SHIM} on 127.0.0.1:${shimPort} (allowlist: ${hostname})`);

    shim = spawn('python3', [SHIM, '--port', String(shimPort), '--allowlist', hostname], { stdio: ['ignore', 'pipe', 'pipe'] });
    let shimLog = '';
    shim.stdout.on('data', (d) => { shimLog += d.toString().slice(0, 200); });
    shim.stderr.on('data', () => {});
    if (!await waitForPort(shimPort)) {
      throw new Error('proxy shim did not come up');
    }
    note('shim-ready', `localhost proxy up on 127.0.0.1:${shimPort}`);

    // TLS confinement: insecure-dev ONLY via explicit env opt-in, per call.
    // Without DOT_BROWSER_INSECURE_TLS_DEV=1 the executor runs 'strict' and
    // fails closed against the intercepting proxy. This flag can never be
    // inherited silently by future (authenticated) sessions.
    const tlsMode = process.env.DOT_BROWSER_INSECURE_TLS_DEV === '1' ? 'insecure-dev' : 'strict';
    const result = await executeBrowserTask({
      url,
      allowlist: [hostname],
      timeoutMs: TASK_TIMEOUT_MS,
      screenshotDir: shotsDir,
      tlsMode,
      proxyPort: shimPort,
      onAction: (t, d) => note(t, d),
    });

    outcome = JSON.stringify({
      url,
      title: result.title,
      linkCount: result.linkCount,
      httpStatus: result.httpStatus,
      screenshots: result.screenshots.map((p) => p.split('/').pop()),
    }, null, 2);
    note('dot-result', `title="${result.title}", links=${result.linkCount}`);
    if (governorMode) {
      // Status-neutral: the Governor alone transitions the state.
      store.setOutcome(taskId, dotId, outcome);
    } else {
      store.completeTask(taskId, dotId, outcome,
        'read-only browse: allowlist enforced, session destroyed, no writes performed',
        'completed');
    }
  } catch (e) {
    failed = true;
    const msg = e instanceof AllowlistViolation ? `allowlist-violation: ${e.message}` : `error: ${e.message}`;
    note('dot-failed', msg);
    try {
      if (governorMode) {
        store.setOutcome(taskId, dotId, msg);
      } else {
        store.completeTask(taskId, dotId, msg, 'failure recorded; session destroyed', 'failed');
      }
    } catch { /* store may be unusable; trace array is the fallback */ }
    outcome = msg;
  } finally {
    if (shim) {
      shim.kill('SIGKILL');
      await new Promise((r) => setTimeout(r, 500));
      note('shim-stopped', 'proxy shim terminated');
    }
    // Cleanup verification: PID-set delta. Snapshot Chromium PIDs before the
    // run; after browser.close() + shim SIGKILL, any NEW surviving PID is a
    // leak. (Stale listeners on fixed ports were a real failure mode —
    // verified 2026-10-12; ephemeral shim ports + this delta check close it.)
    const { execSync } = await import('node:child_process');
    const chromiumPids = () => {
      try {
        return new Set(
          execSync('ps -eo pid,args | grep "[c]hrome-linux64/chrome" || true')
            .toString().split('\n').filter(Boolean)
            .map((l) => l.trim().split(/\s+/)[0])
        );
      } catch { return new Set(); }
    };
    const leaked = [...chromiumPids()].filter((p) => !pidsBefore.has(p));
    const shimDead = !shim || shim.exitCode !== null || shim.signalCode !== null;
    const problems = [];
    if (!shimDead) problems.push(`shim pid ${shim.pid} still alive`);
    leaked.forEach((p) => problems.push(`chromium pid ${p} leaked`));
    note('cleanup-check', problems.length === 0 ? 'no stray processes (PID-delta verified)' : `STRAYS: ${problems.join(', ')}`);
    try { store.close(); } catch {}
  }

  const finalTask = {
    id: taskId, dotId, url, objective,
    status: failed ? 'failed' : 'completed',
    actions: trace, outcome,
    result: (() => { try { return JSON.parse(outcome); } catch { return null; } })(),
  };
  writeReport(outDir, finalTask);
  console.log(JSON.stringify({ taskId, status: finalTask.status, outDir, outcome }));
  // Governor mode: ALWAYS exit 0 — the JSON status is the honest report and
  // the Governor classifies it. A non-zero exit means the process itself died.
  process.exit(governorMode ? 0 : (failed ? 2 : 0));
}

main().catch((e) => { console.error(JSON.stringify({ error: e.message })); process.exit(1); });
