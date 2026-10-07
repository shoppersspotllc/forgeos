// ForgeOS Visual Rebirth — Design System Tokens
// Premium cinematic design language for the AI Operating System

export const designTokens = {
  // Spacing scale (8pt grid)
  spacing: {
    xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px',
    '2xl': '48px', '3xl': '64px', '4xl': '96px',
  },
  // Border radius
  radius: {
    sm: '8px', md: '12px', lg: '16px', xl: '24px', '2xl': '32px', full: '9999px',
  },
  // Typography
  typography: {
    display: { size: 'clamp(2.5rem, 5vw, 4rem)', weight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 },
    h1: { size: 'clamp(1.875rem, 3.5vw, 2.75rem)', weight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 },
    h2: { size: 'clamp(1.375rem, 2.5vw, 1.875rem)', weight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 },
    h3: { size: '1.25rem', weight: 600, letterSpacing: '0', lineHeight: 1.35 },
    body: { size: '1rem', weight: 400, letterSpacing: '0', lineHeight: 1.6 },
    caption: { size: '0.8125rem', weight: 500, letterSpacing: '0.02em', lineHeight: 1.5 },
    eyebrow: { size: '0.6875rem', weight: 700, letterSpacing: '0.18em', lineHeight: 1.4 },
  },
  // Shadows & depth (layered)
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.15)',
    md: '0 8px 24px rgba(0,0,0,0.25)',
    lg: '0 16px 48px rgba(0,0,0,0.35)',
    xl: '0 24px 80px rgba(0,0,0,0.45)',
    glow: (color: string, intensity = 0.4) => `0 0 24px ${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}, 0 0 64px ${color}22`,
  },
  // Animation durations
  motion: {
    instant: '120ms', fast: '200ms', normal: '350ms', slow: '600ms', cinematic: '1200ms',
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      cinematic: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  },
};

// Per-platform visual identities — each platform gets its own personality
export interface PlatformIdentity {
  id: string;
  name: string;
  tagline: string;
  gradient: [string, string, string]; // 3-stop gradient
  glow: string;
  accent: string;
  iconBg: string;
  atmosphere: string; // description of cinematic environment
  pattern: 'grid' | 'waves' | 'particles' | 'orbs' | 'rays' | 'mesh';
}

export const PLATFORM_IDENTITIES: Record<string, PlatformIdentity> = {
  dashboard: {
    id: 'dashboard', name: 'Forge Dashboard', tagline: 'Command Center',
    gradient: ['#8b5cf6', '#6366f1', '#22d3ee'], glow: '#8b5cf6',
    accent: '#a78bfa', iconBg: 'linear-gradient(135deg,#8b5cf6,#22d3ee)',
    atmosphere: 'Deep command deck with holographic data streams',
    pattern: 'grid',
  },
  youngmoney: {
    id: 'youngmoney', name: 'Young Money', tagline: 'Revenue Engine',
    gradient: ['#f59e0b', '#f97316', '#eab308'], glow: '#f59e0b',
    accent: '#fbbf24', iconBg: 'linear-gradient(135deg,#f59e0b,#eab308)',
    atmosphere: 'Golden trading floor with rising growth charts',
    pattern: 'waves',
  },
  godseye: {
    id: 'godseye', name: "God's Eye", tagline: 'Omniscient Monitor',
    gradient: ['#06b6d4', '#3b82f6', '#8b5cf6'], glow: '#06b6d4',
    accent: '#67e8f9', iconBg: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
    atmosphere: 'Dark surveillance ops center with radar sweeps and geospatial grids',
    pattern: 'rays',
  },
  positionai: {
    id: 'positionai', name: 'Position AI', tagline: 'Strategic Intelligence',
    gradient: ['#ec4899', '#8b5cf6', '#6366f1'], glow: '#ec4899',
    accent: '#f9a8d4', iconBg: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
    atmosphere: 'Strategic war room with target locks and vector overlays',
    pattern: 'grid',
  },
  mydots: {
    id: 'mydots', name: 'My Dots', tagline: 'AI Workforce',
    gradient: ['#10b981', '#06b6d4', '#8b5cf6'], glow: '#10b981',
    accent: '#6ee7b7', iconBg: 'linear-gradient(135deg,#10b981,#06b6d4)',
    atmosphere: 'Vibrant team hub with living avatar constellation',
    pattern: 'orbs',
  },
  forgeai: {
    id: 'forgeai', name: 'Forge AI', tagline: 'Intelligence Core',
    gradient: ['#8b5cf6', '#d946ef', '#ec4899'], glow: '#a855f7',
    accent: '#c084fc', iconBg: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
    atmosphere: 'Neural core chamber with pulsing synapse networks',
    pattern: 'particles',
  },
  mediaengine: {
    id: 'mediaengine', name: 'Media Engine', tagline: 'Creative Studio',
    gradient: ['#f43f5e', '#fb923c', '#facc15'], glow: '#f43f5e',
    accent: '#fda4af', iconBg: 'linear-gradient(135deg,#f43f5e,#fb923c)',
    atmosphere: 'Cinematic studio with film-reel light leaks and color washes',
    pattern: 'mesh',
  },
  health: {
    id: 'health', name: 'Health', tagline: 'System Guardian',
    gradient: ['#22c55e', '#10b981', '#06b6d4'], glow: '#22c55e',
    accent: '#86efac', iconBg: 'linear-gradient(135deg,#22c55e,#10b981)',
    atmosphere: 'Clean medical bay with vital-sign waveforms',
    pattern: 'waves',
  },
  canva: {
    id: 'canva', name: 'Canva', tagline: 'Design Studio',
    gradient: ['#00c4cc', '#7d2ae8', '#ff6b6b'], glow: '#00c4cc',
    accent: '#5eead4', iconBg: 'linear-gradient(135deg,#00c4cc,#7d2ae8)',
    atmosphere: 'Creative canvas with paint strokes and design elements',
    pattern: 'mesh',
  },
  github: {
    id: 'github', name: 'GitHub', tagline: 'Code Repository',
    gradient: ['#6e5494', '#24292f', '#57606a'], glow: '#6e5494',
    accent: '#a371f7', iconBg: 'linear-gradient(135deg,#24292f,#6e5494)',
    atmosphere: 'Developer terminal with code rain and octocat silhouette',
    pattern: 'grid',
  },
  colibri: {
    id: 'colibri', name: 'Colibrì', tagline: 'Local Intelligence',
    gradient: ['#f472b6', '#a78bfa', '#60a5fa'], glow: '#f472b6',
    accent: '#f9a8d4', iconBg: 'linear-gradient(135deg,#f472b6,#a78bfa)',
    atmosphere: 'Hummingbird-fast local compute with feather-light particles',
    pattern: 'particles',
  },
};
