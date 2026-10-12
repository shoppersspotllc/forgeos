/**
 * GovernorStore — the Governor's authoritative task record.
 *
 * Extends the proven TaskHistoryStore (same SQLite file, same tables) with:
 *  - task_transitions: append-only log of every legal state change
 *  - task_verifications: human sign-off records (verified/delivered authority)
 *  - task columns: governor state (in `status`), attempt, max_attempts,
 *    policy JSON, idempotency_key UNIQUE, executor_pid
 *
 * The Governor NEVER forks the store: one file, one schema, one writer
 * of transitions (the Governor itself, via atomic compare-and-set).
 */
import { TaskHistoryStore } from '../../../../dot-foundation/task-history.ts';

// ---- Legal transition table: fromState -> { toState: [allowed actor types] }
// Dots/executors can NEVER transition. Only 'human' can verify/deliver.
// 'governor' is the module itself applying executor results.
export const LEGAL_TRANSITIONS = {
  received:    { routed: ['governor', 'human'], cancelled: ['human'] },
  routed:      { executing: ['governor'], cancelled: ['human'] },
  executing:   { complete: ['governor'], failed: ['governor'], interrupted: ['governor'], cancelled: ['human'] },
  interrupted: { executing: ['governor'], failed: ['governor'] },
  complete:    { verified: ['human'], failed: ['human'] },
  verified:    { delivered: ['human'], complete: ['human'] },
  failed:      { routed: ['human'] },
  cancelled:   {},
  delivered:   {},
};

// States the Governor vocabulary uses (stored in dot_task_history.status).
// Standalone executor runs keep the legacy values (started/in_progress/
// completed/failed); Governor-owned tasks use the vocabulary below.
export const GOVERNOR_STATES = Object.keys(LEGAL_TRANSITIONS);

export class GovernorTransitionError extends Error {
  constructor(taskId, from, to, actor, why) {
    super(`illegal transition ${from} -> ${to} for task ${taskId} (actor ${actor?.type}:${actor?.id || '?'}): ${why}`);
    this.name = 'GovernorTransitionError';
    this.taskId = taskId; this.from = from; this.to = to; this.actor = actor;
  }
}

export class GovernorStore extends TaskHistoryStore {
  constructor(dbPath) {
    super(dbPath);
    this.initGovernorSchema();
  }

  initGovernorSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_transitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        from_state TEXT NOT NULL,
        to_state TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        actor_id TEXT NOT NULL DEFAULT '',
        reason TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_transitions_task ON task_transitions(task_id);
      CREATE TABLE IF NOT EXISTS task_verifications (
        task_id TEXT PRIMARY KEY,
        verifier TEXT NOT NULL,
        checklist TEXT NOT NULL,
        decision TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    // Additive columns on the shared task table (idempotent).
    for (const [col, def] of [
      ['attempt', 'INTEGER NOT NULL DEFAULT 0'],
      ['max_attempts', 'INTEGER NOT NULL DEFAULT 3'],
      ['policy', 'TEXT NOT NULL DEFAULT \'{}\''],
      ['idempotency_key', 'TEXT'],
      ['executor_pid', 'INTEGER'],
      ['url', 'TEXT'],
      ['objective', 'TEXT'],
    ]) {
      try { this.db.exec(`ALTER TABLE dot_task_history ADD COLUMN ${col} ${def}`); }
      catch { /* already exists */ }
    }
    try { this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_task_idem ON dot_task_history(idempotency_key)`); }
    catch { /* exists */ }
  }

  // ---- Task access -------------------------------------------------------
  getGovernorTask(taskId) {
    return this.db.prepare(`SELECT * FROM dot_task_history WHERE id = ?`).get(taskId) || null;
  }

  findByIdempotencyKey(key) {
    if (!key) return null;
    return this.db.prepare(`SELECT * FROM dot_task_history WHERE idempotency_key = ?`).get(key) || null;
  }

  createGovernorTask({ id, dotId, title, url, objective, policy, idempotencyKey, actor }) {
    this.assertActor(actor, ['governor', 'human']);
    const existing = this.findByIdempotencyKey(idempotencyKey);
    if (existing) return { task: existing, duplicate: true };
    const now = new Date().toISOString();
    try {
      this.db.prepare(`
        INSERT INTO dot_task_history
          (id, dot_id, title, url, objective, status, plan, outcome, attempt, max_attempts, policy, idempotency_key, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'received', '', '', 0, ?, ?, ?, ?, ?)
      `).run(id, dotId, title, url || '', objective || '', policy.maxAttempts || 3,
              JSON.stringify(policy), idempotencyKey || null, now, now);
    } catch (e) {
      // Race on idempotency key: return the winner instead of a duplicate.
      if (String(e.message).includes('UNIQUE')) {
        const winner = this.findByIdempotencyKey(idempotencyKey);
        if (winner) return { task: winner, duplicate: true };
      }
      throw e;
    }
    this.logTransition(id, 'received', 'received', actor, 'task created');
    this.recordAction(id, dotId, 'received', `task received (policy: ${JSON.stringify(policy)})`);
    return { task: this.getGovernorTask(id), duplicate: false };
  }

  // ---- Transitions -------------------------------------------------------
  assertActor(actor, allowed) {
    if (!actor || !allowed.includes(actor.type)) {
      throw new GovernorTransitionError('?', '?', '?', actor, `actor type not permitted here`);
    }
    if (actor.type === 'human' && !actor.id) {
      throw new GovernorTransitionError('?', '?', '?', actor, `human actor requires an identity`);
    }
  }

  logTransition(taskId, from, to, actor, reason) {
    this.db.prepare(`
      INSERT INTO task_transitions (task_id, from_state, to_state, actor_type, actor_id, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(taskId, from, to, actor.type, actor.id || '', reason || '');
  }

  /**
   * Apply a legal transition atomically (compare-and-set on current state).
   * Throws GovernorTransitionError on illegal transition/actor; the attempt
   * is recorded in the task trace for audit.
   */
  transition(taskId, toState, actor, reason = '') {
    const task = this.getGovernorTask(taskId);
    if (!task) throw new GovernorTransitionError(taskId, '?', toState, actor, 'task not found');
    const from = task.status;
    const allowed = (LEGAL_TRANSITIONS[from] || {})[toState];
    const why = !allowed
      ? `transition not in legal table`
      : !allowed.includes(actor?.type)
        ? `actor type '${actor?.type}' not authorized (needs: ${allowed.join('/')})`
        : (actor?.type === 'human' && !actor.id ? 'human actor requires an identity' : null);
    if (why) {
      try { this.recordAction(taskId, task.dot_id, 'transition-rejected', `${from} -> ${toState} by ${actor?.type}:${actor?.id || '?'}: ${why}`); } catch {}
      throw new GovernorTransitionError(taskId, from, toState, actor, why);
    }
    // Atomic compare-and-set: BEGIN IMMEDIATE takes the write lock up front,
    // so two governors racing the same transition cannot both succeed.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const upd = this.db.prepare(`
        UPDATE dot_task_history SET status = ?, updated_at = datetime('now')
        WHERE id = ? AND status = ?
      `).run(toState, taskId, from);
      if (upd.changes === 0) {
        throw new GovernorTransitionError(taskId, from, toState, actor, 'concurrent modification — state changed under us');
      }
      this.logTransition(taskId, from, toState, actor, reason);
      this.recordAction(taskId, task.dot_id, 'transition', `${from} -> ${toState} (${actor.type}${actor.id ? ':' + actor.id : ''})${reason ? ': ' + reason : ''}`);
      this.db.exec('COMMIT');
    } catch (e) {
      try { this.db.exec('ROLLBACK'); } catch {}
      throw e;
    }
    return this.getGovernorTask(taskId);
  }

  setExecutorPid(taskId, pid) {
    this.db.prepare(`UPDATE dot_task_history SET executor_pid = ?, updated_at = datetime('now') WHERE id = ?`).run(pid, taskId);
  }

  clearExecutorPid(taskId) {
    this.db.prepare(`UPDATE dot_task_history SET executor_pid = NULL, updated_at = datetime('now') WHERE id = ?`).run(taskId);
  }

  bumpAttempt(taskId) {
    this.db.prepare(`UPDATE dot_task_history SET attempt = attempt + 1, updated_at = datetime('now') WHERE id = ?`).run(taskId);
  }

  setOutcome(taskId, outcome) {
    this.db.prepare(`UPDATE dot_task_history SET outcome = ?, updated_at = datetime('now') WHERE id = ?`).run(outcome, taskId);
  }

  setPolicy(taskId, policy) {
    this.db.prepare(`UPDATE dot_task_history SET policy = ?, updated_at = datetime('now') WHERE id = ?`).run(JSON.stringify(policy), taskId);
  }

  // ---- Verification ------------------------------------------------------
  recordVerification(taskId, verifier, checklist, decision, note = '') {
    this.db.prepare(`
      INSERT INTO task_verifications (task_id, verifier, checklist, decision, note)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(task_id) DO UPDATE SET verifier=excluded.verifier, checklist=excluded.checklist,
        decision=excluded.decision, note=excluded.note, created_at=datetime('now')
    `).run(taskId, verifier, JSON.stringify(checklist), decision, note);
  }

  getVerification(taskId) {
    const row = this.db.prepare(`SELECT * FROM task_verifications WHERE task_id = ?`).get(taskId);
    if (row) { try { row.checklist = JSON.parse(row.checklist); } catch {} }
    return row || null;
  }

  getTransitions(taskId) {
    return this.db.prepare(`SELECT * FROM task_transitions WHERE task_id = ? ORDER BY id ASC`).all(taskId);
  }

  tasksInStates(states) {
    const q = states.map(() => '?').join(',');
    return this.db.prepare(`SELECT * FROM dot_task_history WHERE status IN (${q}) ORDER BY updated_at DESC`).all(...states);
  }

  // ---- Honest presentation ----------------------------------------------
  // Only verified/delivered may be reported as "done". Everything else
  // carries its real state label — never a manufactured statistic.
  static honestLabel(task) {
    switch (task.status) {
      case 'delivered': return 'delivered';
      case 'verified': return 'verified — done';
      case 'complete': return 'awaiting human review';
      case 'failed': return 'failed';
      case 'cancelled': return 'cancelled';
      case 'interrupted': return 'interrupted — will retry';
      case 'executing': return 'executing';
      case 'routed': return 'routed — awaiting dispatch';
      case 'received': return 'received';
      default: return task.status;
    }
  }

  static isDone(task) {
    return task.status === 'verified' || task.status === 'delivered';
  }
}
