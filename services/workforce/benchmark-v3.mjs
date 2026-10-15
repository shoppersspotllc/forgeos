// Phase 6 audit benchmark — holdout v3, run ONCE against frozen dataset.
// Metric definitions:
// - Exact-match accuracy: predicted == expected / total
// - SUPPORTED precision: correct SUPPORTED / all predicted SUPPORTED
//   (UNCERTAIN predictions are NOT counted as SUPPORTED — conservative)
// - SUPPORTED recall: correct SUPPORTED / all labeled SUPPORTED
// - Uncertainty rate: predicted UNCERTAIN / total
// - FP: predicted SUPPORTED when expected FAILED or UNCERTAIN
// - FN: predicted FAILED or UNCERTAIN when expected SUPPORTED
//   (UNCERTAIN on a SUPPORTED case counts as FN for recall — we measure
//   whether the classifier finds valid prospects, not just avoids errors)
import { readFileSync } from 'fs';
import { industryKeywords, geoKeywords, assessProspectFit } from './quality-checks.mjs';

const bench = JSON.parse(readFileSync('./benchmark-prospects-v3.json', 'utf-8'));
console.log(`Audit Holdout v${bench.version}: ${bench.cases.length} cases (FROZEN)\n`);

const labels = ['SUPPORTED', 'UNCERTAIN', 'FAILED'];
const confusion = {};
for (const e of labels) { confusion[e] = { SUPPORTED: 0, UNCERTAIN: 0, FAILED: 0 }; }

let tp = 0, fp = 0, fn = 0, tn = 0, uncertainCount = 0;
const errors = [];
const byCategory = {};

for (const c of bench.cases) {
  const ik = industryKeywords(c.input.profile);
  const gk = geoKeywords(c.input.profile);
  const fit = assessProspectFit(c.input.prospect, ik, gk, [c.input.prospect]);
  const predicted = fit.status, expected = c.expected;

  confusion[expected][predicted]++;

  if (expected === 'SUPPORTED' && predicted === 'SUPPORTED') tp++;
  else if (expected !== 'SUPPORTED' && predicted === 'SUPPORTED') { fp++; errors.push(c); }
  else if (expected === 'SUPPORTED' && predicted !== 'SUPPORTED') { fn++; errors.push(c); }
  else tn++;
  if (predicted === 'UNCERTAIN') uncertainCount++;

  const cat = c.description.split('—')[0].split('(')[0].trim().split(' ').slice(0, 3).join(' ');
  byCategory[c.id] = { expected, predicted, match: expected === predicted };
}

const n = bench.cases.length;
const exact = labels.reduce((s, l) => s + confusion[l][l], 0);
const precision = tp + fp ? tp / (tp + fp) : 0;
const recall = tp + fn ? tp / (tp + fn) : 0;

console.log('--- Three-way confusion (rows=expected, cols=predicted) ---');
console.log('           SUPPORTED  UNCERTAIN  FAILED');
for (const e of labels) {
  console.log(`${e.padEnd(10)} ${String(confusion[e].SUPPORTED).padStart(9)} ${String(confusion[e].UNCERTAIN).padStart(9)} ${String(confusion[e].FAILED).padStart(6)}`);
}

console.log(`\n--- Metrics (n=${n}) ---`);
console.log(`Exact-match accuracy: ${exact}/${n} (${(exact/n*100).toFixed(0)}%)`);
console.log(`SUPPORTED precision: ${precision.toFixed(2)} (${tp}/${tp+fp} predicted SUPPORTED correct)`);
console.log(`SUPPORTED recall: ${recall.toFixed(2)} (${tp}/${tp+fn} labeled SUPPORTED found)`);
console.log(`Uncertainty rate: ${(uncertainCount/n*100).toFixed(0)}% (${uncertainCount}/${n})`);
console.log(`False positives: ${fp} | False negatives: ${fn}`);

if (errors.length) {
  console.log('\n--- Errors ---');
  for (const c of errors) {
    const ik = industryKeywords(c.input.profile);
    const gk = geoKeywords(c.input.profile);
    const fit = assessProspectFit(c.input.prospect, ik, gk, [c.input.prospect]);
    console.log(`✗ ${c.id}: expected ${c.expected}, got ${fit.status}`);
    console.log(`  ${c.description}`);
    console.log(`  Reason: ${fit.reason}`);
  }
}
console.log('\nEvidence preservation: ' +
  (bench.cases.every(c => c.input.prospect.url) ? 'PASS — all cases have source URLs' : 'FAIL'));
