/**
 * Dot definitions — client-safe (no Node.js imports).
 * Server-side persona details live in @/lib/mydots/chat-core.
 */

export type DotStatus = 'idle' | 'thinking' | 'working' | 'error' | 'streaming';

export interface DotDef {
  name: string;
  role: string;
  specialty: string;
  emoji: string;
  avatar: string;
}

export const DOTS: DotDef[] = [
  { name: 'Scout', role: 'Research Specialist', specialty: 'Market intelligence & discovery', emoji: '🔍', avatar: '🔍' },
  { name: 'Analyst', role: 'Data Analyst', specialty: 'Deep analysis & insights', emoji: '📊', avatar: '📊' },
  { name: 'Craftsman', role: 'Build Engineer', specialty: 'Implementation & construction', emoji: '🔨', avatar: '🔨' },
  { name: 'Hunter', role: 'Outreach Specialist', specialty: 'Lead engagement & conversion', emoji: '🎯', avatar: '🎯' },
  { name: 'Shepherd', role: 'Relationship Manager', specialty: 'Nurturing & follow-up', emoji: '🤝', avatar: '🤝' },
  { name: 'Closer', role: 'Deal Closer', specialty: 'Final conversion & revenue', emoji: '💰', avatar: '💰' },
  { name: 'MediaPilot', role: 'Content Producer', specialty: 'Media briefs & publishing prep', emoji: '🎬', avatar: '🎬' },
];

export const DOT_MAP: Record<string, DotDef> = Object.fromEntries(
  DOTS.map((d) => [d.name, d]),
);

// Alias for workspace components
export const DOT_DEFS: Record<string, DotDef> = DOT_MAP;
