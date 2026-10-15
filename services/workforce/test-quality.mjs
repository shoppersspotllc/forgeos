// Quality regression runner — deterministic, no model, no network.
// Run: node test-quality.mjs
import { readFileSync } from 'fs';
import {
  relevanceScore, dedupeSources, normalizeUrl,
  countUnverifiedClaims, detectStaleDates, datesSupportedByEvidence,
  industryKeywords, prospectMatchesIndustry, geoKeywords, assessProspectFit,
} from './quality-checks.mjs';

const dataset = JSON.parse(readFileSync('./quality-regression.json', 'utf-8'));
let passed = 0, failed = 0;
const failures = [];
const pr = { tp: 0, fp: 0, fn: 0, tn: 0, examples: [] };

for (const c of dataset.cases) {
  let ok = false, detail = '';
  try {
    switch (c.category) {
      case 'search-relevance': {
        const s = relevanceScore(c.input.query, c.input.title, c.input.snippet);
        detail = `score=${s.toFixed(2)}`;
        ok = c.expect.minScore !== undefined ? s >= c.expect.minScore : s <= c.expect.maxScore;
        break;
      }
      case 'deduplication': {
        const { unique, duplicatesRemoved } = dedupeSources(c.input);
        detail = `unique=${unique.length}, removed=${duplicatesRemoved}`;
        ok = unique.length === c.expect.unique && duplicatesRemoved === c.expect.duplicatesRemoved;
        break;
      }
      case 'unsupported-claims': {
        const n = countUnverifiedClaims(c.input);
        detail = `count=${n}`;
        ok = n === c.expect.unverifiedCount;
        break;
      }
      case 'stale-dates': {
        const stale = detectStaleDates(c.input);
        detail = `stale=[${stale.join(',')}]`;
        ok = (stale.length > 0) === c.expect.staleFound;
        break;
      }
      case 'hunter-false-positive': {
        const kw = industryKeywords(c.input.profile);
        const r = prospectMatchesIndustry(c.input.prospect, kw);
        detail = `match=${r.match} (${r.reason})`;
        ok = r.match === c.expect.match;
        break;
      }
      case 'normalization': {
        const n = normalizeUrl(c.input);
        detail = `normalized=${n}`;
        ok = n === c.expect.normalized;
        break;
      }
      case 'hunter-geo-fit': {
        const gk = geoKeywords(c.input.profile);
        const fit = assessProspectFit(c.input.prospect, [], gk, [c.input.prospect]);
        detail = `geoMatch=${fit.geo.match} (keywords: [${gk.join(',')}])`;
        ok = fit.geo.match === c.expect.geoMatch;
        break;
      }
      case 'craftsman-artifact': {
        const content = c.input.content || '';
        const valid = content.length > 100 && !(content.includes('TODO') && content.length <= 500);
        detail = `valid=${valid} (bytes=${content.length})`;
        ok = valid === c.expect.valid;
        break;
      }
      case 'date-evidence': {
        const r = datesSupportedByEvidence(c.input.modelText, c.input.evidence);
        detail = `unsupported=[${r.unsupported.join(',')}]`;
        ok = r.unsupported.length === c.expect.unsupportedCount;
        break;
      }
      case 'prospect-label': {
        // Labeled evaluation: does the quality gate agree with the human label?
        // A prospect is PREDICTED positive if assessProspectFit says SUPPORTED.
        const ik = industryKeywords(c.input.profile);
        const gk = geoKeywords(c.input.profile);
        const fit = assessProspectFit(c.input.prospect, ik, gk, [c.input.prospect]);
        const predicted = fit.status === 'SUPPORTED';
        detail = `label=${c.label}, predicted=${predicted} (${fit.status})`;
        ok = predicted === c.label;
        // Track for precision/recall
        if (c.label && predicted) pr.tp++;
        else if (!c.label && predicted) pr.fp++;
        else if (c.label && !predicted) pr.fn++;
        else pr.tn++;
        pr.examples.push({ id: c.id, label: c.label, predicted, status: fit.status, desc: c.description });
        break;
      }
      case 'prospect-fit-status': {
        // Tests exact fit status (SUPPORTED/UNCERTAIN/FAILED), not just boolean
        const ik = industryKeywords(c.input.profile);
        const gk = geoKeywords(c.input.profile);
        const fit = assessProspectFit(c.input.prospect, ik, gk, [c.input.prospect]);
        detail = `status=${fit.status} (expected ${c.expect.status}); reason: ${fit.reason}`;
        ok = fit.status === c.expect.status;
        break;
      }
      default: detail = 'unknown category'; ok = false;
    }
  } catch (e) { detail = `error: ${e.message}`; ok = false; }

  if (ok) { passed++; console.log(`PASS ${c.id} — ${c.description} (${detail})`); }
  else { failed++; failures.push(c.id); console.log(`FAIL ${c.id} — ${c.description} (${detail})`); }
}

console.log(`\n${passed}/${passed + failed} quality regression tests passed`);
if (failed) { console.log('Failed:', failures.join(', ')); }

// Precision/recall on labeled prospect dataset
const total = pr.tp + pr.fp + pr.fn + pr.tn;
if (total > 0) {
  const precision = pr.tp + pr.fp ? pr.tp / (pr.tp + pr.fp) : 0;
  const recall = pr.tp + pr.fn ? pr.tp / (pr.tp + pr.fn) : 0;
  console.log(`\n--- Prospect Quality Gate: Precision/Recall (n=${total}) ---`);
  console.log(`Precision: ${precision.toFixed(2)} (${pr.tp} TP / ${pr.tp + pr.fp} predicted positive)`);
  console.log(`Recall:    ${recall.toFixed(2)} (${pr.tp} TP / ${pr.tp + pr.fn} actual positive)`);
  console.log(`FP: ${pr.fp}, FN: ${pr.fn}, TN: ${pr.tn}`);
  console.log('\nAuditable examples:');
  for (const e of pr.examples) {
    const mark = (e.label === e.predicted) ? '✓' : '✗';
    console.log(`  ${mark} ${e.id}: label=${e.label} predicted=${e.predicted} [${e.status}] — ${e.desc}`);
  }
}

if (failed) process.exit(1);
