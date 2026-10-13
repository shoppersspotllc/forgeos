// Build trigger: deploy capability layer
/**
 * ForgeOS Shared Capability Registry
 * 
 * Defines reusable tools that authorized Dots can discover and use.
 * Inspired by Agent Reach (MIT) architecture, implemented natively in TypeScript
 * for Vercel serverless deployment.
 * 
 * Each capability declares: description, operations, inputs, permissions,
 * health status, timeouts, and cost classification.
 */

export interface CapabilityDef {
  id: string;
  name: string;
  description: string;
  version: string;
  operations: OperationDef[];
  permissions: string[];
  timeoutMs: number;
  costClass: 'free' | 'freemium' | 'paid';
  healthEndpoint?: string;
}

export interface OperationDef {
  id: string;
  description: string;
  inputs: Record<string, { type: string; required: boolean; description: string }>;
  outputDescription: string;
}

export const CAPABILITY_REGISTRY: CapabilityDef[] = [
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the public web using free search APIs. Returns ranked results with titles, URLs, and snippets.',
    version: '1.0.0',
    operations: [
      {
        id: 'search',
        description: 'Execute a web search query',
        inputs: {
          query: { type: 'string', required: true, description: 'Search query (1-200 chars)' },
          limit: { type: 'number', required: false, description: 'Max results (default 10, max 20)' },
        },
        outputDescription: 'Array of {title, url, snippet}',
      },
    ],
    permissions: ['research:web'],
    timeoutMs: 15000,
    costClass: 'free',
  },
  {
    id: 'web-read',
    name: 'Webpage Reader',
    description: 'Fetch and extract clean readable text from any public webpage. Strips HTML, ads, and navigation.',
    version: '1.0.0',
    operations: [
      {
        id: 'read',
        description: 'Extract readable text from a URL',
        inputs: {
          url: { type: 'string', required: true, description: 'Full HTTPS URL to read' },
          maxChars: { type: 'number', required: false, description: 'Max chars to return (default 8000)' },
        },
        outputDescription: '{title, text, url}',
      },
    ],
    permissions: ['research:web'],
    timeoutMs: 20000,
    costClass: 'free',
  },
  {
    id: 'github-research',
    name: 'GitHub Research',
    description: 'Research public GitHub repositories: metadata, README, issues, and file contents.',
    version: '1.0.0',
    operations: [
      {
        id: 'repo-info',
        description: 'Get repository metadata',
        inputs: {
          owner: { type: 'string', required: true, description: 'Repo owner' },
          repo: { type: 'string', required: true, description: 'Repo name' },
        },
        outputDescription: '{name, description, stars, language, license, updated}',
      },
      {
        id: 'repo-readme',
        description: 'Get repository README',
        inputs: {
          owner: { type: 'string', required: true, description: 'Repo owner' },
          repo: { type: 'string', required: true, description: 'Repo name' },
        },
        outputDescription: '{readme (markdown, truncated)}',
      },
      {
        id: 'repo-issues',
        description: 'List recent issues',
        inputs: {
          owner: { type: 'string', required: true, description: 'Repo owner' },
          repo: { type: 'string', required: true, description: 'Repo name' },
          limit: { type: 'number', required: false, description: 'Max issues (default 10)' },
        },
        outputDescription: 'Array of {number, title, state, created}',
      },
    ],
    permissions: ['research:github'],
    timeoutMs: 15000,
    costClass: 'free',
  },
  {
    id: 'youtube-transcript',
    name: 'YouTube Transcripts',
    description: 'Get transcripts/captions from YouTube videos for summarization and research.',
    version: '1.0.0',
    operations: [
      {
        id: 'get-transcript',
        description: 'Fetch video transcript',
        inputs: {
          videoId: { type: 'string', required: true, description: 'YouTube video ID (11 chars)' },
          maxChars: { type: 'number', required: false, description: 'Max chars (default 10000)' },
        },
        outputDescription: '{videoId, transcript, language}',
      },
    ],
    permissions: ['research:media'],
    timeoutMs: 20000,
    costClass: 'free',
  },
  {
    id: 'reddit',
    name: 'Reddit Research',
    description: 'Search Reddit posts and comments via public JSON API. No auth required.',
    version: '1.0.0',
    operations: [
      {
        id: 'search',
        description: 'Search Reddit',
        inputs: {
          query: { type: 'string', required: true, description: 'Search query' },
          subreddit: { type: 'string', required: false, description: 'Limit to subreddit' },
          limit: { type: 'number', required: false, description: 'Max results (default 10)' },
        },
        outputDescription: 'Array of {title, subreddit, score, url, selftext}',
      },
    ],
    permissions: ['research:social'],
    timeoutMs: 15000,
    costClass: 'free',
  },
  {
    id: 'rss',
    name: 'RSS Reader',
    description: 'Fetch and parse RSS/Atom feeds for monitoring and research.',
    version: '1.0.0',
    operations: [
      {
        id: 'fetch-feed',
        description: 'Parse an RSS/Atom feed',
        inputs: {
          url: { type: 'string', required: true, description: 'Feed URL' },
          limit: { type: 'number', required: false, description: 'Max items (default 20)' },
        },
        outputDescription: 'Array of {title, link, published, summary}',
      },
    ],
    permissions: ['research:web'],
    timeoutMs: 15000,
    costClass: 'free',
  },
];

/**
 * Get capabilities authorized for a Dot based on its permissions.
 */
export function getAuthorizedCapabilities(dotPermissions: string[]): CapabilityDef[] {
  return CAPABILITY_REGISTRY.filter(cap =>
    cap.permissions.some(p => dotPermissions.includes(p) || dotPermissions.includes('research:*'))
  );
}

/**
 * Dot permission assignments by role.
 */
export const DOT_CAPABILITY_PERMISSIONS: Record<string, string[]> = {
  'Scout': ['research:*'],           // Full research access for investigations
  'Analyst': ['research:web', 'research:github'],
  'Craftsman': ['research:web', 'research:github'],
  'Hunter': ['research:web', 'research:social'],
  'Shepherd': ['research:web'],
  'Closer': ['research:web'],
  'Quant': ['research:web', 'research:github'],  // Market research, no trading
};
