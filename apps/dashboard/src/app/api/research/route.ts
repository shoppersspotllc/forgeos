/**
 * ForgeOS Research API — Shared Capability Layer
 * 
 * POST /api/research
 * 
 * Unified research endpoint implementing Agent Reach-inspired capabilities
 * natively in TypeScript for Vercel serverless.
 * 
 * Request:
 *   {
 *     capability: 'web-search' | 'web-read' | 'github-research' | 'youtube-transcript' | 'reddit' | 'rss',
 *     operation: string,
 *     params: Record<string, any>,
 *     dotName?: string  // for permission checking and audit
 *   }
 * 
 * All external content is treated as untrusted. Responses are sanitized.
 * No credentials are exposed. Rate limited per IP.
 */

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

// Rate limiter (per-instance)
const buckets = new Map<string, { count: number; resetAt: number }>();
function checkRate(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')?.trim()
    || 'unknown';
}

// --- Capability implementations ---

async function webSearch(query: string, limit: number = 10) {
  // Use DuckDuckGo HTML (no API key, free)
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ForgeOS-Research/1.0)' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const html = await res.text();
  
  const results: Array<{title: string; url: string; snippet: string}> = [];
  const linkRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gs;
  const snippetRe = /<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/s;
  
  let m;
  let count = 0;
  while ((m = linkRe.exec(html)) !== null && count < limit) {
    const rawUrl = m[1];
    // DuckDuckGo wraps URLs; extract actual
    const urlMatch = rawUrl.match(/[?&]uddg=([^&]+)/);
    const cleanUrl = urlMatch ? decodeURIComponent(urlMatch[1]) : rawUrl;
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    
    // Find snippet after this link
    const afterLink = html.substring(m.index, m.index + 2000);
    const sMatch = afterLink.match(/class="result__snippet"[^>]*>(.*?)<\/a>/s);
    const snippet = sMatch ? sMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 300) : '';
    
    if (title && cleanUrl.startsWith('http')) {
      results.push({ title: title.substring(0, 200), url: cleanUrl.substring(0, 500), snippet });
      count++;
    }
  }
  return results;
}

async function webRead(url: string, maxChars: number = 8000) {
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    throw new Error('URL must start with http(s)://');
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ForgeOS-Research/1.0)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 200) : '';
  
  // Remove scripts, styles, nav, etc.
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  
  // Extract main content if available
  const mainMatch = text.match(/<main[\s\S]*?<\/main>/i) || text.match(/<article[\s\S]*?<\/article>/i);
  if (mainMatch) text = mainMatch[0];
  
  // Strip tags, decode entities, normalize whitespace
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  
  return { title, text: text.substring(0, maxChars), url };
}

async function githubRepoInfo(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0', 'Accept': 'application/vnd.github.v3+json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const d = await res.json();
  return {
    name: d.full_name,
    description: d.description,
    stars: d.stargazers_count,
    forks: d.forks_count,
    language: d.language,
    license: d.license?.spdx_id || d.license?.name || 'none',
    updated: d.updated_at,
    url: d.html_url,
  };
}

async function githubReadme(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0', 'Accept': 'application/vnd.github.v3.raw' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const text = await res.text();
  return { readme: text.substring(0, 10000) };
}

