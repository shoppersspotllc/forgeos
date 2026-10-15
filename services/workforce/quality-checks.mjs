// ForgeOS Workforce — Deterministic Quality Checks
// Separates EXECUTION success (tools ran, AI responded, record persisted)
// from OUTPUT QUALITY (results relevant, claims supported, prospects match).
//
// All functions are pure and deterministic — no model calls, no network.
// They run on task records and evidence, before or after persistence.

/** Normalize a URL for dedup: lowercase host, strip tracking params. */
export function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    for (const p of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_|igshid)/i.test(p)) u.searchParams.delete(p);
    }
    return `${u.hostname.toLowerCase()}${u.pathname.replace(/\/$/, '')}${u.search}`.toLowerCase();
  } catch { return (url || '').trim().toLowerCase(); }
}

/** Deduplicate source results by normalized URL. Returns { unique, duplicatesRemoved }. */
export function dedupeSources(results) {
  const seen = new Set();
  const unique = [];
  let duplicatesRemoved = 0;
  for (const r of results || []) {
    const key = normalizeUrl(r.url);
    if (seen.has(key)) { duplicatesRemoved++; continue; }
    seen.add(key);
    unique.push(r);
  }
  return { unique, duplicatesRemoved };
}

/** Keyword-overlap relevance 0..1 between query and a result's title+snippet.
 *  Uses meaningful keywords only, expanded through the synonym map.
 *  A variant phrase (e.g., "ac repair") counts as its canonical term ("hvac"). */
export function relevanceScore(query, title, snippet) {
  const qWords = queryKeywords(query);
  if (!qWords.length) return 0;
  const hay = `${title || ''} ${snippet || ''}`.toLowerCase();
  let hits = 0;
  for (const w of qWords) { if (synonymMatch(hay, w)) hits++; }
  return hits / qWords.length;
}

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were', 'has', 'have', 'will', 'would', 'could', 'should', 'what', 'when', 'where', 'which', 'who', 'how', 'not', 'but', 'all', 'any', 'can', 'its', 'our', 'your']);

// Generic business words that carry no relevance signal (same list as industryKeywords)
const GENERIC_WORDS = new Set(['small', 'companies', 'company', 'business', 'businesses', 'looking', 'seeking', 'need', 'needs', 'help', 'services', 'service', 'local', 'best', 'top', 'new', 'free']);

/**
 * Domain synonym map: canonical term → variant phrases.
 * Variants match as the canonical term for relevance and qualification.
 * Kept small and auditable. Does NOT include generic words — "cooling mattress"
 * matches "cooling" lexically but the quality gate requires industry+evidence fit.
 */
export const SYNONYM_MAP = {
  // HVAC domain
  'hvac': ['hvac', 'heating', 'heater installation', 'heater repair', 'cooling', 'air conditioning', 'central air', 'ac repair', 'a/c repair', 'ac tune-up', 'a/c tune-up', 'tune-up', 'furnace', 'heat pump', 'ventilation', 'ductwork', 'duct cleaning', 'duct sanitizing', 'indoor air quality'],
  'texas': ['texas', 'dallas', 'houston', 'austin', 'san antonio', 'fort worth', 'el paso', 'arlington', 'plano', 'lubbock', 'corpus christi', 'midland', 'waco', 'amarillo', 'brownsville', 'killeen', 'mcallen', 'tx'],
  // Common service domains (extensible)
  'plumbing': ['plumbing', 'plumber', 'pipe repair', 'drain cleaning', 'water heater'],
  'electrical': ['electrical', 'electrician', 'wiring', 'panel upgrade'],
  'roofing': ['roofing', 'roofer', 'roof repair', 'shingle'],
};

/** Expand a keyword to its canonical form + variants. Returns Set of matchable phrases. */
export function expandSynonyms(keyword) {
  const lower = (keyword || '').toLowerCase();
  for (const [canonical, variants] of Object.entries(SYNONYM_MAP)) {
    if (canonical === lower || variants.includes(lower)) {
      return new Set([canonical, ...variants]);
    }
  }
  return new Set([lower]);
}

/** Check if haystack contains keyword or any of its synonyms. Returns matched phrase or null. */
export function synonymMatch(haystack, keyword) {
  const hay = (haystack || '').toLowerCase();
  // Exclusion guard: "water heater" is plumbing, not HVAC — suppress
  // heater-compound matches when water heater is present
  const hasWaterHeater = hay.includes('water heater');
  for (const phrase of expandSynonyms(keyword)) {
    if (hasWaterHeater && phrase.includes('heater') && !phrase.includes('water')) continue;
    if (hay.includes(phrase)) return phrase;
  }
  return null;
}

