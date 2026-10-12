#!/usr/bin/env node
/**
 * Governor CLI — the human authority interface for this phase.
 *
 * Usage:
 *   node governor-cli.mjs list [--state <state>] [--db <path>]
 *   node governor-cli.mjs show <taskId> [--db <path>]
 *   node governor-cli.mjs verify <taskId> --by <human-id> --check "item1" --check "item2" [--note "..."] [--db <path>]
 *   node governor-cli.mjs deliver <taskId> --by <human-id> [--note "..."] [--db <path>]
 *   node governor-cli.mjs cancel <taskId> --by <human-id> [--reason "..."] [--db <path>]
 *   node governor-cli.mjs recover [--db <path>]
 *   node governor-cli.mjs reap [--db <path>]
 *
 * The --by identity is recorded in the audit trail. There is no other
 * path to verified/delivered in this phase.
 */
import { Governor } from './governor.mjs';

const DEFAULT_DB = '/home/hatch/workspace/forgeos/services/workforce/dot-executor/runs/tasks.db';

function arg(name, def = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
function argAll(name) {
  const out = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === `--${name}` && process.argv[i + 1]) out.push(process.argv[i + 1]);
  }
  return out;
}

async function main() {
  const cmd = process.argv[2];
  const db = arg('db', process.env.GOVERNOR_DB || DEFAULT_DB);
  const gov = new Governor(db, {
    executorScript: '/home/hatch/workspace/forgeos/services/workforce/dot-executor/run-task.mjs',
    runsDir: '/home/hatch/workspace/forgeos/services/workforce/dot-executor/runs',
  });
  const human = (id) => {
    if (!id) throw new Error('--by <human-id> is required (audited identity)');
    return { type: 'human', id };
  };
  try {
    switch (cmd) {
      case 'list': {
        const rows = gov.list(arg('state', ''));
        for (const r of rows) console.log(`${r.id} | ${r.dotId} | ${r.status} | ${r.honestLabel} | attempt ${r.attempt} | ${r.title.slice(0, 60)}`);
        console.log(`(${rows.length} tasks)`);
        break;
      }
      case 'show': {
        const v = gov.view(process.argv[3]);
        if (!v) throw new Error('task not found');
        console.log(JSON.stringify(v, null, 2));
        break;
      }
      case 'verify': {
        const checks = argAll('check');
        const t = gov.verify(process.argv[3], human(arg('by')), checks, arg('note'));
        console.log(`verified: ${t.id} -> ${t.status} (by ${arg('by')})`);
        break;
      }
      case 'deliver': {
        const t = gov.deliver(process.argv[3], human(arg('by')), arg('note'));
        console.log(`delivered: ${t.id} -> ${t.status} (by ${arg('by')})`);
        break;
      }
      case 'cancel': {
        const t = gov.cancel(process.argv[3], human(arg('by')), arg('reason'));
        console.log(`cancelled: ${t.id} -> ${t.status} (by ${arg('by')})`);
        break;
      }
      case 'recover': {
        console.log(JSON.stringify(await gov.recover(), null, 2));
        break;
      }
      case 'reap': {
        console.log(JSON.stringify(gov.reapOrphans(), null, 2));
        break;
      }
      default:
        console.error('commands: list, show, verify, deliver, cancel, recover, reap');
        process.exit(2);
    }
  } finally {
    gov.close();
  }
}

main().catch((e) => { console.error(`error: ${e.message}`); process.exit(1); });
