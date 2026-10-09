/**
 * ForgeOS Capability Executor — shared server-side tool execution
 *
 * Single source of truth for research capability implementations.
 * Used directly (in-process) by:
 *   - apps/dashboard/src/app/api/research/route.ts   (public HTTP API)
 *   - apps/dashboard/src/app/api/my-dots/chat/route.ts (agentic tool loop)
 *
 * Security properties:
 *   - All outbound fetches to user-supplied URLs go through safeFetch(),
 *     which enforces SSRF protections: IP-literal blocklist, localhost
 *     blocklist, cloud-metadata blocklist, DNS-resolution check (mitigates
 *     DNS rebinding for attacker-controlled domains), and manual redirect
 *     following with per-hop validation (max 3 hops).
 *   - Tool permissions are enforced server-side via DOT_TOOL_PERMISSIONS.
 *     The map below is the authority; caller-supplied dotName is only ever
 *     used as a lookup key into this map, never as proof of capability.
 *   - All external content is treated as untrusted. No credentials are
 *     exposed. Errors are sanitized (no stack traces, no internal details).
 *
 * Cost: $0 — all capabilities use free, keyless public endpoints.
 */

import { promises as dnsPromises } from 'dns';

// ---------------------------------------------------------------------------
// SSRF protection
// ---------------------------------------------------------------------------

const MAX_REDIRECTS = 3;

/** True if the IP literal is loopback, private, link-local, or otherwise non-public. */
export function isPrivateIp(ip: string): boolean {
  const clean = ip.toLowerCase().replace(/^\[|\]$/g, '');
  const v4 = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = parseInt(v4[1], 10);
    const b = parseInt(v4[2], 10);
    if (a === 127 || a === 10 || a === 0) return true;                 // loopback / private / invalid
    if (a === 172 && b >= 16 && b <= 31) return true;                   // 172.16.0.0/12
    if (a === 192 && b === 168) return true;                           // 192.168.0.0/16
    if (a === 169 && b === 254) return true;                           // link-local (cloud metadata)
    if (a === 100 && b >= 64 && b <= 127) return true;                  // CGNAT 100.64.0.0/10
    if (a === 192 && b === 0 && parseInt(v4[3], 10) === 2) return true; // TEST-NET-1 (documentation)
    return false;
  }
  // IPv6
  if (clean === '::1' || clean === '::') return true;                   // loopback / unspecified
  if (clean.startsWith('fe80:') || clean.startsWith('fec0:')) return true; // link-local / site-local
  if (clean.startsWith('fc00:') || clean.startsWith('fd')) return true;   // unique-local
  if (/^0*(:0*)*:0*1$/.test(clean)) return true;                        // expanded ::1
  return false;
}

/** Fast literal checks on the URL (no DNS). Returns a block reason or null. */
function checkUrlLiteral(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'Only http/https allowed';
  }
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === 'localhost.localdomain' || host.endsWith('.localhost')) {
    return 'Localhost blocked';
  }
  if (host === 'metadata.google.internal' || host === 'metadata.google' || host === 'instance-data') {
    return 'Cloud metadata blocked';
  }
  if (isPrivateIp(host)) {
    return 'Private IP literal blocked';
  }
  return null;
}

/**
 * DNS-resolution check. Resolves the hostname and blocks if ANY resolved
 * address is non-public. Mitigates DNS-rebinding for attacker-controlled
 * domains. Fail-closed: unresolvable hosts are blocked.
 */
async function checkDns(hostname: string): Promise<string | null> {
  const host = hostname.toLowerCase();
  // Skip DNS for IP literals (already checked above)
  if (/^[\d.:a-f]+$/i.test(host.replace(/^\[|\]$/g, ''))) return null;
  let addrs: string[];
  try {
    const results = await dnsPromises.lookup(host, { all: true });
    addrs = results.map((r: { address: string }) => r.address);
  } catch {
    return 'DNS resolution failed';
  }
  if (addrs.length === 0) return 'No DNS records';
  for (const ip of addrs) {
    if (isPrivateIp(ip)) {
      return 'Resolves to private IP (possible DNS rebinding)';
    }
  }
  return null;
}