/**
 * Business identity signals — distinguishes service businesses from
 * products, retailers, and informational pages. Deterministic, auditable.
 * These are SEPARATE from industry keywords: a "cooling mattress" matches
 * the HVAC synonym "cooling" but is a PRODUCT, not a service business.
 */
export const BUSINESS_SIGNALS = {
  service: ['repair', 'service', 'install', 'installation', 'contractor', 'technician', 'maintenance', 'tune-up', 'cleaning', 'testing', 'emergency', 'pros', 'experts', 'company', 'services'],
  product: ['mattress', 'buy now', 'shop', 'store', 'price', 'sale', 'amazon', 'walmart', 'retailer', 'product', 'sold in', 'free shipping', 'add to cart'],
  informational: ['wikipedia', 'dictionary', 'definition', 'meaning', 'guide', 'tutorial', 'how to', 'thesaurus', 'vocabulary', 'checklist', 'blog'],
  career: ['salary', 'career', 'job opening', 'hiring', 'now hiring', 'training program', 'certification course', 'license exam', 'how to become', 'technician salary', 'pay scale'],
};

/** Classify business identity from title+snippet. Returns { type, signals }.
 *  Types: service | product | informational | career | unknown
 *  Career content (salary guides, training, licensing) is informational — never a prospect. */
export function classifyBusinessIdentity(title, snippet, url) {
  const hay = `${title || ''} ${snippet || ''} ${url || ''}`.toLowerCase();
  const found = { service: [], product: [], informational: [], career: [] };
  for (const [type, phrases] of Object.entries(BUSINESS_SIGNALS)) {
    for (const p of phrases) {
      if (hay.includes(p)) found[type].push(p);
    }
  }
  // Informational domains are decisive
  if (/wikipedia\.org|merriam-webster\.com|dictionary\.cambridge|vocabulary\.com/i.test(url || '')) {
    return { type: 'informational', signals: found };
  }
  // Title-level informational signals are decisive — a page titled "X Guide" or
  // "How to..." is instructional content, not a service business
  const titleLower = (title || '').toLowerCase();
  if (/\b(guide|how to|tutorial|definition|meaning|checklist|blog)\b/.test(titleLower)) {
    return { type: 'informational', signals: found };
  }
  // Career content is decisive — a salary guide is not a service business,
  // even if it mentions "technician" or "repair"
  if (found.career.length > 0) {
    return { type: 'career', signals: found };
  }
  // Conflicting service + product signals = ambiguous, not automatically service
  if (found.product.length > 0 && found.service.length > 0) {
    return { type: 'mixed', signals: found };
  }
  // Product signals without service signals = product
  if (found.product.length > 0) {
    return { type: 'product', signals: found };
  }
  // Service signals present = service business
  if (found.service.length > 0) {
    return { type: 'service', signals: found };
  }
  return { type: 'unknown', signals: found };
}

/** Extract meaningful (non-generic, non-stopword) keywords from a query. */
export function queryKeywords(query) {
  return [...new Set(
    (query || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w) && !GENERIC_WORDS.has(w))
  )];
}

/** Extract industry/topic keywords from a prospect profile string.
 *  Excludes generic business words AND geographic terms (those belong to geoKeywords). */
export function industryKeywords(profile) {
  const words = (profile || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));
  // Drop generic business words, keep domain terms
  const generic = new Set(['small', 'companies', 'company', 'business', 'businesses', 'looking', 'seeking', 'need', 'needs', 'help', 'services', 'service', 'local']);
  const geo = new Set(geoKeywords(profile));
  // Also exclude geo variants (city names from synonym map)
  const geoVariants = new Set();
  for (const v of SYNONYM_MAP.texas || []) geoVariants.add(v);
  return [...new Set(words.filter(w => !generic.has(w) && !geo.has(w) && !geoVariants.has(w)))];
}

/**
 * Check whether a ranked prospect matches the requested industry (synonym-aware).
 * Returns { match: boolean, matchedPhrases: string[], reason: string }.
 */
export function prospectMatchesIndustry(prospect, keywords) {
  const hay = `${prospect.title || ''} ${prospect.url || ''} ${prospect.snippet || ''}`.toLowerCase();
  const matched = [];
  for (const k of keywords) {
    const phrase = synonymMatch(hay, k);
    if (phrase) matched.push(`${k}→${phrase}`);
  }
  const urlHost = (() => { try { return new URL(prospect.url).hostname.toLowerCase(); } catch { return ''; } })();
  const urlMatch = keywords.some(k => synonymMatch(urlHost, k));
  const match = matched.length > 0 || urlMatch;
  return {
    match,
    matchedPhrases: matched,
    reason: match
      ? `matched: ${matched.join(', ')}${urlMatch ? ' (URL signal)' : ''}`
      : `no industry keywords [${keywords.join(', ')}] or synonyms in title/URL/snippet`,
  };
}

