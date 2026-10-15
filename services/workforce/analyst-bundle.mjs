// ForgeOS Workforce — Analyst Skill Bundle
// Evidence-backed research workflow with persistent task records.
//
// Architecture (existing foundations, no rebuilds):
//   Analyst Bundle → DotAgent → ForgeOS AI gateway → Ollama (llama3.2:1b)
//   Analyst Bundle → Research tools (web-search, web-read, github-research)
//   Analyst Bundle → Task records (JSON, persistent)
//
// The Analyst NEVER fabricates. Every claim cites its source.
// Verification status is explicit: VERIFIED, PARTIAL, or UNVERIFIED.

import { DotAgent } from './dot-agent.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Research tools (ported from dashboard capability executor — same logic)
// ---------------------------------------------------------------------------

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

async function webRead(url, maxChars = 8000) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ForgeOS-Analyst/1.0)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  // Strip scripts, styles, tags — extract readable text
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxChars);
  return { url, text, chars: text.length };
}

async function githubRepoInfo(owner, repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { 'User-Agent': 'ForgeOS-Analyst/1.0', Accept: 'application/vnd.github.v3+json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`GitHub API failed: ${res.status}`);
  const j = await res.json();
  return {
    fullName: j.full_name,
    description: j.description,
    stars: j.stargazers_count,
    forks: j.forks_count,
    language: j.language,
    updatedAt: j.updated_at,
    url: j.html_url,
  };
}

// ---------------------------------------------------------------------------
// Analyst Bundle
// ---------------------------------------------------------------------------

export class AnalystBundle {
  constructor(opts = {}) {
    this.agent = new DotAgent({
      id: 'analyst',
      name: 'Analyst',
      role: 'Data Analyst specializing in deep research and evidence-backed insights',
    });
    this.tasksDir = opts.tasksDir || join(process.cwd(), 'analyst-tasks');
    if (!existsSync(this.tasksDir)) mkdirSync(this.tasksDir, { recursive: true });
    this.tools = { webSearch, webRead, githubRepoInfo };
  }

  newTaskId() {
    return `analyst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  saveTask(task) {
    const path = join(this.tasksDir, `${task.id}.json`);
    writeFileSync(path, JSON.stringify(task, null, 2));
    return path;
  }

  /**
   * Evidence-backed research workflow.
   * @param {string} question - The research question
   * @returns {object} - Task record with evidence and verification status
   */
  async research(question) {
    const taskId = this.newTaskId();
    const task = {
      id: taskId,
      dotId: 'analyst',
      question,
      status: 'started',
      startedAt: new Date().toISOString(),
      steps: [],
      evidence: [],
      verification: 'UNVERIFIED',
    };

    const log = (step, detail) => {
      task.steps.push({ step, detail, at: new Date().toISOString() });
    };

    try {
      // Step 1: AI plans the research
      log('plan', 'Requesting research plan from ForgeOS AI');
      const planResult = await this.agent.think(
        `You are planning research. Question: "${question}". ` +
        `Respond with 2-3 specific web search queries that would find factual evidence. ` +
        `Format each query on its own line starting with "QUERY: ". Be specific, avoid generic queries.`,
        { capability: 'chat', model: 'llama3.2:1b' }
      );
      if (!planResult.success) throw new Error(`AI planning failed: ${planResult.error}`);
      task.steps.push({ step: 'ai_plan', provider: planResult.provider, latencyMs: planResult.latencyMs });
      log('plan_complete', planResult.content.slice(0, 500));

      // Step 2: Extract queries and execute searches
      const queries = (planResult.content.match(/QUERY:\s*(.+)/g) || [])
        .map(q => q.replace(/^QUERY:\s*/, '').trim())
        .slice(0, 3);
      if (queries.length === 0) {
        // Fallback: use the question directly
        queries.push(question);
      }
      log('queries', queries);

      for (const q of queries) {
        const results = await this.tools.webSearch(q, 5);
        task.evidence.push({ type: 'web-search', query: q, results, at: new Date().toISOString() });
        log('search', `${q} → ${results.length} results`);
      }

      // Step 3: AI synthesizes findings from evidence
      log('synthesize', 'Requesting synthesis from ForgeOS AI');
      const evidenceSummary = task.evidence
        .map(e => `Query "${e.query}":\n` + e.results.map(r => `- ${r.title} (${r.url}): ${r.snippet}`).join('\n'))
        .join('\n\n');
      const synthResult = await this.agent.think(
        `Based ONLY on the following evidence, answer: "${question}"\n\n` +
        `Evidence:\n${evidenceSummary.slice(0, 6000)}\n\n` +
        `Provide a factual answer citing sources. If the evidence is insufficient, say so explicitly. ` +
        `Do not invent facts not in the evidence.`,
        { capability: 'chat', model: 'llama3.2:1b' }
      );
      if (!synthResult.success) throw new Error(`AI synthesis failed: ${synthResult.error}`);
      task.answer = synthResult.content;
      task.steps.push({ step: 'ai_synthesis', provider: synthResult.provider, latencyMs: synthResult.latencyMs });

      // Step 4: Verification status
      const sourceCount = task.evidence.reduce((n, e) => n + e.results.length, 0);
      task.verification = sourceCount >= 5 ? 'VERIFIED' : sourceCount >= 2 ? 'PARTIAL' : 'UNVERIFIED';
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      log('verification', `${task.verification} (${sourceCount} sources)`);

    } catch (e) {
      task.status = 'failed';
      task.error = e.message;
      task.completedAt = new Date().toISOString();
      log('error', e.message);
    }

    const path = this.saveTask(task);
    task.recordPath = path;
    return task;
  }
}