/** Full SSRF validation for a URL. Throws on any violation. */
export async function assertSafeUrl(url: string): Promise<void> {
  const literal = checkUrlLiteral(url);
  if (literal) throw new Error(`Blocked URL: ${literal}`);
  const dnsErr = await checkDns(new URL(url).hostname);
  if (dnsErr) throw new Error(`Blocked URL: ${dnsErr}`);
}

/**
 * Fetch with SSRF protections: validates the initial URL, follows redirects
 * manually (validating every hop), and enforces a hop limit.
 */
export async function safeFetch(url: string, init: RequestInit = {}, maxRedirects: number = MAX_REDIRECTS): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    await assertSafeUrl(current);
    const res = await fetch(current, { ...init, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      try {
        await res.arrayBuffer();
      } catch {
        /* ignore body-consume errors on redirect */
      }
      if (!loc) throw new Error(`Blocked URL: redirect ${res.status} without location`);
      current = new URL(loc, current).toString();
      continue;
    }
    return res;
  }
  throw new Error('Blocked URL: too many redirects');
}

// ---------------------------------------------------------------------------
// Server-side tool permissions (the authority — never trust client claims)
// ---------------------------------------------------------------------------

/**
 * Which research capabilities each Dot may invoke, enforced server-side.
 * The client-supplied dotName is only a lookup key into this map.
 * Dots not listed here get NO tool execution (chat still works).
 */
export const DOT_TOOL_PERMISSIONS: Record<string, string[]> = {
  Scout: ['web-search', 'web-read', 'github-research', 'youtube-transcript', 'reddit', 'rss'],
  Analyst: ['web-search', 'web-read', 'github-research'],
  Craftsman: ['web-search', 'web-read', 'github-research'],
  Hunter: ['web-search', 'reddit'],
  Shepherd: ['web-search'],
  Closer: ['web-search'],
};

export function getAllowedCapabilities(dotName: string): string[] {
  return DOT_TOOL_PERMISSIONS[dotName] || [];
}

export function isCapabilityAllowed(dotName: string, capability: string): boolean {
  return getAllowedCapabilities(dotName).indexOf(capability) !== -1;
}

// Human-readable tool schemas for prompts
interface ToolOp {
  operation: string;
  params: string;
  description: string;
}

const TOOL_SCHEMAS: Record<string, ToolOp[]> = {
  'web-search': [
    { operation: 'search', params: '{query: string (1-200 chars), limit?: number}', description: 'Search the public web. Returns titles, URLs, snippets.' },
  ],
  'web-read': [
    { operation: 'read', params: '{url: string, maxChars?: number}', description: 'Extract clean text from a webpage.' },
  ],
  'github-research': [
    { operation: 'repo-info', params: '{owner: string, repo: string}', description: 'Repo metadata: stars, description, license, language, URL.' },
    { operation: 'repo-readme', params: '{owner: string, repo: string}', description: 'Repo README text.' },
    { operation: 'repo-issues', params: '{owner: string, repo: string, limit?: number}', description: 'List repo issues.' },
  ],
  'youtube-transcript': [
    { operation: 'get-transcript', params: '{videoId: string (11 chars), maxChars?: number}', description: 'Video transcript/captions.' },
  ],
  reddit: [
    { operation: 'search', params: '{query: string, subreddit?: string, limit?: number}', description: 'Search Reddit posts.' },
  ],
  rss: [
    { operation: 'fetch-feed', params: '{url: string, limit?: number}', description: 'Fetch RSS/Atom feed items.' },
  ],
};

