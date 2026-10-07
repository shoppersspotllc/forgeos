import { NextRequest, NextResponse } from 'next/server';

/**
 * GitHub Repository Analyzer
 * Paste URL → fetch repo metadata → analyze → integration readiness.
 * Uses public GitHub API (no auth needed for public repos).
 */

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.trim().match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Repository URL required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL. Expected: https://github.com/owner/repo' }, { status: 400 });
    }

    const { owner, repo } = parsed;
    const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ForgeOS-Analyzer/2.0',
    };

    // Fetch repo metadata
    const repoRes = await fetch(apiBase, { headers, signal: AbortSignal.timeout(15000) });
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return NextResponse.json({ error: 'Repository not found or private' }, { status: 404 });
      }
      return NextResponse.json({ error: `GitHub API error: ${repoRes.status}` }, { status: 502 });
    }
    const repoData = await repoRes.json();

    // Fetch languages
    const langRes = await fetch(`${apiBase}/languages`, { headers, signal: AbortSignal.timeout(10000) });
    const languages = langRes.ok ? await langRes.json() : {};

    // Fetch root contents to detect project type
    const contentsRes = await fetch(`${apiBase}/contents`, { headers, signal: AbortSignal.timeout(10000) });
    const contents = contentsRes.ok ? await contentsRes.json() : [];
    const files: string[] = Array.isArray(contents) ? contents.map((f: any) => f.name) : [];

    // Analyze
    const analysis = analyzeRepo(repoData, languages, files);

    return NextResponse.json({
      repository: {
        fullName: repoData.full_name,
        description: repoData.description,
        url: repoData.html_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        defaultBranch: repoData.default_branch,
        updatedAt: repoData.updated_at,
        license: repoData.license?.spdx_id || 'None',
        topics: repoData.topics || [],
      },
      languages,
      analysis,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Analysis failed' }, { status: 500 });
  }
}

function analyzeRepo(repo: any, languages: Record<string, number>, files: string[]) {
  const langList = Object.keys(languages);
  const primaryLang = langList[0] || 'Unknown';

  // Detect project type
  let projectType = 'Unknown';
  let packageManager = '';
  const capabilities: string[] = [];
  const requirements: string[] = [];
  const risks: string[] = [];

  if (files.includes('package.json')) {
    projectType = 'Node.js';
    packageManager = 'npm';
    capabilities.push('JavaScript/TypeScript runtime');
    if (files.includes('next.config.js') || files.includes('next.config.ts')) {
      capabilities.push('Next.js framework detected');
    }
  } else if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.includes('setup.py')) {
    projectType = 'Python';
    packageManager = 'pip';
    capabilities.push('Python runtime');
  } else if (files.includes('Cargo.toml')) {
    projectType = 'Rust';
    packageManager = 'cargo';
    capabilities.push('Rust toolchain');
  } else if (files.includes('go.mod')) {
    projectType = 'Go';
    packageManager = 'go modules';
    capabilities.push('Go toolchain');
  } else if (files.includes('Dockerfile')) {
    capabilities.push('Docker containerized');
  }

  if (files.includes('docker-compose.yml') || files.includes('docker-compose.yaml')) {
    capabilities.push('Docker Compose orchestration');
  }
  if (files.includes('.github')) {
    capabilities.push('GitHub Actions CI');
  }
  if (files.includes('README.md')) {
    capabilities.push('Documented (README present)');
  } else {
    risks.push('No README — documentation unclear');
  }

  // Requirements
  if (packageManager) requirements.push(`Install via ${packageManager}`);
  if (primaryLang !== 'Unknown') requirements.push(`${primaryLang} toolchain`);

  // Risks
  if (repo.open_issues_count > 50) risks.push(`${repo.open_issues_count} open issues — may need triage`);
  if (!repo.license || repo.license === 'NOASSERTION') risks.push('No clear license — verify usage rights');
  const lastUpdate = new Date(repo.updated_at);
  const monthsAgo = (Date.now() - lastUpdate.getTime()) / (30 * 24 * 3600 * 1000);
  if (monthsAgo > 12) risks.push(`Last updated ${Math.round(monthsAgo)} months ago — may be stale`);

  // Integration readiness score
  let score = 50;
  if (files.includes('README.md')) score += 10;
  if (files.includes('Dockerfile')) score += 10;
  if (capabilities.includes('GitHub Actions CI')) score += 10;
  if (repo.license && repo.license !== 'NOASSERTION') score += 10;
  if (monthsAgo < 6) score += 10;
  score = Math.min(score, 100);

  let readiness: string;
  if (score >= 80) readiness = 'READY';
  else if (score >= 60) readiness = 'NEEDS_REVIEW';
  else readiness = 'HIGH_RISK';

  return {
    projectType,
    primaryLanguage: primaryLang,
    packageManager,
    capabilities,
    requirements,
    risks,
    integrationScore: score,
    integrationReadiness: readiness,
    suggestedRole: suggestRole(capabilities, primaryLang),
  };
}

function suggestRole(capabilities: string[], lang: string): string {
  if (capabilities.includes('Next.js framework detected')) return 'Dashboard / Frontend module';
  if (capabilities.includes('Docker Compose orchestration')) return 'Microservice / Infrastructure';
  if (lang === 'Python') return 'AI/ML worker or data pipeline';
  if (lang === 'Rust' || lang === 'Go') return 'High-performance service';
  if (lang === 'TypeScript' || lang === 'JavaScript') return 'ForgeOS module / Tool';
  return 'Utility / Library';
}