/** Detect stale year references (older than last year) in text. Returns array of years found. */
export function detectStaleDates(text) {
  const currentYear = new Date().getFullYear();
  const years = [...new Set([...(text || '').matchAll(/\b(19|20)\d{2}\b/g)].map(m => parseInt(m[0], 10)))];
  return years.filter(y => y < currentYear - 1);
}

/** Extract all dates (years and full dates) from text with context. */
export function extractDates(text) {
  const dates = [];
  for (const m of (text || '').matchAll(/\b(19|20)\d{2}\b/g)) {
    dates.push({ value: m[0], type: 'year', index: m.index });
  }
  // Full dates like "Mon, 12 Oct 2026" or "October 12, 2026"
  for (const m of (text || '').matchAll(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi)) {
    dates.push({ value: m[0], type: 'pubdate', index: m.index });
  }
  return dates;
}

/**
 * Check whether dates in model output are supported by evidence.
 * Returns { supported: string[], unsupported: string[], details }.
 * A model-generated date is supported if it appears in any evidence snippet/title/pubDate.
 */
export function datesSupportedByEvidence(modelText, evidence) {
  const modelDates = extractDates(modelText).map(d => d.value);
  const evidenceText = (evidence || []).map(e =>
    `${e.query || ''} ${(e.results || []).map(r => `${r.title} ${r.snippet} ${r.pubDate || ''}`).join(' ')}`
  ).join(' ').toLowerCase();

  const supported = [], unsupported = [];
  for (const d of [...new Set(modelDates)]) {
    if (evidenceText.includes(d.toLowerCase())) supported.push(d);
    else unsupported.push(d);
  }
  return { supported, unsupported, details: `${supported.length} supported, ${unsupported.length} unsupported` };
}

