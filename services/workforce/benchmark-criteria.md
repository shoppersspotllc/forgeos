# Prospect Benchmark — Labeling Criteria

**Version:** 1.0 | **Date:** 2026-10-12 | **Purpose:** Independent holdout validation of the Hunter quality gate.

This benchmark does NOT reuse the 15 labeled cases in `quality-regression.json`.
It tests generalization to unseen evidence.

## Label definitions

A prospect is evaluated against a target profile (e.g., "small HVAC companies in Texas").
The label is assigned from the EVIDENCE (title + URL + snippet), not from external knowledge.

### SUPPORTED
All of the following hold:
1. **Industry fit:** evidence contains HVAC-domain terms (hvac, heating, cooling, air conditioning, furnace, etc.) describing a *service* — not a product, retailer, or informational page.
2. **Geography fit:** evidence contains the target geography (Texas or a Texas city).
3. **Business identity:** evidence indicates a service business (repair, install, contractor, company providing services).
4. **Traceability:** the prospect URL appears in the search evidence.

### UNCERTAIN
Any of the following hold (and none of the FAILED conditions):
1. Industry terms present but business identity is unclear (could be service or informational).
2. Geography implied but not explicit (e.g., area code without city name).
3. Evidence is thin — single source, minimal snippet.
4. Conflicting signals (e.g., HVAC terms + product terms in same snippet).

**Rule:** Where industry or geography cannot be established from evidence, the expected outcome MUST be UNCERTAIN — never SUPPORTED.

### FAILED
Any of the following hold:
1. **Industry mismatch:** no HVAC-domain service terms in evidence.
2. **Product/retailer identity:** evidence shows a product for sale, not a service business.
3. **Informational identity:** evidence is a dictionary, encyclopedia, guide, or tutorial.
4. **Geography mismatch:** evidence clearly places the business outside the target geography.
5. **Untraceable:** prospect URL does not appear in any evidence source.

## Scoring

The quality gate predicts SUPPORTED / UNCERTAIN / FAILED per prospect.
- **Correct:** prediction matches label exactly.
- **Acceptable:** prediction is UNCERTAIN when label is SUPPORTED or FAILED (conservative, not wrong).
- **Error:** prediction is SUPPORTED when label is FAILED or UNCERTAIN (false positive), or FAILED when label is SUPPORTED (false negative).

Precision = correct SUPPORTED / all predicted SUPPORTED
Recall = correct SUPPORTED / all labeled SUPPORTED
Uncertainty rate = predicted UNCERTAIN / total

## Anti-tuning rule

This dataset is a holdout. The implementation MUST NOT be modified based on
holdout failures before reporting. Report honest results, then decide whether
changes are warranted in a separate, explicitly approved step.
