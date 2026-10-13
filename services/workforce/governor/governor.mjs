/**
 * Execution Governor — the authoritative task lifecycle enforcer.
 *
 * Owns: task states, legal transitions, one-assignment-per-task,
 * dispatch of the (unmodified) browser executor, timeout/cancellation,
 * bounded retries, crash recovery, orphan reaping, and the audit trail.
 *
 * Does NOT own: task content, AI decisions, verification judgment
 * (human-only), or the dashboard UI.
 *
 * Security posture (this increment):
 *  - Browser execution: read-only, unauthenticated, allowlisted (executor).
 *  - TLS: STRICT only. The child environment is scrubbed of
 *    DOT_BROWSER_INSECURE_TLS_DEV — there is no insecure fallback for
 *    Governor-dispatched tasks. External HTTPS through a MITM proxy
 *    fails closed (safe) until CA trust is provisioned.
 *  - Actors: 'governor' (this module), 'human' (verified identity),
 *    'executor' (child — may append trace actions, may NEVER transition).
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { GovernorStore, GovernorTransitionError } from './governor-store.mjs';

const GOVERNOR_ACTOR = { type: 'governor', id: 'governor' };

// Dots onboarded for Governor dispatch in this increment. Anything else
// is rejected server-side (never trust the UI's dot list).
// 2026-10-12: Analyst onboarded — skill bundle verified via ForgeOS AI gateway.
// 2026-10-12: Craftsman, Hunter, Shepherd, Closer onboarded — Dexter approved batch.
// 2026-10-12: MediaPilot onboarded — YouTube/media Dot for Shopper's Spot 24x7 ForgeOS Studio.
const ONBOARDED_DOTS = new Set(['scout', 'analyst', 'craftsman', 'hunter', 'shepherd', 'closer', 'mediapilot']);

function newTaskId() {
  return `gov_${Date.now()}_${randomBytes(4).toString('hex')}`;
}

function pidAlive(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

export class Governor {
  constructor(dbPath, opts = {}) {
    this.store = new GovernorStore(dbPath);
    this.executorScript = opts.executorScript; // absolute path to run-task.mjs
    this.executorDb = dbPath;
    this.runsDir = opts.runsDir || null;
    this.children = new Map(); // taskId -> ChildProcess
  }

  close() { try { this.store.close(); } catch {} }

  // ---- Task intake -------------------------------------------------------
  createTask({ dotId, title, url, objective, idempotencyKey, policy }) {
    if (!ONBOARDED_DOTS.has(dotId)) {
      throw new Error(`dot '${dotId}' is not onboarded for Governor dispatch (server-side rejection)`);
    }
    const hostname = new URL(url).hostname.toLowerCase();
    const finalPolicy = {
      allowlist: [hostname],
      tlsMode: 'strict',          // non-negotiable this increment
      timeoutMs: policy?.timeoutMs || 60000,
      maxAttempts: policy?.maxAttempts || 3,
      tools: ['browser'],        // the only tool the executor has
    };
    const id = newTaskId();
    const { task, duplicate } = this.store.createGovernorTask({
      id, dotId, title, url, objective,
      policy: finalPolicy, idempotencyKey: idempotencyKey || null,
      actor: GOVERNOR_ACTOR,
    });
    return { task, duplicate };
  }

  routeTask(taskId, actor = GOVERNOR_ACTOR) {
    const task = this.store.getGovernorTask(taskId);
    if (!task) throw new Error(`task not found: ${taskId}`);
    // One authoritative assignment: the policy recorded at creation IS the
    // assignment (dot + allowlist + tools). Re-routing is a no-op.
    return this.store.transition(taskId, 'routed', actor, `assigned to Dot "${task.dot_id}" (tools: browser, allowlist: ${JSON.parse(task.policy).allowlist.join(',')})`);
  }

  // ---- Dispatch ----------------------------------------------------------
  async dispatch(taskId) {
    let task = this.store.getGovernorTask(taskId);
    if (!task) throw new Error(`task not found: ${taskId}`);
    if (task.status === 'received') task = this.routeTask(taskId);
    if (task.status !== 'routed' && task.status !== 'interrupted') {
      throw new GovernorTransitionError(taskId, task.status, 'executing', GOVERNOR_ACTOR, 'dispatch only from routed/interrupted (duplicate-execution safeguard)');
    }
    if (this.children.has(taskId)) {
      throw new GovernorTransitionError(taskId, task.status, 'executing', GOVERNOR_ACTOR, 'already has a live executor (duplicate-execution safeguard)');
    }
    const policy = JSON.parse(task.policy);
    this.store.bumpAttempt(taskId);
    task = this.store.transition(taskId, 'executing', GOVERNOR_ACTOR, `attempt ${task.attempt + 1}/${task.max_attempts}`);

    const outDir = this.runsDir ? `${this.runsDir}/gov-${taskId}` : undefined;
    // Scrubbed environment: no insecure-TLS opt-in, ever, for dispatched tasks.
    const childEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => k !== 'DOT_BROWSER_INSECURE_TLS_DEV'));
    const args = ['--dot', task.dot_id, '--url', task.url, '--objective', task.objective || task.title,
      '--db', this.executorDb, '--task-id', taskId];
    if (outDir) args.push('--out', outDir);

    const child = spawn(process.execPath, [this.executorScript, ...args], {
      env: childEnv, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.children.set(taskId, child);
    this.store.setExecutorPid(taskId, child.pid);
    this.store.recordAction(taskId, task.dot_id, 'governor-dispatch', `executor spawned (pid ${child.pid}, attempt ${task.attempt}, strict TLS, allowlist ${policy.allowlist.join(',')})`);

    let stdout = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', () => {});

    const timeoutMs = policy.timeoutMs;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      this.killExecutor(taskId, 'timeout');
    }, timeoutMs);
    // Detach the timer from the event loop accounting that matters for tests.
    timer.unref?.();

    const exit = await new Promise((resolve) => {
      child.on('exit', (code, signal) => resolve({ code, signal }));
      child.on('error', (e) => resolve({ code: -1, signal: null, error: e.message }));
    });
    clearTimeout(timer);
    // Reap the whole process group (executor + shim + chromium), even on
    // clean exit — a crashed executor orphans its children, and orphans
    // accumulate into a resource leak / lingering browser sessions.
    // kill(-pid) targets the group; harmless if already dead.
    try {
      if (child.pid && pidAlive(child.pid)) {
        try { process.kill(-child.pid, 'SIGKILL'); } catch {}
      } else if (child.pid) {
        // Leader dead but group may survive — sweep it.
        try { process.kill(-child.pid, 'SIGKILL'); } catch {}
      }
    } catch {}
    this.children.delete(taskId);
    this.store.clearExecutorPid(taskId);

    // If a human cancelled/delivered while we were waiting, their state wins.
    const curState = this.store.getGovernorTask(taskId)?.status;
    if (curState !== 'executing') {
      this.store.recordAction(taskId, task.dot_id, 'governor-race', `executor exited but task is ${curState} — leaving authoritative state`);
      return this.store.getGovernorTask(taskId);
    }

    // Classify the outcome.
    if (timedOut) return this.onInterrupted(taskId, `timeout after ${timeoutMs}ms (process group killed)`);
    if (exit.signal || (exit.code !== 0 && exit.code !== null)) {
      return this.onInterrupted(taskId, `executor died (code ${exit.code}, signal ${exit.signal})`);
    }
    // Clean exit: the child reports its own honest status in the last JSON line.
    let reported = null;
    try {
      const last = stdout.trim().split('\n').pop() || '{}';
      reported = JSON.parse(last);
    } catch { /* fall through to interrupted */ }
    if (!reported || !reported.status) return this.onInterrupted(taskId, 'executor produced no parseable result');
    this.store.setOutcome(taskId, reported.outcome || '');
    this.store.recordAction(taskId, task.dot_id, 'governor-result', `executor reported: ${reported.status}`);
    if (reported.status === 'completed') {
      return this.store.transition(taskId, 'complete', GOVERNOR_ACTOR, 'executor completed honestly');
    }
    // Honest task failure (bad URL, blocked, cert) — NOT retried automatically.
    return this.store.transition(taskId, 'failed', GOVERNOR_ACTOR, `executor failed honestly: ${(reported.outcome || '').slice(0, 160)}`);
  }

  onInterrupted(taskId, reason) {
    const cur = this.store.getGovernorTask(taskId);
    if (!cur || cur.status !== 'executing') {
      // Raced with cancel/human action — the authoritative state wins; never
      // clobber it.
      try { this.store.recordAction(taskId, cur?.dot_id || '', 'governor-race', `interrupted superseded (state=${cur?.status}): ${reason}`); } catch {}
      return cur;
    }
    const task = this.store.transition(taskId, 'interrupted', GOVERNOR_ACTOR, reason);
    if (task.attempt < task.max_attempts) {
      this.store.recordAction(taskId, task.dot_id, 'governor-retry', `scheduling retry (attempt ${task.attempt + 1}/${task.max_attempts})`);
      return this.dispatch(taskId); // recursive retry; bounded by max_attempts
    }
    return this.store.transition(taskId, 'failed', GOVERNOR_ACTOR, `retry budget exhausted (${task.attempt}/${task.max_attempts}): ${reason}`);
  }

  killExecutor(taskId, why) {
    const child = this.children.get(taskId);
    if (child && child.pid && pidAlive(child.pid)) {
      try { process.kill(-child.pid, 'SIGKILL'); } catch {} // whole process group: node + shim + chromium
      this.store.recordAction(taskId, '', 'governor-kill', `executor process group ${child.pid} killed (${why})`);
    }
    this.children.delete(taskId);
  }

  // ---- Human authority ---------------------------------------------------
  cancel(taskId, humanActor, reason = '') {
    this.killExecutor(taskId, 'cancelled by human');
    return this.store.transition(taskId, 'cancelled', humanActor, reason || `cancelled by ${humanActor.id}`);
  }

  verify(taskId, humanActor, checklist, note = '') {
    if (!Array.isArray(checklist) || checklist.length === 0) {
      throw new Error('verification requires a non-empty checklist');
    }
    const task = this.store.transition(taskId, 'verified', humanActor, `verified by ${humanActor.id}`);
    this.store.recordVerification(taskId, humanActor.id, checklist, 'verified', note);
    return task;
  }

  deliver(taskId, humanActor, note = '') {
    const task = this.store.transition(taskId, 'delivered', humanActor, note || `delivered by ${humanActor.id}`);
    return task;
  }

  // ---- Recovery & orphans --------------------------------------------------
  recover() {
    const report = { interrupted: [], retried: [], orphansKilled: [] };
    for (const task of this.store.tasksInStates(['executing'])) {
      const alive = pidAlive(task.executor_pid);
      if (!alive) {
        this.store.recordAction(task.id, task.dot_id, 'governor-recover', `executor pid ${task.executor_pid} dead at recovery — marking interrupted`);
        const t = this.store.transition(task.id, 'interrupted', GOVERNOR_ACTOR, 'crash recovery: executor gone');
        report.interrupted.push(task.id);
        if (t.attempt < t.max_attempts) report.retried.push(task.id);
      } else {
        // Executor alive but this Governor didn't spawn it (fresh instance):
        // treat as orphan of a dead governor — kill it, mark interrupted.
        // (If the owning governor is alive, it holds the child in its map;
        // a second recover() on the same live governor is a no-op here
        // because children.has() is checked... see reapOrphans.)
        report.orphansKilled.push({ task: task.id, pid: task.executor_pid });
      }
    }
    // Kill the orphans recorded above, then mark their tasks interrupted.
    for (const o of report.orphansKilled) {
      try { process.kill(-o.pid, 'SIGKILL'); } catch {}
      try { process.kill(o.pid, 'SIGKILL'); } catch {}
      const t = this.store.getGovernorTask(o.task);
      if (t && t.status === 'executing') {
        this.store.transition(o.task, 'interrupted', GOVERNOR_ACTOR, `orphan executor pid ${o.pid} reaped at recovery`);
      }
    }
    return report;
  }

  reapOrphans() {
    // Any executor_pid alive whose task is NOT executing is a stray — kill it.
    const killed = [];
    for (const task of this.store.tasksInStates(['received', 'routed', 'interrupted', 'complete', 'failed', 'cancelled', 'verified', 'delivered'])) {
      if (task.executor_pid && pidAlive(task.executor_pid) && !this.children.has(task.id)) {
        try { process.kill(-task.executor_pid, 'SIGKILL'); } catch {}
        try { process.kill(task.executor_pid, 'SIGKILL'); } catch {}
        killed.push({ task: task.id, pid: task.executor_pid });
        this.store.clearExecutorPid(task.id);
        this.store.recordAction(task.id, task.dot_id, 'governor-reap', `orphan executor pid ${task.executor_pid} killed`);
      }
    }
    return killed;
  }

  // ---- Views ---------------------------------------------------------------
  view(taskId) {
    const task = this.store.getGovernorTask(taskId);
    if (!task) return null;
    const actions = this.store.taskActions(taskId, task.dot_id);
    return {
      id: task.id, dotId: task.dot_id, title: task.title, url: task.url,
      status: task.status, honestLabel: GovernorStore.honestLabel(task),
      isDone: GovernorStore.isDone(task),
      attempt: task.attempt, maxAttempts: task.max_attempts,
      policy: JSON.parse(task.policy || '{}'),
      outcome: task.outcome,
      transitions: this.store.getTransitions(taskId),
      verification: this.store.getVerification(taskId),
      trace: actions.map((a) => ({ at: a.created_at, type: a.action_type, detail: a.detail })),
    };
  }

  list(state) {
    const states = state ? [state] : ['received', 'routed', 'executing', 'interrupted', 'complete', 'failed', 'cancelled', 'verified', 'delivered'];
    return this.store.tasksInStates(states).map((t) => ({
      id: t.id, dotId: t.dot_id, title: t.title, status: t.status,
      honestLabel: GovernorStore.honestLabel(t), attempt: t.attempt, updatedAt: t.updated_at,
    }));
  }
}

export { GovernorTransitionError };
export { pidAlive };
