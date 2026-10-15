// ForgeOS Workforce — Hunter Skill Bundle
// Prospect discovery: profile → web + reddit search → ranked prospects → evidence record.
//
// Tools: web-search, reddit (per DOT_TOOL_PERMISSIONS — enforced)
// NEVER contacts prospects. Research only.

import { DotAgent } from './dot-agent.mjs';
import { assessHunterQuality, dedupeSources, relevanceScore } from './quality-checks.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Minimum relevance to keep a result. Low threshold (0.15) removes only clearly
// irrelevant results (e.g., dictionary definitions for "small") while preserving
// relevant-but-imperfectly-worded results. Filtering is logged for auditability.
const RELEVANCE_THRESHOLD = 0.15;

async function webSearch(query, limit = 10) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss&count=20`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/rss+xml, text/xml',
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const xml = await res.text();
  const results = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) && results.length < limit) {
    const item = m[1];
    const title = (item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').replace(/<[^>]+>/g, '').trim();
    const link = (item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
    const desc = (item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '').replace(/<[^>]+>/g, '').trim().slice(0, 300);
    if (title && link) results.push({ title, url: link, snippet: desc });
  }
  return results;
}

async function redditSearch(query, limit = 10) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 25)}&sort=relevance`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0 (research bot)' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Reddit: ${res.status}`);
  const d = await res.json();
  return ((d.data && d.data.children) || []).slice(0, limit).map(c => ({
    title: c.data.title,
    subreddit: c.data.subreddit,
    score: c.data.score,
    url: `https://www.reddit.com${c.data.permalink}`,
    snippet: (c.data.selftext || '').slice(0, 300),
  }));
}

export class HunterBundle {
  constructor(opts = {}) {
    this.agent = new DotAgent({
      id: 'hunter',
      name: 'Hunter',
      role: 'Prospect discovery specialist — finds and ranks business opportunities from public sources',
    });
    this.tasksDir = opts.tasksDir || join(process.cwd(), 'hunter-tasks');
    if (!existsSync(this.tasksDir)) mkdirSync(this.tasksDir, { recursive: true });
  }

  newTaskId() {
    return `hunter_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  saveTask(task) {
    const path = join(this.tasksDir, `${task.id}.json`);
    writeFileSync(path, JSON.stringify(task, null, 2));
    return path;
  }

  async discover(prospectProfile, maxProspects = 5) {
    const taskId = this.newTaskId();
    const task = {
      id: taskId, dotId: 'hunter', prospectProfile,
      status: 'started', startedAt: new Date().toISOString(),
      steps: [], evidence: [], prospects: [],
      verification: 'UNVERIFIED',
    };
    const log = (step, detail) => task.steps.push({ step, detail, at: new Date().toISOString() });

    try {
      // Step 1: AI defines search criteria
      log('plan', 'Requesting prospect search criteria from ForgeOS AI');
      const planResult = await this.agent.think(
        `Define search criteria for this prospect profile: "${prospectProfile}". ` +
        `Respond with 2 web search queries (prefix "WEB: ") and 1 reddit query (prefix "REDDIT: "). ` +
        `Each on its own line. Be specific to the profile.`,
        { capability: 'chat', model: 'llama3.2:1b' }
      );
      if (!planResult.success) throw new Error(`AI planning failed: ${planResult.error}`);
      task.steps.push({ step: 'ai_plan', provider: planResult.provider, latencyMs: planResult.latencyMs });
      log('plan_complete', planResult.content.slice(0, 500));

      const webQueries = (planResult.content.match(/WEB:\s*(.+)/g) || []).map(q => q.replace(/^WEB:\s*/, '').trim()).slice(0, 2);
      const redditQueries = (planResult.content.match(/REDDIT:\s*(.+)/g) || []).map(q => q.replace(/^REDDIT:\s*/, '').trim()).slice(0, 1);
      if (!webQueries.length) webQueries.push(prospectProfile);

      // Step 2: Execute searches (with dedup + relevance pre-filter)
      const seenUrls = new Set();
      for (const q of webQueries) {
        const results = await webSearch(q, 8);
        const { unique, duplicatesRemoved } = dedupeSources(results.filter(r => {
          const key = r.url.toLowerCase().split('?')[0];
          if (seenUrls.has(key)) return false;
          seenUrls.add(key);
          return true;
        }));
        // Relevance pre-filter: drop clearly irrelevant results before AI ranking.
        // Threshold is intentionally low to preserve imperfectly-worded but relevant results.
        const filtered = [];
        const dropped = [];
        for (const r of unique) {
          const score = relevanceScore(q, r.title, r.snippet);
          r.relevanceScore = Math.round(score * 100) / 100;
          if (score >= RELEVANCE_THRESHOLD) filtered.push(r);
          else dropped.push({ title: r.title, url: r.url, score: r.relevanceScore });
        }
        task.evidence.push({ type: 'web-search', query: q, results: filtered, at: new Date().toISOString() });
        log('search', `web "${q}" → ${filtered.length} kept, ${dropped.length} filtered (relevance < ${RELEVANCE_THRESHOLD}), ${duplicatesRemoved} dupes`);
        if (dropped.length) task.steps.push({ step: 'relevance_filter', query: q, dropped: dropped.slice(0, 5) });
      }
      for (const q of redditQueries) {
        try {
          const results = await redditSearch(q, 8);
          task.evidence.push({ type: 'reddit', query: q, results, at: new Date().toISOString() });
          log('search', `reddit "${q}" → ${results.length} results`);
        } catch (e) { log('search_error', `reddit failed: ${e.message}`); }
      }

      // Step 3: AI ranks prospects
      log('rank', 'Requesting prospect ranking from ForgeOS AI');
      const evidenceSummary = task.evidence.map(e =>
        `${e.type} "${e.query}":\n` + e.results.map(r => `- ${r.title} (${r.url})`).join('\n')
      ).join('\n\n');
      const rankResult = await this.agent.think(
        `Rank the top ${maxProspects} prospects for: "${prospectProfile}"\n\nEvidence:\n${evidenceSummary.slice(0, 5000)}\n\n` +
        `For each: name/title, URL, why it fits (cite evidence), confidence (high/medium/low). ` +
        `Separate verified facts from estimates. Do not invent prospects not in the evidence.`,
        { capability: 'chat', model: 'llama3.2:1b' }
      );
      if (!rankResult.success) throw new Error(`AI ranking failed: ${rankResult.error}`);
      task.prospects = rankResult.content;
      task.steps.push({ step: 'ai_rank', provider: rankResult.provider, latencyMs: rankResult.latencyMs });

      // Step 4: Quality gate — execution success ≠ output quality.
      // Every ranked prospect must match the requested industry and be traceable to evidence.
      const quality = assessHunterQuality(task);
      task.qualityAssessment = quality;
      task.verification = quality.verdict;
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      log('quality_gate', `${quality.verdict}: ${quality.reasons.join('; ').slice(0, 500)}`);
    } catch (e) {
      task.status = 'failed'; task.error = e.message;
      task.completedAt = new Date().toISOString();
      log('error', e.message);
    }

    const path = this.saveTask(task);
    task.recordPath = path;
    return task;
  }
}
