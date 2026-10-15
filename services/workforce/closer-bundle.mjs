// ForgeOS Workforce — Closer Skill Bundle
// Research-backed proposal: context → research → draft → flag claims → document.
//
// Tools: web-search (per DOT_TOOL_PERMISSIONS — enforced)
// Draft only. Never sends proposals or contacts anyone.

import { DotAgent } from './dot-agent.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function webSearch(query, limit = 5) {
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

export class CloserBundle {
  constructor(opts = {}) {
    this.agent = new DotAgent({
      id: 'closer',
      name: 'Closer',
      role: 'Proposal specialist — drafts research-backed business proposals',
    });
    this.tasksDir = opts.tasksDir || join(process.cwd(), 'closer-tasks');
    if (!existsSync(this.tasksDir)) mkdirSync(this.tasksDir, { recursive: true });
  }

  newTaskId() {
    return `closer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  saveTask(task) {
    const path = join(this.tasksDir, `${task.id}.json`);
    writeFileSync(path, JSON.stringify(task, null, 2));
    return path;
  }

  async propose(businessContext, offerSummary) {
    const taskId = this.newTaskId();
    const task = {
      id: taskId, dotId: 'closer', businessContext, offerSummary,
      status: 'started', startedAt: new Date().toISOString(),
      steps: [], evidence: [], proposal: null,
      verification: 'UNVERIFIED',
    };
    const log = (step, detail) => task.steps.push({ step, detail, at: new Date().toISOString() });

    try {
      // Step 1: Research the business context
      log('research', 'Gathering context via web search');
      const results = await webSearch(businessContext, 8);
      task.evidence.push({ type: 'web-search', query: businessContext, results, at: new Date().toISOString() });
      log('search', `${results.length} sources found`);

      // Step 2: AI drafts the proposal
      log('draft', 'Requesting proposal draft from ForgeOS AI');
      const evidenceSummary = results.map(r => `- ${r.title} (${r.url}): ${r.snippet}`).join('\n');
      const draftResult = await this.agent.think(
        `Draft a business proposal.\n\nContext: "${businessContext}"\nOffer: "${offerSummary}"\n\n` +
        `Research:\n${evidenceSummary.slice(0, 4000)}\n\n` +
        `Include: (1) tailored opening referencing the research, (2) the offer with deliverables, ` +
        `(3) assumptions, (4) proposed next step. Mark any claim NOT supported by the research above with [UNVERIFIED]. ` +
        `Do not invent client details, revenue figures, or testimonials.`,
        { capability: 'chat', model: 'llama3.2:1b' }
      );
      if (!draftResult.success) throw new Error(`AI drafting failed: ${draftResult.error}`);
      task.steps.push({ step: 'ai_draft', provider: draftResult.provider, latencyMs: draftResult.latencyMs });

      // Step 3: Save proposal as inspectable document
      const docPath = join(this.tasksDir, `${taskId}-proposal.md`);
      const doc = `# Proposal Draft\n\n**Context:** ${businessContext}\n**Offer:** ${offerSummary}\n**Drafted:** ${new Date().toISOString()}\n**Status:** DRAFT — not sent\n\n---\n\n${draftResult.content}\n\n---\n\n## Sources\n${results.map(r => `- [${r.title}](${r.url})`).join('\n')}\n`;
      writeFileSync(docPath, doc);
      task.proposal = { path: docPath, bytes: doc.length };
      log('proposal_saved', `${docPath} (${doc.length} bytes)`);

      // Step 4: Check for unsupported claims
      const unverifiedCount = (draftResult.content.match(/\[UNVERIFIED\]/g) || []).length;
      task.claimsFlagged = unverifiedCount;
      log('claims', `${unverifiedCount} claims flagged [UNVERIFIED]`);

      task.verification = results.length >= 3 && doc.length > 500 ? 'VERIFIED' : 'PARTIAL';
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
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
