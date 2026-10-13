/**
 * Dot definitions — client-safe (no Node.js imports).
 * Server-side persona details live in @/lib/mydots/chat-core.
 */

export interface DotDef {
  name: string;
  role: string;
  specialty: string;
  emoji: string;
}

export const DOTS: DotDef[] = [
  { name: 'Scout', role: 'Research Specialist', specialty: 'Market intelligence & discovery', emoji: '🔍' },
  { name: 'Analyst', role: 'Data Analyst', specialty: 'Deep analysis & insights', emoji: '📊' },
  { name: 'Craftsman', role: 'Build Engineer', specialty: 'Implementation & construction', emoji: '🔨' },
  { name: 'Hunter', role: 'Outreach Specialist', specialty: 'Lead engagement & conversion', emoji: '🎯' },
  { name: 'Shepherd', role: 'Relationship Manager', specialty: 'Nurturing & follow-up', emoji: '🤝' },
  { name: 'Closer', role: 'Deal Closer', specialty: 'Final conversion & revenue', emoji: '💰' },
  { name: 'MediaPilot', role: 'Content Producer', specialty: 'Media briefs & publishing prep', emoji: '🎬' },
];

export const DOT_MAP: Record<string, DotDef> = Object.fromEntries(
  DOTS.map((d) => [d.name, d]),
);