/** Build the tool guide text for a Dot's system prompt, from its server-side permissions. */
export function buildToolGuide(dotName: string): string {
  const allowed = getAllowedCapabilities(dotName);
  if (allowed.length === 0) return '';
  const lines: string[] = [];
  for (const cap of allowed) {
    const ops = TOOL_SCHEMAS[cap] || [];
    for (const op of ops) {
      lines.push(`- ${cap} / ${op.operation} ${op.params} — ${op.description}`);
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Param validation
// ---------------------------------------------------------------------------

function strParam(params: any, name: string, min: number, max: number, required: boolean = true): string {
  const v = params[name];
  if (v === undefined || v === null) {
    if (required) throw new Error(`Missing required param: ${name}`);
    return '';
  }
  if (typeof v !== 'string') throw new Error(`Param ${name} must be a string`);
  const t = v.trim();
  if (t.length < min || t.length > max) throw new Error(`Param ${name} length out of range (${min}-${max})`);
  return t;
}

function numParam(params: any, name: string, def: number, min: number, max: number): number {
  const v = params[name];
  if (v === undefined || v === null) return def;
  const n = Number(v);
  if (!isFinite(n)) throw new Error(`Param ${name} must be a number`);
  return Math.max(min, Math.min(max, Math.floor(n)));
}

// ---------------------------------------------------------------------------
// Capability implementations (all treat external content as untrusted)
// ---------------------------------------------------------------------------

async function webSearch(query: string, limit: number = 10): Promise<Array<{ title: string; url: string; snippet: string }>> {
  // Bing HTML (no API key, free, datacenter-friendly)
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=20`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const html = await res.text();

  const results: Array<{ title: string; url: string; snippet: string }> = [];
  const algoRe = /<li class="b_algo"[^>]*>[\s\S]*?<h2><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>([\s\S]*?)<\/li>/g;

  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = algoRe.exec(html)) !== null && count < limit) {
    const rawUrl = m[1];
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    const snippetHtml = m[3];
    const pMatch = snippetHtml.match(/<p>([\s\S]*?)<\/p>/);
    const snippet = pMatch ? pMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 300) : '';

    if (title && rawUrl.startsWith('http') && rawUrl.indexOf('bing.com') === -1) {
      results.push({ title: title.substring(0, 200), url: rawUrl.substring(0, 500), snippet });
      count++;
    }
  }
  return results;
}

async function webRead(url: string, maxChars: number = 8000): Promise<{ title: string; text: string; url: string }> {
  const res = await safeFetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ForgeOS-Research/1.0)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 200) : '';

  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const mainMatch = text.match(/<main[\s\S]*?<\/main>/i) || text.match(/<article[\s\S]*?<\/article>/i);
  if (mainMatch) text = mainMatch[0];

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

async function githubRepoInfo(owner: string, repo: string): Promise<any> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0', Accept: 'application/vnd.github.v3+json' },
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
    license: (d.license && (d.license.spdx_id || d.license.name)) || 'none',
    updated: d.updated_at,
    url: d.html_url,
  };
}

async function githubReadme(owner: string, repo: string): Promise<any> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0', Accept: 'application/vnd.github.v3.raw' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
  const text = await res.text();
  return { readme: text.substring(0, 10000) };
}

async function githubIssues(owner: string, repo: string, limit: number = 10): Promise<any> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=${Math.min(limit, 20)}`,
    {
      headers: { 'User-Agent': 'ForgeOS-Research/1.0', Accept: 'application/vnd.github.v3+json' },
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

async function youtubeTranscript(videoId: string, maxChars: number = 10000): Promise<any> {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) throw new Error('Invalid YouTube video ID');
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    signal: AbortSignal.timeout(12000),
  });
  if (!pageRes.ok) throw new Error(`YouTube: ${pageRes.status}`);
  const page = await pageRes.text();

  const captionMatch = page.match(/"captionTracks":\[([\s\S]*?)\]/);
  if (!captionMatch) throw new Error('No captions available for this video');

  const tracks = captionMatch[1];
  const urlMatch = tracks.match(/"baseUrl":"([^"]+)"/);
  if (!urlMatch) throw new Error('Could not extract caption URL');

  const captionUrl = urlMatch[1].replace(/\\u0026/g, '&');
  const capRes = await safeFetch(captionUrl, { signal: AbortSignal.timeout(12000) });
  if (!capRes.ok) throw new Error(`Caption fetch: ${capRes.status}`);
  const xml = await capRes.text();

  const textRe = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let transcript = '';
  let tm: RegExpExecArray | null;
  while ((tm = textRe.exec(xml)) !== null) {
    transcript +=
      tm[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n/g, ' ') + ' ';
    if (transcript.length > maxChars) break;
  }
  return { videoId, transcript: transcript.trim().substring(0, maxChars) };
}

async function redditSearch(query: string, subreddit: string, limit: number = 10): Promise<any> {
  const sr = subreddit ? `/r/${subreddit}` : '';
  const url = `https://www.reddit.com${sr}/search.json?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 25)}&sort=relevance`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0 (research bot)' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Reddit: ${res.status}`);
  const d = await res.json();
  return ((d.data && d.data.children) || []).map((c: any) => ({
    title: c.data.title,
    subreddit: c.data.subreddit,
    score: c.data.score,
    url: `https://reddit.com${c.data.permalink}`,
    selftext: (c.data.selftext || '').substring(0, 500),
  }));
}

async function rssFetch(url: string, limit: number = 20): Promise<any> {
  const res = await safeFetch(url, {
    headers: { 'User-Agent': 'ForgeOS-Research/1.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`RSS fetch: ${res.status}`);
  const xml = await res.text();

  const items: Array<{ title: string; link: string; published: string; summary: string }> = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let count = 0;
  let im: RegExpExecArray | null;
  while ((im = itemRe.exec(xml)) !== null) {
    if (count >= limit) break;
    const item = im[1];
    const get = (tag: string): string => {
      const mm = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      return mm
        ? mm[1]
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/<[^>]+>/g, '')
            .trim()
            .substring(0, 500)
        : '';
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

// ---------------------------------------------------------------------------
// Dispatcher (validates params, then executes)
// ---------------------------------------------------------------------------

export async function executeCapability(capability: string, operation: string, params: any): Promise<any> {
  const p = params && typeof params === 'object' ? params : {};
  const key = `${capability}:${operation}`;
  switch (key) {
    case 'web-search:search': {
      const query = strParam(p, 'query', 1, 200);
      return webSearch(query, numParam(p, 'limit', 10, 1, 20));
    }
    case 'web-read:read': {
      const url = strParam(p, 'url', 1, 2000);
      return webRead(url, numParam(p, 'maxChars', 8000, 100, 20000));
    }
    case 'github-research:repo-info': {
      const owner = strParam(p, 'owner', 1, 100);
      const repo = strParam(p, 'repo', 1, 100);
      return githubRepoInfo(owner, repo);
    }
    case 'github-research:repo-readme': {
      const owner = strParam(p, 'owner', 1, 100);
      const repo = strParam(p, 'repo', 1, 100);
      return githubReadme(owner, repo);
    }
    case 'github-research:repo-issues': {
      const owner = strParam(p, 'owner', 1, 100);
      const repo = strParam(p, 'repo', 1, 100);
      return githubIssues(owner, repo, numParam(p, 'limit', 10, 1, 20));
    }
    case 'youtube-transcript:get-transcript': {
      const videoId = strParam(p, 'videoId', 11, 11);
      return youtubeTranscript(videoId, numParam(p, 'maxChars', 10000, 100, 50000));
    }
    case 'reddit:search': {
      const query = strParam(p, 'query', 1, 200);
      const subreddit = strParam(p, 'subreddit', 1, 50, false);
      return redditSearch(query, subreddit, numParam(p, 'limit', 10, 1, 25));
    }
    case 'rss:fetch-feed': {
      const url = strParam(p, 'url', 1, 2000);
      return rssFetch(url, numParam(p, 'limit', 20, 1, 50));
    }
    default:
      throw new Error(`Unknown capability operation: ${key}`);
  }
}