async function githubIssues(owner: string, repo: string, limit: number = 10) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=${Math.min(limit, 20)}`,
    {
      headers: { 'User-Agent': 'ForgeOS-Research/1.0', 'Accept': 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const issues = await res.json();
  return issues.map((i: any) => ({
    number: i.number,
    title: i.title,
    state: i.state,
    created: i.created_at,
    url: i.html_url,
  }));
}

async function youtubeTranscript(videoId: string, maxChars: number = 10000) {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) throw new Error('Invalid YouTube video ID');
  // Use timedtext API via video page (no API key)
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    signal: AbortSignal.timeout(12000),
  });
  if (!pageRes.ok) throw new Error(`YouTube: ${pageRes.status}`);
  const page = await pageRes.text();
  
  const captionMatch = page.match(/"captionTracks":\[(.*?)\]/s);
  if (!captionMatch) throw new Error('No captions available for this video');
  
  const tracks = captionMatch[1];
  const urlMatch = tracks.match(/"baseUrl":"([^"]+)"/);
  if (!urlMatch) throw new Error('Could not extract caption URL');
  
  const captionUrl = urlMatch[1].replace(/\\u0026/g, '&');
  const capRes = await fetch(captionUrl, { signal: AbortSignal.timeout(12000) });
  if (!capRes.ok) throw new Error(`Caption fetch: ${capRes.status}`);
  const xml = await capRes.text();
  
  const textMatches = xml.matchAll(/<text[^>]*>(.*?)<\/text>/gs);
  let transcript = '';
  for (const tm of textMatches) {
    transcript += tm[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/\n/g, ' ') + ' ';
    if (transcript.length > maxChars) break;
  }
  return { videoId, transcript: transcript.trim().substring(0, maxChars) };
}

async function redditSearch(query: string, subreddit?: string, limit: number = 10) {
  const sr = subreddit ? `/r/${subreddit}` : '';
  const url = `https://www.reddit.com${sr}/search.json?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 25)}&sort=relevance`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0 (research bot)' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Reddit: ${res.status}`);
  const d = await res.json();
  return (d.data?.children || []).map((c: any) => ({
    title: c.data.title,
    subreddit: c.data.subreddit,
    score: c.data.score,
    url: `https://reddit.com${c.data.permalink}`,
    selftext: (c.data.selftext || '').substring(0, 500),
  }));
}

async function rssFetch(url: string, limit: number = 20) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`RSS fetch: ${res.status}`);
  const xml = await res.text();
  
  const items: Array<{title: string; link: string; published: string; summary: string}> = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  let count = 0;
  for (const im of itemMatches) {
    if (count >= limit) break;
    const item = im[1];
    const get = (tag: string) => {
      const mm = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      return mm ? mm[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim().substring(0, 500) : '';
    };
    items.push({
      title: get('title'),
      link: get('link'),
      published: get('pubDate') || get('published'),
      summary: get('description') || get('summary'),
    });
    count++;
  }
  return items;
}

// --- Main handler ---

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRate(`research:${ip}`, 30, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded (30/min)' }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { capability, operation, params = {}, dotName } = body;
  if (!capability || !operation) {
    return NextResponse.json({ error: 'capability and operation required' }, { status: 400 });
  }

  try {
    let result: any;
    switch (`${capability}:${operation}`) {
      case 'web-search:search':
        result = await webSearch(params.query, params.limit);
        break;
      case 'web-read:read':
        result = await webRead(params.url, params.maxChars);
        break;
      case 'github-research:repo-info':
        result = await githubRepoInfo(params.owner, params.repo);
        break;
      case 'github-research:repo-readme':
        result = await githubReadme(params.owner, params.repo);
        break;
      case 'github-research:repo-issues':
        result = await githubIssues(params.owner, params.repo, params.limit);
        break;
      case 'youtube-transcript:get-transcript':
        result = await youtubeTranscript(params.videoId, params.maxChars);
        break;
      case 'reddit:search':
        result = await redditSearch(params.query, params.subreddit, params.limit);
        break;
      case 'rss:fetch-feed':
        result = await rssFetch(params.url, params.limit);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown capability operation: ${capability}:${operation}` },
          { status: 400 }
        );
    }

    // Audit log (server-side only)
    console.log(`[research] ${dotName || 'anonymous'} used ${capability}:${operation}`);

    return NextResponse.json({ success: true, capability, operation, result });
  } catch (e: any) {
    console.error(`[research] ${capability}:${operation} failed:`, e.message);
    return NextResponse.json(
      { success: false, error: e.message || 'Research operation failed' },
      { status: 502 }
    );
  }
}

export async function GET() {
  // Return capability registry
  const { CAPABILITY_REGISTRY } = await import('@/lib/capabilities/registry');
  return NextResponse.json({ capabilities: CAPABILITY_REGISTRY });
}
