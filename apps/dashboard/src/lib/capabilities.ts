// ForgeOS Capability Registry — Single source of truth for agent capabilities
// Portable: all capabilities defined here, no hardcoded VPS paths

export interface Capability {
  id: string;
  name: string;
  category: 'skill' | 'mcp' | 'connector' | 'runtime' | 'tool' | 'provider' | 'creative';
  description: string;
  available: boolean;
  version?: string;
  endpoint?: string;
}

export const CAPABILITIES: Capability[] = [
  // Runtimes
  {
    id: 'colibri',
    name: 'Colibrì (Ollama)',
    category: 'runtime',
    description: 'Local lightweight intelligence runtime',
    available: false, // Live-probed at runtime via /api/capabilities
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434',
  },
  {
    id: 'ruflo',
    name: 'Ruflo Orchestration',
    category: 'runtime',
    description: 'Multi-agent orchestration platform v3.54.0',
    available: true,
  },
  // Providers
  {
    id: 'forgeos-ai',
    name: 'ForgeOS AI',
    category: 'provider',
    description: 'Primary internal AI provider',
    available: false, // Live-probed at runtime via /api/capabilities
    endpoint: process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788',
  },
  // Tools
  {
    id: 'opencode',
    name: 'OpenCode',
    category: 'tool',
    description: 'Developer worker (ForgeOS AI default)',
    available: true,
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    category: 'tool',
    description: 'Premium developer worker (Anthropic auth)',
    available: true,
  },
  // Connectors
  {
    id: 'github',
    name: 'GitHub',
    category: 'connector',
    description: 'Repository access',
    available: true,
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'connector',
    description: 'File storage',
    available: false, // Requires OAuth — owner action
  },
  {
    id: 'canva',
    name: 'Canva',
    category: 'creative',
    description: 'Design and creative capability — presentations, social, marketing',
    available: false, // Requires OAuth — owner action on first use
    endpoint: 'https://www.canva.com/api',
  },
  // Skills
  {
    id: 'skill-coding',
    name: 'Coding & Debugging',
    category: 'skill',
    description: 'Software engineering, debugging, code review',
    available: true,
  },
  {
    id: 'skill-webdev',
    name: 'Web Development',
    category: 'skill',
    description: 'Frontend, backend, APIs, UI/UX',
    available: true,
  },
  {
    id: 'skill-devops',
    name: 'DevOps & Deployment',
    category: 'skill',
    description: 'CI/CD, infrastructure, deployment',
    available: true,
  },
  {
    id: 'skill-research',
    name: 'Research & Analysis',
    category: 'skill',
    description: 'Market research, business analysis, documentation',
    available: true,
  },
];

export function getCapabilities(category?: string): Capability[] {
  return category
    ? CAPABILITIES.filter(c => c.category === category)
    : CAPABILITIES;
}

export function getAvailableCount(): number {
  return CAPABILITIES.filter(c => c.available).length;
}
