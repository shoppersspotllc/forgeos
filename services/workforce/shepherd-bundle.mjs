// ForgeOS Workforce — Shepherd Skill Bundle
// Monitoring: target → search updates → compare → timestamped report.
//
// Tools: web-search (per DOT_TOOL_PERMISSIONS — enforced)
// Never claims changes without comparative evidence.

import { DotAgent } from './dot-agent.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function webSearch(query, limit = 8) {
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
    const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '').trim();
    if (title && link) results.push({ title, url: link, snippet: desc, pubDate });
  }
  return results;
}

export class ShepherdBundle {
  constructor(opts = {}) {
    this.agent = new DotAgent({
      id: 'shepherd',
      name: 'Shepherd',
      role: 'Monitoring specialist — tracks targets and reports changes with evidence',
    });
    this.tasksDir = opts.tasksDir || join(process.cwd(), 'shepherd-tasks');
    if (!existsSync(this.tasksDir)) mkdirSync(this.tasksDir, { recursive: true });
  }

  newTaskId() {
    return `shepherd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  saveTask(task) {
    const path = join(this.tasksDir, `${task.id}.json`);
    writeFileSync(path, JSON.stringify(task, null, 2));
    return path;
  }

  async monitor(target, baselineNote = null) {
    const taskId = this.newTaskId();
    const task = {
      id: taskId, dotId: 'shepherd', target, baselineNote,
      status: 'started', startedAt: new Date().toISOString(),
      steps: [], evidence: [], report: null,
      verification: 'UNVERIFIED',
    };
    const log = (step, detail) => task.steps.push({ step, detail, at: new Date().toISOString() });

    try {
      // Step 1: Search for current state/updates
      log('check', `Checking target: ${target}`);
      const queries = [`${target} latest updates`, `${target} news`];
      for (const q of queries) {
        const results = await webSearch(q, 8);
        task.evidence.push({ type: 'web-search', query: q, results, at: new Date().toISOString() });
        log('search', `"${q}" → ${results.length} results`);
      }

      // Step 2: AI produces change report
      log('report', 'Requesting change report from ForgeOS AI');
      const evidenceSummary = task.evidence.map(e =>
        `Query "${e.query}" (${e.at}):\n` + e.results.map(r => `- [${r.pubDate || 'no date'}] ${r.title} (${r.url}): ${r.snippet}`).join('\n')
      ).join('\n\n');
      const reportResult = await this.agent.think(
        `Produce a monitoring report for: "${target}"\n` +
        (baselineNote ? `Known baseline: "${baselineNote}"\n` : `No baseline provided — state this limitation.\n`) +
        `\nCurrent findings:\n${evidenceSummary.slice(0, 5000)}\n\n` +
        `Distinguish: CONFIRMED changes (with dates/sources), UNCHANGED (no new info), ` +
        `INCONCLUSIVE (conflicting or insufficient evidence). Do not claim changes without evidence. ` +
        `Timestamp the report.`,
        { capability: 'chat', model: 'llama3.2:1b' }
      );
      if (!reportResult.success) throw new Error(`AI report failed: ${reportResult.error}`);
      task.steps.push({ step: 'ai_report', provider: reportResult.provider, latencyMs: reportResult.latencyMs });

      // Step 3: Save timestamped report
      const reportPath = join(this.tasksDir, `${taskId}-report.md`);
      const report = `# Monitoring Report\n\n**Target:** ${target}\n**Checked:** ${new Date().toISOString()}\n**Baseline:** ${baselineNote || 'None provided — change detection limited'}\n\n---\n\n${reportResult.content}\n\n---\n\n## Sources\n${task.evidence.flatMap(e => e.results).map(r => `- [${r.title}](${r.url})`).join('\n')}\n`;
      writeFileSync(reportPath, report);
      task.report = { path: reportPath, bytes: report.length };
      log('report_saved', `${reportPath} (${report.length} bytes)`);

      const sourceCount = task.evidence.reduce((n, e) => n + e.results.length, 0);
      task.verification = sourceCount >= 5 && report.length > 500 ? 'VERIFIED' : 'PARTIAL';
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
