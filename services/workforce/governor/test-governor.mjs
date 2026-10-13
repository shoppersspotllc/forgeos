#!/usr/bin/env node
/**
 * Governor acceptance tests G1-G8 (agent-tested, NOT owner-reviewed).
 *
 * G1 crash recovery: kill -9 executor mid-task -> recover() marks interrupted -> retry completes
 * G2 illegal transition: executor actor attempts executing->verified -> rejected + logged
 * G3 idempotency: same idempotency key twice -> one task row, one dispatch
 * G4 cancellation: human cancels mid-run -> process group dead, state cancelled
 * G5 retry exhaustion: maxAttempts=1, executor killed -> interrupted -> failed (no 2nd attempt)
 * G6 persistence: new Governor on same DB -> task + transitions intact
 * G7 authorization: executor-role verify -> rejected (module); API 401 covered separately
 * G8 honest labels: complete != done; only verified/delivered count as done
 *
 * Uses a temp DB and a local HTTP server (no TLS). Run: node test-governor.mjs
 */
import { createServer } from 'node:http';
import { execSync, spawn } from 'node:child_process';
import { Governor, pidAlive } from './governor.mjs';
import { GovernorStore } from './governor-store.mjs';

const HERE = '/home/hatch/workspace/forgeos/services/workforce/governor';
const EXECUTOR = '/home/hatch/workspace/forgeos/services/workforce/dot-executor/run-task.mjs';
const RUNS = '/tmp/gov-test-runs';
const DB = `/tmp/gov-test-${Date.now()}.db`;
const HUMAN = { type: 'human', id: 'test-dexter' };

