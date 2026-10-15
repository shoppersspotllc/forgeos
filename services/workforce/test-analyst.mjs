// Test: Analyst Skill Bundle — Evidence-backed research workflow
// Run: node test-analyst.mjs (requires ForgeOS AI gateway running with FORGEOS_SERVICE_KEY set)
import { AnalystBundle } from './analyst-bundle.mjs';

console.log('=== Analyst Skill Bundle Test ===\n');

const bundle = new AnalystBundle({ tasksDir: './analyst-tasks-test' });

console.log('Research question: "What is the current version of Node.js LTS?"');
console.log('Starting research workflow...\n');

const task = await bundle.research('What is the current version of Node.js LTS?');

console.log('\n=== TASK RECORD ===');
console.log(`ID: ${task.id}`);
console.log(`Status: ${task.status}`);
console.log(`Verification: ${task.verification}`);
console.log(`Steps: ${task.steps.length}`);
console.log(`Evidence sources: ${task.evidence.reduce((n, e) => n + e.results.length, 0)}`);
console.log(`Record: ${task.recordPath}`);

if (task.answer) {
  console.log(`\n=== ANSWER (first 500 chars) ===`);
  console.log(task.answer.slice(0, 500));
}

console.log(`\n=== RESULT: ${task.status === 'completed' && task.verification !== 'UNVERIFIED' ? 'PASS' : 'FAIL'} ===`);
process.exit(task.status === 'completed' ? 0 : 1);
