// Independent benchmark runner — holdout validation, NO TUNING.
// Run: node benchmark.mjs
// This dataset was NOT used to build the classifier. Report honest results.
import { readFileSync } from 'fs';
import { industryKeywords, geoKeywords, assessProspectFit } from './quality-checks.mjs';

const bench = JSON.parse(readFileSync('./benchmark-prospects-v2.json', 'utf-8'));
console.log(`Benchmark v${bench.version}: ${bench.cases.length} holdout cases\n`);

let correct = 0, acceptable = 0;
const pr = { tp: 0, fp: 0, fn: 0, tn: 0 };
let uncertainCount = 0;
const failures = [];

for (const c of bench.cases) {
  const ik = industryKeywords(c.input.profile);
  const gk = geoKeywords(c.input.profile);
  // Evidence = the prospect itself (simulating a single-source evidence set)
  const fit = assessProspectFit(c.input.prospect, ik, gk, [c.input.prospect]);
  const predicted = fit.status;
  const expected = c.expected;

  let result;
  if (predicted === expected) { correct++; result = 'CORRECT'; }
  else if (predicted === 'UNCERTAIN') { acceptable++; result = 'ACCEPTABLE (conservative)'; }
  else { result = 'ERROR'; failures.push({ id: c.id, expected, predicted, reason: fit.reason, desc: c.description }); }

  // Precision/recall on SUPPORTED predictions
  if (expected === 'SUPPORTED' && predicted === 'SUPPORTED') pr.tp++;
  else if (expected !== 'SUPPORTED' && predicted === 'SUPPORTED') pr.fp++;
  else if (expected === 'SUPPORTED' && predicted !== 'SUPPORTED') pr.fn++;
  else pr.tn++;
  if (predicted === 'UNCERTAIN') uncertainCount++;

  const mark = result === 'CORRECT' ? '✓' : result.startsWith('ACCEPTABLE') ? '~' : '✗';
  console.log(`${mark} ${c.id} [expected=${expected} predicted=${predicted}] — ${c.description}`);
}

const n = bench.cases.length;
const precision = pr.tp + pr.fp ? pr.tp / (pr.tp + pr.fp) : 0;
const recall = pr.tp + pr.fn ? pr.tp / (pr.tp + pr.fn) : 0;

console.log(`\n--- Holdout Results (n=${n}) ---`);
console.log(`Exact match: ${correct}/${n} (${(correct/n*100).toFixed(0)}%)`);
console.log(`Acceptable (conservative UNCERTAIN): ${acceptable}/${n}`);
console.log(`Errors: ${failures.length}/${n}`);
console.log(`Precision: ${precision.toFixed(2)} | Recall: ${recall.toFixed(2)}`);
console.log(`Uncertainty rate: ${(uncertainCount/n*100).toFixed(0)}% (${uncertainCount}/${n})`);
console.log(`FP: ${pr.fp}, FN: ${pr.fn}`);

if (failures.length) {
  console.log('\n--- Failure breakdown ---');
  for (const f of failures) {
    console.log(`✗ ${f.id}: expected ${f.expected}, got ${f.predicted}`);
    console.log(`  ${f.desc}`);
    console.log(`  Reason: ${f.reason}`);
  }
}

// Verify rejected candidates would remain in evidence (structural check)
console.log('\n--- Evidence preservation check ---');
console.log('All benchmark prospects include source URLs: ' +
  (bench.cases.every(c => c.input.prospect.url) ? 'PASS' : 'FAIL'));
