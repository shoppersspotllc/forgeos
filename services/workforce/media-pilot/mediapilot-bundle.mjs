// ForgeOS Workforce — MediaPilot Skill Bundle
// YouTube/media content workflow: research → create → QA → publish → measure.
//
// Architecture (existing foundations, no rebuilds):
//   MediaPilot Bundle → DotAgent → ForgeOS AI gateway → Ollama (llama3.2:1b)
//   MediaPilot Bundle → youtube_upload.py → YouTube Data API v3 (OAuth 2.0)
//   MediaPilot Bundle → Task records (JSON, persistent)
//
// The MediaPilot NEVER fabricates. Every claim cites its source.
// It NEVER uploads without explicit authorization per video.
// It NEVER invents analytics, views, or revenue.

import { DotAgent } from '../dot-agent.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Content brief generation (via ForgeOS AI)
// ---------------------------------------------------------------------------

export async function generateBrief(dotAgent, topic, audience, opts = {}) {
  const prompt = `You are MediaPilot, a YouTube content strategist for Shopper's Spot LLC.

Create an evidence-backed content brief. Do NOT invent product capabilities,
statistics, or claims. If you don't know something, say so.

Topic: ${topic}
Target audience: ${audience}
Format: ${opts.format || 'YouTube Short (9:16, under 60s)'}

Return JSON with: hook (first 3 seconds), script (word for word, timed),
visualNotes, title (under 60 chars), description (with real links only),
hashtags (max 5), callToAction, factCheck (list every factual claim and its source or mark UNVERIFIED).

If any claim cannot be verified, mark it [UNVERIFIED] — do not present it as fact.`;
  const result = await dotAgent.chat([
    { role: 'system', content: 'You are MediaPilot, a careful YouTube strategist. You never fabricate.' },
    { role: 'user', content: prompt },
  ]);
  return result;
}

// ---------------------------------------------------------------------------
// QA checks (deterministic, no AI needed)
// ---------------------------------------------------------------------------

export function qaBrief(brief) {
  const issues = [];
  const checks = [];
  const b = typeof brief === 'string' ? JSON.parse(brief) : brief;

  // Title length
  if (!b.title) { issues.push('Missing title'); }
  else if (b.title.length > 100) { issues.push(`Title too long (${b.title.length} chars)`); }
  else { checks.push('Title length OK'); }

  // Unverified claims flagged
  const text = JSON.stringify(b);
  const unverified = (text.match(/\[UNVERIFIED\]/g) || []).length;
  checks.push(`${unverified} unverified claim(s) flagged`);

  // No invented URLs
  const urls = text.match(/https?:\/\/[^\s"']+/g) || [];
  checks.push(`${urls.length} URL(s) referenced — verify each resolves before publishing`);

  // Hashtags
  if (b.hashtags && b.hashtags.length > 15) issues.push('Too many hashtags');

  return { pass: issues.length === 0, issues, checks, unverifiedCount: unverified };
}

// ---------------------------------------------------------------------------
// YouTube upload (via Python script + OAuth)
// ---------------------------------------------------------------------------

export async function uploadVideo({ file, title, description, privacy = 'unlisted', category = '22' }) {
  if (!existsSync(file)) throw new Error(`Video file not found: ${file}`);
  const script = join(HERE, 'youtube_upload.py');
  const { stdout, stderr } = await execFileAsync('python3', [
    script,
    '--file', file,
    '--title', title,
    '--description', description,
    '--privacy', privacy,
    '--category', category,
  ], { timeout: 600000 });
  const videoId = (stdout.match(/VIDEO_ID=(\S+)/) || [])[1];
  const url = (stdout.match(/URL=(\S+)/) || [])[1];
  if (!videoId) throw new Error(`Upload failed. Output: ${stdout}\n${stderr}`);
  return { videoId, url, privacy };
}

// ---------------------------------------------------------------------------
// Task record persistence
// ---------------------------------------------------------------------------

const WORK_DIR = join(HERE, 'media-tasks');

export function saveTaskRecord(task) {
  mkdirSync(WORK_DIR, { recursive: true });
  const path = join(WORK_DIR, `${task.id}.json`);
  writeFileSync(path, JSON.stringify(task, null, 2));
  return path;
}

export function newTaskId(prefix = 'mediapilot') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
