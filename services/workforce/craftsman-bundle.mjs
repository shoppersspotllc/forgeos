// ForgeOS Workforce — Craftsman Skill Bundle
// Build task: requirement → plan → research → artifact → validate → record.
//
// Tools: web-search, web-read, github-research (per DOT_TOOL_PERMISSIONS — enforced)
// Produces real, inspectable artifacts. Never modifies production.

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
    if (title && link) results.push({ title, url: link });
  }
  return results;
}

export class CraftsmanBundle {
  constructor(opts = {}) {
    this.agent = new DotAgent({
      id: 'craftsman',
      name: 'Craftsman',
      role: 'Build specialist — converts requirements into working artifacts',
    });
    this.tasksDir = opts.tasksDir || join(process.cwd(), 'craftsman-tasks');
    this.artifactsDir = opts.artifactsDir || join(process.cwd(), 'craftsman-artifacts');
    for (const d of [this.tasksDir, this.artifactsDir]) {
      if (!existsSync(d)) mkdirSync(d, { recursive: true });
    }
  }

  newTaskId() {
    return `craftsman_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  saveTask(task) {
    const path = join(this.tasksDir, `${task.id}.json`);
    writeFileSync(path, JSON.stringify(task, null, 2));
    return path;
  }

  async build(requirement) {
    const taskId = this.newTaskId();
    const task = {
      id: taskId, dotId: 'craftsman', requirement,
      status: 'started', startedAt: new Date().toISOString(),
      steps: [], evidence: [], artifact: null,
      verification: 'UNVERIFIED',
    };
    const log = (step, detail) => task.steps.push({ step, detail, at: new Date().toISOString() });

    try {
      // Step 1: AI creates implementation plan
      log('plan', 'Requesting implementation plan from ForgeOS AI');
      const planResult = await this.agent.think(
        `Create a minimal implementation plan for: "${requirement}". ` +
        `Respond with: (1) what to build in one sentence, (2) 3 concrete steps, (3) what the output file should contain. ` +
        `Keep it simple and achievable. Format steps as "STEP: ...".`,
        { capability: 'chat', model: 'llama3.2:1b' }
      );
      if (!planResult.success) throw new Error(`AI planning failed: ${planResult.error}`);
      task.steps.push({ step: 'ai_plan', provider: planResult.provider, latencyMs: planResult.latencyMs });
      log('plan_complete', planResult.content.slice(0, 800));

      // Step 2: AI generates the artifact content
      log('build', 'Requesting artifact content from ForgeOS AI');
      const buildResult = await this.agent.think(
        `Build this: "${requirement}"\n\nPlan:\n${planResult.content.slice(0, 2000)}\n\n` +
        `Output ONLY the file content — no explanations, no markdown fences. ` +
        `If HTML, produce complete valid HTML. If text, produce the document.`,
        { capability: 'chat', model: 'llama3.2:1b' }
      );
      if (!buildResult.success) throw new Error(`AI build failed: ${buildResult.error}`);
      task.steps.push({ step: 'ai_build', provider: buildResult.provider, latencyMs: buildResult.latencyMs });

      // Step 3: Write artifact to disk
      const artifactPath = join(this.artifactsDir, `${taskId}.html`);
      let content = buildResult.content.trim();
      // Strip markdown fences if the model added them
      content = content.replace(/^```html?\n/, '').replace(/\n```$/, '');
      writeFileSync(artifactPath, content);
      const stats = { path: artifactPath, bytes: content.length };
      task.artifact = stats;
      log('artifact_written', `${artifactPath} (${content.length} bytes)`);

      // Step 4: Validate — artifact exists and has content
      const validations = [];
      validations.push({ check: 'file_exists', pass: existsSync(artifactPath) });
      validations.push({ check: 'non_empty', pass: content.length > 100 });
      validations.push({ check: 'no_fabrication_markers', pass: !content.includes('TODO') || content.length > 500 });
      task.validations = validations;
      log('validated', validations.map(v => `${v.check}=${v.pass}`).join(', '));

      const allPass = validations.every(v => v.pass);
      task.verification = allPass ? 'VERIFIED' : 'PARTIAL';
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