let pass = 0, fail = 0;
function ok(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function gov(opts = {}) {
  return new Governor(DB, { executorScript: EXECUTOR, runsDir: RUNS, ...opts });
}

// Local HTTP target (no TLS -> strict mode is irrelevant, lifecycle is what's tested).
// /slow delays 25s so kill/cancel tests reliably land mid-execution.
let server, baseUrl, slowUrl;
async function startTarget() {
  server = createServer((req, res) => {
    const send = () => {
      // The client may be gone (kill -9 mid-flight); never crash the server.
      if (res.destroyed) return;
      try {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><head><title>Gov Test Page</title></head><body><a href="/x">one link</a></body></html>');
      } catch { /* client gone */ }
    };
    if (req.url === '/slow') setTimeout(send, 12000); else send();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  baseUrl = `http://127.0.0.1:${server.address().port}/`;
  slowUrl = `http://127.0.0.1:${server.address().port}/slow`;
}

async function testG3_Idempotency() {
  console.log('G3 idempotency (duplicate dispatch safeguard)');
  const g = gov();
  const key = `idem-${Date.now()}`;
  const a = g.createTask({ dotId: 'scout', title: 'idem test', url: baseUrl, objective: 't', idempotencyKey: key, policy: { timeoutMs: 25000 } });
  const b = g.createTask({ dotId: 'scout', title: 'idem test', url: baseUrl, objective: 't', idempotencyKey: key, policy: { timeoutMs: 25000 } });
  ok('second create returns duplicate:true', b.duplicate === true);
  ok('same task id', a.task.id === b.task.id);
  const count = g.store.db.prepare(`SELECT COUNT(*) c FROM dot_task_history WHERE idempotency_key = ?`).get(key).c;
  ok('exactly one row', count === 1, `count=${count}`);
  g.close();
}

async function testG2_IllegalTransition() {
  console.log('G2 illegal transition (executor can never verify)');
  const g = gov();
  const { task } = g.createTask({ dotId: 'scout', title: 'g2', url: baseUrl, objective: 't', policy: { timeoutMs: 25000 } });
  g.routeTask(task.id);
  // Force to executing without a real child (direct transition for the auth test).
  g.store.transition(task.id, 'executing', { type: 'governor', id: 'governor' }, 'test setup');
  let rejected = false;
  try {
    g.store.transition(task.id, 'verified', { type: 'executor', id: 'child-123' }, 'sneaky');
  } catch (e) { rejected = e.name === 'GovernorTransitionError'; }
  ok('executor->verified rejected', rejected);
  const t = g.store.getGovernorTask(task.id);
  ok('state unchanged (still executing)', t.status === 'executing');
  const trace = g.store.taskActions(task.id, 'scout').map((a) => a.actionType);
  ok('rejection logged in trace', trace.includes('transition-rejected'));
  g.close();
}

async function testG7_ExecutorVerify() {
  console.log('G7 authorization (executor role cannot verify; human identity required)');
  const g = gov();
  const { task } = g.createTask({ dotId: 'scout', title: 'g7', url: baseUrl, objective: 't', policy: { timeoutMs: 25000 } });
  g.routeTask(task.id);
  // Complete the task via governor path (simulate executor result).
  g.store.transition(task.id, 'executing', { type: 'governor', id: 'governor' }, 'test');
  g.store.transition(task.id, 'complete', { type: 'governor', id: 'governor' }, 'test');
  let execRejected = false;
  try { g.verify(task.id, { type: 'executor', id: 'child-1' }, ['looks good']); }
  catch (e) { execRejected = e.name === 'GovernorTransitionError'; }
  ok('executor verify rejected', execRejected);
  let anonRejected = false;
  try { g.verify(task.id, { type: 'human' }, ['looks good']); }
  catch (e) { anonRejected = e.message.includes('identity'); }
  ok('anonymous human rejected (identity required)', anonRejected);
  const t = g.verify(task.id, HUMAN, ['title matches', 'screenshot corroborates', 'no off-allowlist activity']);
  ok('identified human verifies', t.status === 'verified');
  ok('verification record stored', g.store.getVerification(task.id)?.verifier === 'test-dexter');
  g.close();
}

async function testG8_HonestLabels() {
  console.log('G8 honest labels (complete != done)');
  const g = gov();
  const { task } = g.createTask({ dotId: 'scout', title: 'g8', url: baseUrl, objective: 't', policy: { timeoutMs: 25000 } });
  g.routeTask(task.id);
  g.store.transition(task.id, 'executing', { type: 'governor', id: 'governor' }, 'test');
  g.store.transition(task.id, 'complete', { type: 'governor', id: 'governor' }, 'test');
  let v = g.view(task.id);
  ok('complete label is honest', v.honestLabel === 'awaiting human review', v.honestLabel);
  ok('complete is NOT done', v.isDone === false);
  g.verify(task.id, HUMAN, ['ok']);
  v = g.view(task.id);
  ok('verified IS done', v.isDone === true && v.honestLabel === 'verified — done');
  g.close();
}

async function testG6_Persistence() {
  console.log('G6 persistence (restart -> intact)');
  const g1 = gov();
  const { task } = g1.createTask({ dotId: 'scout', title: 'g6 persist', url: baseUrl, objective: 't', policy: { timeoutMs: 25000 } });
  g1.routeTask(task.id);
  const nTrans1 = g1.store.getTransitions(task.id).length;
  g1.close();
  // "Restart": brand-new Governor on the same file.
  const g2 = gov();
  const t = g2.store.getGovernorTask(task.id);
  ok('task survives restart', t && t.status === 'routed' && t.title === 'g6 persist');
  ok('transitions survive restart', g2.store.getTransitions(task.id).length === nTrans1);
  ok('policy survives restart', JSON.parse(t.policy).tlsMode === 'strict');
  g2.close();
}

async function testG1_CrashRecovery() {
  console.log('G1 crash recovery (kill -9 -> interrupted -> retry -> complete)');
  const g = gov();
  // Fast endpoint: the kill lands while state=executing (pid visible);
  // the retry then completes normally. (Timing-based mid-navigation kills
  // are flaky due to the executor's 30s navigation cap — the state machine
  // behavior is what's under test, not the kill timing.)
  const { task } = g.createTask({ dotId: 'scout', title: 'g1 crash', url: baseUrl, objective: 't', policy: { timeoutMs: 60000, maxAttempts: 3 } });
  const dispatchP = g.dispatch(task.id);
  // Wait for the executor to be alive, then kill -9 it immediately.
  let childPid = null;
  for (let i = 0; i < 40 && !childPid; i++) {
    await sleep(500);
    childPid = g.store.getGovernorTask(task.id)?.executor_pid;
  }
  ok('executor spawned', Boolean(childPid), `pid=${childPid}`);
  execSync(`kill -9 ${childPid}`);
  console.log(`  (killed executor pid ${childPid})`);
  const final = await dispatchP; // should retry and complete
  ok('recovered and completed after retry', final.status === 'complete', `status=${final.status}`);
  ok('attempt counter advanced', final.attempt >= 2, `attempt=${final.attempt}`);
  const transitions = g.store.getTransitions(task.id).map((t) => `${t.from_state}->${t.to_state}`);
  ok('interrupted appears in history', transitions.some((t) => t.includes('interrupted')));
  g.close();
}

async function testG5_RetryExhaustion() {
  console.log('G5 retry exhaustion (maxAttempts=1 -> failed, no 2nd attempt)');
  const g = gov();
  const { task } = g.createTask({ dotId: 'scout', title: 'g5 exhaust', url: baseUrl, objective: 't', policy: { timeoutMs: 60000, maxAttempts: 1 } });
  const dispatchP = g.dispatch(task.id);
  let childPid = null;
  for (let i = 0; i < 40 && !childPid; i++) {
    await sleep(500);
    childPid = g.store.getGovernorTask(task.id)?.executor_pid;
  }
  execSync(`kill -9 ${childPid}`);
  const final = await dispatchP;
  ok('ends failed (not retried)', final.status === 'failed', `status=${final.status}`);
  ok('only one attempt', final.attempt === 1, `attempt=${final.attempt}`);
  g.close();
}

async function testG4_Cancel() {
  console.log('G4 cancellation (human cancels mid-run -> process group dead)');
  const g = gov();
  const { task } = g.createTask({ dotId: 'scout', title: 'g4 cancel', url: slowUrl, objective: 't', policy: { timeoutMs: 60000 } });
  const dispatchP = g.dispatch(task.id);
  let childPid = null;
  for (let i = 0; i < 40 && !childPid; i++) {
    await sleep(500);
    childPid = g.store.getGovernorTask(task.id)?.executor_pid;
  }
  // Slow endpoint keeps the executor busy so the cancel lands mid-run.
  await sleep(2000);
  const cancelled = g.cancel(task.id, HUMAN, 'test cancellation');
  ok('state is cancelled', cancelled.status === 'cancelled');
  await sleep(1500);
  ok('executor process group dead', !pidAlive(childPid), `pid ${childPid} alive? ${pidAlive(childPid)}`);
  const final = await dispatchP; // dispatch must not clobber 'cancelled'
  ok('dispatch respects cancellation', final.status === 'cancelled', `status=${final.status}`);
  g.close();
}

async function testFullLifecycle() {
  console.log('FULL lifecycle (received->routed->executing->complete->verified->delivered)');
  const g = gov();
  const { task, duplicate } = g.createTask({ dotId: 'scout', title: 'full lifecycle', url: baseUrl, objective: 't', policy: { timeoutMs: 45000 } });
  ok('not a duplicate', duplicate === false);
  const done = await g.dispatch(task.id);
  ok('dispatched to complete', done.status === 'complete', `status=${done.status}`);
  // The local HTTP target: title should be 'Gov Test Page', 1 link.
  ok('outcome has title', (done.outcome || '').includes('Gov Test Page'), (done.outcome || '').slice(0, 80));
  const verified = g.verify(done.id, HUMAN, ['title matches', 'screenshot corroborates', 'trace clean']);
  ok('human verifies', verified.status === 'verified');
  const delivered = g.deliver(done.id, HUMAN, 'test delivery');
  ok('human delivers', delivered.status === 'delivered');
  const v = g.view(done.id);
  ok('transition history complete', v.transitions.length >= 5, `${v.transitions.length} transitions`);
  console.log('  transitions:', v.transitions.map((t) => `${t.from_state}->${t.to_state}`).join(', '));
  g.close();
}

async function main() {
  execSync(`mkdir -p ${RUNS}`);
  await startTarget();
  console.log(`target: ${baseUrl} | db: ${DB}\n`);
  try {
    await testG3_Idempotency();
    await testG2_IllegalTransition();
    await testG7_ExecutorVerify();
    await testG8_HonestLabels();
    await testG6_Persistence();
    await testFullLifecycle();
    await testG1_CrashRecovery();
    await testG5_RetryExhaustion();
    await testG4_Cancel();
  } finally {
    server.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  // Stray sweep.
  const strays = execSync(`ps -eo pid,args | grep "[r]un-task.mjs --dot" | wc -l`).toString().trim();
  console.log(`stray executors after tests: ${strays}`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
