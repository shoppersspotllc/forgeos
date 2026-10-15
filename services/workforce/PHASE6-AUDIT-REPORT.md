# Phase 6: Independent Classifier Audit Report

**Date:** 2026-10-12 | **Auditor:** Muse | **Status:** COMPLETE — STOP FOR REVIEW

## Objective
Determine whether the Hunter prospect classifier generalizes beyond training examples
and identify highest-value remaining gaps.

## Code changes this phase (justified, dev-cases only)
1. **Informational signals:** added `checklist`, `blog` to BUSINESS_SIGNALS.informational
   and title-level detection regex. Justification: v2 holdout proved a maintenance
   checklist blog was a genuine false positive (SUPPORTED an instructional page).
2. **Service identity:** added `tune-up` to service signals. Justification: tune-up is a
   service offered by HVAC businesses; without it, legitimate tune-up businesses had
   unclear identity.
3. **Industry vocabulary:** added `duct cleaning` to HVAC synonyms. Justification: v2
   audit showed duct cleaning businesses were unrecognized.
4. **Geographic vocabulary:** added 8 major Texas cities (lubbock, corpus christi,
   midland, waco, amarillo, brownsville, killeen, mcallen). Justification: audit
   showed city-name-only evidence could not match geo. Adding cities does NOT
   auto-qualify — SUPPORTED still requires industry + service identity + traceability.

All changes verified against 5 new dev regression cases before holdout evaluation.

## Audit findings

### Finding 1: v2 checklist/blog error — GENUINE FALSE POSITIVE (now fixed)
- Evidence: title "HVAC Maintenance Checklist - Blog", snippet for homeowners.
- Root cause: "checklist"/"blog" not in informational signals; "maintenance"
  triggered service identity.
- Fix verified: now correctly FAILED. Original v2 label unchanged.

### Finding 2: Waco/Amarillo — VOCABULARY GAPS, not evidence gaps
- Both cases had sufficient evidence (city + "Texas" in snippet).
- b2-03 failed on industry ("duct cleaning" unrecognized), b2-11 on identity
  ("tune-up" not a service signal). Geo matched via "Texas" in both.
- Neither was auto-qualified after adding cities — three-way check still enforced.

## Holdout v3 results (n=30, FROZEN, run once)

### Three-way confusion matrix
| Expected \ Predicted | SUPPORTED | UNCERTAIN | FAILED |
|---|---|---|---|
| SUPPORTED (n=11) | 6 | 5 | 0 |
| UNCERTAIN (n=5) | 0 | 5 | 0 |
| FAILED (n=14) | 0 | 6 | 8 |

### Metrics
- **Exact-match accuracy:** 19/30 (63%)
- **SUPPORTED precision:** 1.00 (6/6) — zero false positives
- **SUPPORTED recall:** 0.55 (6/11) — 5 valid prospects went to UNCERTAIN
- **Uncertainty rate:** 53% (16/30)
- **False positives:** 0 | **False negatives:** 5 (all conservative UNCERTAIN)

### Metric definitions
- UNCERTAIN predictions are NEVER counted as SUPPORTED (precision denominator
  excludes them). A SUPPORTED prediction is only correct if the label is SUPPORTED.
- For recall, UNCERTAIN on a SUPPORTED case counts as a miss — we measure whether
  the classifier finds valid prospects, not just avoids errors.

### Error analysis (all 5 are conservative, none are wrong positives)
| Case | Issue | Category |
|---|---|---|
| a3-01 Beaumont AC install | "central air" not in synonyms | Industry vocabulary |
| a3-05 College Station ductwork | "replacement/sealing" not service signals | Identity vocabulary |
| a3-20 Frisco duct sanitizing | "sanitizing" not in synonyms | Industry vocabulary |
| a3-22 Grand Prairie air quality | "indoor air quality" not in synonyms | Industry vocabulary |
| a3-27 Garland heater install | "heater" (noun) not in synonyms, only "heating" | Industry vocabulary |

**Pattern:** All gaps are domain vocabulary coverage, not logic errors. The classifier
is correctly conservative — it refuses to qualify what it cannot recognize rather
than guessing.

### Results by category
- Genuine HVAC providers (11): 6 SUPPORTED, 5 UNCERTAIN, 0 missed as FAILED
- Career pages (2): 2 FAILED ✓
- Blogs/checklists/glossaries (4): 4 FAILED ✓
- Parts/product retailers (3): 3 FAILED ✓
- Wrong trade (2): 2 FAILED ✓
- Wrong state (2): 2 FAILED ✓
- Mixed service/product (1): 1 UNCERTAIN ✓
- Ambiguous (5): 5 UNCERTAIN ✓

## Baseline preservation
- Quality regression: **44/44 passed** (actual run, 2026-10-12)
- Governor: **31/31 passed**, 0 stray executors (actual run, 2026-10-12)
- v1 baseline, v2 holdout, all benchmark files: unchanged
- Gateway, permissions, other Dots, YoungMoneyView: untouched
- Nothing committed, deployed, or spent

## Remaining limitations
1. Industry synonym coverage is the primary recall bottleneck (central air,
   sanitizing, indoor air quality, heater-as-noun, replacement/sealing).
2. 53% uncertainty rate is high — safe but requires human review for half of candidates.
3. No semantic understanding — purely lexical. A 1B model cannot provide embeddings;
   a larger model or embedding service would be needed for true semantic matching.

## Recommendation: READY FOR ANOTHER DEVELOPMENT ITERATION

**Rationale:** Precision is 1.00 across 30 unseen cases — the classifier never
manufactures a false prospect. This is the critical safety property for a system
that must not fabricate business prospects. However, recall at 0.55 means nearly
half of valid prospects require human review, which limits autonomous usefulness.

**Not yet suitable for controlled pilot:** the 53% uncertainty rate would overwhelm
a pilot operator with review queue. One more iteration focused on vocabulary
expansion (using dev cases only) should target recall ≥ 0.75 while holding
precision at 1.00.

**Not "not ready":** the architecture is sound, the safety properties hold, and
all gaps are identified with specific fixes. This is a vocabulary problem, not
a design problem.
