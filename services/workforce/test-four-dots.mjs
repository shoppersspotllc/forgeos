// E2E Verification: Hunter, Craftsman, Closer, Shepherd
// Run: node test-four-dots.mjs
// Requires: FORGEOS_AI_ENDPOINT and FORGEOS_SERVICE_KEY env vars
import { HunterBundle } from './hunter-bundle.mjs';
import { CraftsmanBundle } from './craftsman-bundle.mjs';
import { CloserBundle } from './closer-bundle.mjs';
import { ShepherdBundle } from './shepherd-bundle.mjs';

const results = [];

async function runTest(name, fn) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`TEST: ${name}`);
  console.log('='.repeat(50));
  const t0 = Date.now();
  try {
    const task = await fn();
    const ms = Date.now() - t0;
    const pass = task.status === 'completed' && task.verification !== 'UNVERIFIED';
    results.push({ name, pass, taskId: task.id, verification: task.verification, ms, recordPath: task.recordPath });
    console.log(`Result: ${pass ? 'PASS' : 'FAIL'} (${task.verification}, ${ms}ms)`);
    console.log(`Task: ${task.id}`);
    if (!pass) console.log(`Error: ${task.error || 'verification UNVERIFIED'}`);
  } catch (e) {
    results.push({ name, pass: false, error: e.message, ms: Date.now() - t0 });
    console.log(`Result: FAIL — ${e.message}`);
  }
}

// A. Hunter — Prospect Discovery (limited scope, no contact)
await runTest('Hunter — Prospect Discovery', async () => {
  const hunter = new HunterBundle({ tasksDir: './hunter-tasks-e2e' });
  return hunter.discover('small HVAC companies in Texas looking for website help', 3);
});

// B. Craftsman — Build Artifact (bounded, no production changes)
await runTest('Craftsman — Build Artifact', async () => {
  const craftsman = new CraftsmanBundle({ tasksDir: './craftsman-tasks-e2e', artifactsDir: './craftsman-artifacts-e2e' });
  return craftsman.build('A simple HTML landing page for a fictional bakery called "Sunrise Bakery" with headline, 3 menu items, and contact section');
});

// C. Closer — Research-Backed Proposal (draft only, no sending)
await runTest('Closer — Proposal Draft', async () => {
  const closer = new CloserBundle({ tasksDir: './closer-tasks-e2e' });
  return closer.propose(
    'local bakery website design services',
    '$299 one-time setup + $39/month for a mobile-friendly website with online ordering'
  );
});

// D. Shepherd — Monitoring Report (public target, no baseline claims)
await runTest('Shepherd — Monitoring Report', async () => {
  const shepherd = new ShepherdBundle({ tasksDir: './shepherd-tasks-e2e' });
  return shepherd.monitor('Node.js LTS release schedule', 'No prior baseline — first check');
});

console.log(`\n${'='.repeat(50)}`);
console.log('FINAL RESULTS');
console.log('='.repeat(50));
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.name} (${r.verification || r.error}, ${r.ms}ms)`);
  if (r.taskId) console.log(`       Task: ${r.taskId}`);
}
const passed = results.filter(r => r.pass).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
