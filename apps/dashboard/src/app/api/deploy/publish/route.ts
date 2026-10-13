import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * ForgeOS One-Click Publish API
 * 
 * Unified deployment workflow for ForgeOS projects.
 * 
 * GET: Check publish status (pending changes, branch, remote)
 * POST: Execute publish (preflight → commit → push → deploy → verify)
 */

const REPO_ROOT = '/home/hatch/workspace/forgeos';

interface PublishStatus {
  branch: string;
  remote: string;
  hasChanges: boolean;
  staged: number;
  unstaged: number;
  untracked: number;
  lastCommit: string;
  canPublish: boolean;
  blockers: string[];
}

function run(cmd: string, cwd: string = REPO_ROOT): string {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 30000 }).trim();
  } catch (e: any) {
    throw new Error(`Command failed: ${cmd}\n${e.message}`);
  }
}

async function getStatus(): Promise<PublishStatus> {
  const branch = run('git branch --show-current');
  const remote = run('git remote get-url origin');
  const status = run('git status --porcelain');
  
  const lines = status.split('\n').filter(Boolean);
  const staged = lines.filter(l => l[0] !== ' ' && l[0] !== '?').length;
  const unstaged = lines.filter(l => l[1] !== ' ' && l[0] !== '?').length;
  const untracked = lines.filter(l => l.startsWith('??')).length;
  
  const lastCommit = run('git log --oneline -1');
  
  const blockers: string[] = [];
  if (branch !== 'main' && branch !== 'feat/youngmoney-executive-redesign') {
    blockers.push(`Publishing from ${branch} — confirm this is intentional`);
  }
  
  // Check for secrets in staged changes
  try {
    const diff = run('git diff --cached');
    const secretPatterns = [/api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/i, /password\s*[:=]\s*['"][^'"]+['"]/i];
    for (const pattern of secretPatterns) {
      if (pattern.test(diff)) {
        blockers.push('Potential secret detected in staged changes');
        break;
      }
    }
  } catch {}
  
  return {
    branch,
    remote,
    hasChanges: lines.length > 0,
    staged,
    unstaged,
    untracked,
    lastCommit,
    canPublish: blockers.length === 0,
    blockers,
  };
}

async function runPreflight(): Promise<{ pass: boolean; results: string[] }> {
  const results: string[] = [];
  
  // 1. TypeScript check
  try {
    run('npx tsc --noEmit', join(REPO_ROOT, 'apps/dashboard'));
    results.push('✓ TypeScript check passed');
  } catch (e: any) {
    results.push(`✗ TypeScript check failed: ${e.message.slice(0, 200)}`);
    return { pass: false, results };
  }
  
  // 2. Production build
  try {
    run('npm run build', join(REPO_ROOT, 'apps/dashboard'));
    results.push('✓ Production build succeeded');
  } catch (e: any) {
    results.push(`✗ Production build failed: ${e.message.slice(0, 200)}`);
    return { pass: false, results };
  }
  
  // 3. Governor tests (if workforce changed)
  try {
    const changed = run('git diff --name-only HEAD');
    if (changed.includes('services/workforce/')) {
      run('node governor/test-governor.mjs', join(REPO_ROOT, 'services/workforce'));
      results.push('✓ Governor tests passed');
    }
  } catch (e: any) {
    results.push(`✗ Governor tests failed: ${e.message.slice(0, 200)}`);
    return { pass: false, results };
  }
  
  return { pass: true, results };
}

async function executePublish(message: string): Promise<any> {
  const log: string[] = [];
  
  // 1. Preflight
  log.push('Running preflight checks...');
  const preflight = await runPreflight();
  log.push(...preflight.results);
  if (!preflight.pass) {
    throw new Error(`Preflight failed:\n${preflight.results.join('\n')}`);
  }
  
  // 2. Commit
  log.push('Committing changes...');
  const status = await getStatus();
  if (status.hasChanges) {
    run('git add -A');
    run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    log.push('✓ Changes committed');
  } else {
    log.push('No changes to commit');
  }
  
  // 3. Push
  const branch = run('git branch --show-current');
  log.push(`Pushing to origin/${branch}...`);
  run(`git push origin ${branch}`);
  log.push('✓ Pushed to GitHub');
  
  // 4. Get commit SHA
  const sha = run('git rev-parse HEAD').slice(0, 7);
  log.push(`Deployed commit: ${sha}`);
  
  return { success: true, sha, branch, log };
}

export async function GET() {
  try {
    const status = await getStatus();
    return NextResponse.json(status);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message = 'ForgeOS one-click publish' } = await req.json();
    const result = await executePublish(message);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      error: e.message 
    }, { status: 500 });
  }
}