/** Extract geographic keywords from a profile (states, cities, regions). */
export function geoKeywords(profile) {
  // US states + common geo terms — extend as needed
  const states = ['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','hampshire','jersey','mexico','york','carolina','dakota','ohio','oklahoma','oregon','pennsylvania','rhode','tennessee','texas','utah','vermont','virginia','washington','wisconsin','wyoming','dc'];
  const words = (profile || '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/);
  return [...new Set(words.filter(w => states.includes(w)))];
}

/**
 * Assess a single prospect's fit with supporting evidence.
 * Three-way qualification using business identity + service context + evidence:
 * - SUPPORTED: evidence confirms industry+geo fit AND business identity is service-like
 * - UNCERTAIN: plausible but evidence insufficient or ambiguous — never forced
 * - FAILED: clear industry mismatch, product/retailer/informational identity, or untraceable
 * A prospect without adequate evidence is NEVER marked SUPPORTED on keywords alone.
 */
export function assessProspectFit(prospect, industryKws, geoKws, evidenceSources) {
  // Find the evidence source for this prospect
  const normUrl = normalizeUrl(prospect.url);
  const source = (evidenceSources || []).find(s => normalizeUrl(s.url) === normUrl);

  const hay = `${prospect.title || ''} ${prospect.url || ''} ${prospect.snippet || ''} ${source ? `${source.title} ${source.snippet}` : ''}`.toLowerCase();

  const industryMatched = [];
  for (const k of industryKws) {
    const phrase = synonymMatch(hay, k);
    if (phrase) industryMatched.push(`${k}→${phrase}`);
  }
  const geoMatched = [];
  for (const k of geoKws) {
    const phrase = synonymMatch(hay, k);
    if (phrase) geoMatched.push(`${k}→${phrase}`);
  }

  const identity = classifyBusinessIdentity(prospect.title, prospect.snippet, prospect.url);

  const industry = {
    match: industryMatched.length > 0,
    matched: industryMatched,
    supportingSource: industryMatched.length && source ? source.url : null,
  };
  const geo = {
    match: geoKws.length === 0 || geoMatched.length > 0, // no geo requirement = auto-pass
    matched: geoMatched,
    supportingSource: geoMatched.length && source ? source.url : null,
  };

  let status, reason;
  if (!source) {
    status = 'FAILED'; reason = 'not traceable to evidence';
  } else if (identity.type === 'product') {
    status = 'FAILED'; reason = `product/retailer identity [${identity.signals.product.join(',')}] — not a service business`;
  } else if (identity.type === 'informational' || identity.type === 'career') {
    status = 'FAILED'; reason = `${identity.type} content — not a prospect business`;
  } else if (identity.type === 'mixed') {
    // Conflicting service + retail signals: do not let service keywords override.
    // UNCERTAIN — needs human review, not automatic qualification.
    status = 'UNCERTAIN'; reason = `conflicting signals (service:[${identity.signals.service.join(',')}] vs product:[${identity.signals.product.join(',')}]) — ambiguous`;
  } else if (industry.match && geo.match && identity.type === 'service') {
    status = 'SUPPORTED'; reason = `service business, industry [${industry.matched.join(',')}], geo [${geo.matched.join(',')}]`;
  } else if (industry.match && geo.match) {
    status = 'UNCERTAIN'; reason = 'industry+geo match but business identity unclear — needs human review';
  } else if (industry.match || geo.match) {
    status = 'UNCERTAIN'; reason = `partial match (industry:${industry.match}, geo:${geo.match}) — ambiguous`;
  } else {
    status = 'FAILED'; reason = 'no industry or geo match in evidence';
  }

  return { industry, geo, identity: identity.type, status, reason, traceable: !!source };
}

/** Count [UNVERIFIED] claim flags in text. */
export function countUnverifiedClaims(text) {
  return ((text || '').match(/\[UNVERIFIED\]/g) || []).length;
}

/**
 * Full Hunter quality assessment against a completed task record.
 * Returns { verdict: 'VERIFIED'|'PARTIAL'|'UNVERIFIED', reasons: string[], stats, prospects: [...] }.
 *
 * Each prospect gets: SUPPORTED (industry+geo match with evidence), UNCERTAIN (partial),
 * FAILED (no match or untraceable). Overall verdict derived from prospect statuses:
 * VERIFIED requires: execution completed AND every prospect SUPPORTED AND adequate evidence.
 * PARTIAL: execution ok but some prospects UNCERTAIN/FAILED.
 * UNVERIFIED: execution failed, or no prospects SUPPORTED.
 */
export function assessHunterQuality(task) {
  const reasons = [];
  const stats = { prospectsChecked: 0, supported: 0, uncertain: 0, failed: 0, evidenceSources: 0 };
  const prospectResults = [];

  if (task.status !== 'completed') {
    return { verdict: 'UNVERIFIED', reasons: [`task status is ${task.status}, not completed`], stats, prospects: [] };
  }

  // Collect all evidence sources
  const allSources = [];
  for (const e of task.evidence || []) {
    stats.evidenceSources += (e.results || []).length;
    for (const r of e.results || []) allSources.push(r);
  }

  const rankingText = typeof task.prospects === 'string' ? task.prospects : JSON.stringify(task.prospects || '');
  const urlRe = new RegExp('https?://[^\\s)>\\]]+', 'g');
  const prospectUrls = [...new Set([...rankingText.matchAll(urlRe)].map(m => m[0].replace(/[.,;:!?]+$/, '')))];
  const mdLinks = [...rankingText.matchAll(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1]);
  const allProspectUrls = [...new Set([...prospectUrls, ...mdLinks])];

  const industryKws = industryKeywords(task.prospectProfile || '');
  const geoKws = geoKeywords(task.prospectProfile || '');
  reasons.push(`industry keywords: [${industryKws.join(', ')}]; geo keywords: [${geoKws.join(', ')}]`);

  if (!allProspectUrls.length) {
    return { verdict: 'UNVERIFIED', reasons: [...reasons, 'no prospect URLs in ranking — cannot verify'], stats, prospects: [] };
  }

  for (const url of allProspectUrls) {
    stats.prospectsChecked++;
    // Find prospect details from ranking text context or evidence
    const normUrl = normalizeUrl(url);
    const ev = allSources.find(s => normalizeUrl(s.url) === normUrl);
    const prospect = ev
      ? { title: ev.title, url, snippet: ev.snippet }
      : { title: '(not in evidence)', url, snippet: '' };

    const fit = assessProspectFit(prospect, industryKws, geoKws, allSources);
    // Preserve all candidates with their qualification reason — even filtered ones stay in evidence
    prospectResults.push({ url, title: prospect.title, ...fit });

    if (fit.status === 'SUPPORTED') stats.supported++;
    else if (fit.status === 'UNCERTAIN') { stats.uncertain++; reasons.push(`UNCERTAIN: ${url} — ${fit.reason}`); }
    else { stats.failed++; reasons.push(`FAILED: ${url} — ${fit.reason}`); }
  }

  reasons.push(`prospects: ${stats.supported} supported, ${stats.uncertain} uncertain, ${stats.failed} failed`);

  // Execution status (task.status) is SEPARATE from quality verdict.
  // VERIFIED requires every prospect SUPPORTED — never granted on execution alone.
  let verdict;
  if (stats.failed === 0 && stats.uncertain === 0 && stats.supported > 0 && stats.evidenceSources >= 3) verdict = 'VERIFIED';
  else if (stats.supported > 0) verdict = 'PARTIAL';
  else verdict = 'UNVERIFIED';

  return { verdict, reasons, stats, prospects: prospectResults };
}
