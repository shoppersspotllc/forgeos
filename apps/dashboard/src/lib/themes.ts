// ForgeOS 12-Theme System
// Each theme defines CSS variables for the cinematic visual layer

export interface Theme {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  description: string;
  // Atmosphere: how the theme changes the environment beyond colors
  atmosphere: {
    vignette: string;      // radial vignette overlay
    ambientTop: string;     // top ambient light color
    ambientBottom: string;  // bottom ambient light color
    particleDensity: number; // 0-1 starfield density multiplier
    glowSpread: number;      // blur radius multiplier for orbs
  };
  colors: {
    bg: string;
    bgSecondary: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentSecondary: string;
    accentGlow: string;
    success: string;
    warning: string;
    error: string;
  };
  effects: {
    starfield: boolean;
    starColor: string;
    orbColors: string[];
    glowIntensity: number;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'nebula',
    name: 'Nebula',
    mode: 'dark',
    description: 'Deep space — purple, cyan, magenta',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(10,10,18,0.6) 100%)',
      ambientTop: 'rgba(139,92,246,0.08)', ambientBottom: 'rgba(34,211,238,0.05)',
      particleDensity: 1.0, glowSpread: 1.2,
    },
    colors: {
      bg: '#0a0a12', bgSecondary: '#0d0d18', surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.08)',
      text: '#ffffff', textSecondary: '#a1a1aa', textMuted: '#52525b',
      accent: '#8b5cf6', accentSecondary: '#22d3ee', accentGlow: 'rgba(139,92,246,0.3)',
      success: '#10b981', warning: '#f59e0b', error: '#ef4444',
    },
    effects: { starfield: true, starColor: '#a78bfa', orbColors: ['#8b5cf6', '#22d3ee', '#ec4899'], glowIntensity: 1 },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    mode: 'dark',
    description: 'Pure dark — deep blue accents',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(2,6,23,0.7) 100%)',
      ambientTop: 'rgba(59,130,246,0.06)', ambientBottom: 'rgba(30,64,175,0.04)',
      particleDensity: 0.8, glowSpread: 0.9,
    },
    colors: {
      bg: '#020617', bgSecondary: '#0a0f1e', surface: 'rgba(255,255,255,0.03)',
      surfaceHover: 'rgba(255,255,255,0.06)', border: 'rgba(148,163,184,0.1)',
      text: '#f1f5f9', textSecondary: '#94a3b8', textMuted: '#475569',
      accent: '#3b82f6', accentSecondary: '#60a5fa', accentGlow: 'rgba(59,130,246,0.25)',
      success: '#10b981', warning: '#f59e0b', error: '#ef4444',
    },
    effects: { starfield: true, starColor: '#93c5fd', orbColors: ['#3b82f6', '#1e40af'], glowIntensity: 0.7 },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    mode: 'light',
    description: 'Bright light — ice blue clarity',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 60%, rgba(186,230,253,0.25) 100%)',
      ambientTop: 'rgba(14,165,233,0.06)', ambientBottom: 'rgba(125,211,252,0.04)',
      particleDensity: 0.0, glowSpread: 0.6,
    },
    colors: {
      bg: '#f8fafc', bgSecondary: '#f1f5f9', surface: 'rgba(255,255,255,0.7)',
      surfaceHover: 'rgba(255,255,255,0.9)', border: 'rgba(15,23,42,0.08)',
      text: '#0f172a', textSecondary: '#475569', textMuted: '#94a3b8',
      accent: '#0ea5e9', accentSecondary: '#0284c7', accentGlow: 'rgba(14,165,233,0.15)',
      success: '#059669', warning: '#d97706', error: '#dc2626',
    },
    effects: { starfield: false, starColor: '#bae6fd', orbColors: ['#0ea5e9', '#7dd3fc'], glowIntensity: 0.4 },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    mode: 'dark',
    description: 'Warm — oranges, reds, pinks',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(26,15,10,0.65) 100%)',
      ambientTop: 'rgba(249,115,22,0.1)', ambientBottom: 'rgba(236,72,153,0.06)',
      particleDensity: 0.9, glowSpread: 1.1,
    },
    colors: {
      bg: '#1a0f0a', bgSecondary: '#221410', surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)', border: 'rgba(251,146,60,0.12)',
      text: '#fff7ed', textSecondary: '#fed7aa', textMuted: '#9a6b4f',
      accent: '#f97316', accentSecondary: '#ec4899', accentGlow: 'rgba(249,115,22,0.3)',
      success: '#10b981', warning: '#eab308', error: '#ef4444',
    },
    effects: { starfield: true, starColor: '#fdba74', orbColors: ['#f97316', '#ec4899', '#fbbf24'], glowIntensity: 0.9 },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    mode: 'dark',
    description: 'Deep blue — teals and cyans',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(4,18,31,0.7) 100%)',
      ambientTop: 'rgba(6,182,212,0.08)', ambientBottom: 'rgba(8,145,178,0.05)',
      particleDensity: 0.9, glowSpread: 1.0,
    },
    colors: {
      bg: '#04121f', bgSecondary: '#071a2b', surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)', border: 'rgba(34,211,238,0.12)',
      text: '#ecfeff', textSecondary: '#a5f3fc', textMuted: '#0e7490',
      accent: '#06b6d4', accentSecondary: '#22d3ee', accentGlow: 'rgba(6,182,212,0.3)',
      success: '#10b981', warning: '#f59e0b', error: '#f87171',
    },
    effects: { starfield: true, starColor: '#67e8f9', orbColors: ['#06b6d4', '#0891b2', '#22d3ee'], glowIntensity: 0.8 },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    mode: 'dark',
    description: 'Lush green — natural and calm',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(4,18,12,0.65) 100%)',
      ambientTop: 'rgba(16,185,129,0.08)', ambientBottom: 'rgba(5,150,105,0.05)',
      particleDensity: 0.7, glowSpread: 0.9,
    },
    colors: {
      bg: '#04120c', bgSecondary: '#071b12', surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)', border: 'rgba(16,185,129,0.12)',
      text: '#ecfdf5', textSecondary: '#a7f3d0', textMuted: '#047857',
      accent: '#10b981', accentSecondary: '#34d399', accentGlow: 'rgba(16,185,129,0.3)',
      success: '#22c55e', warning: '#eab308', error: '#ef4444',
    },
    effects: { starfield: true, starColor: '#6ee7b7', orbColors: ['#10b981', '#059669'], glowIntensity: 0.7 },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    mode: 'dark',
    description: 'Bold red — power and intensity',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(21,10,10,0.7) 100%)',
      ambientTop: 'rgba(239,68,68,0.09)', ambientBottom: 'rgba(153,27,27,0.05)',
      particleDensity: 0.8, glowSpread: 1.0,
    },
    colors: {
      bg: '#150a0a', bgSecondary: '#1e0e0e', surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)', border: 'rgba(239,68,68,0.12)',
      text: '#fef2f2', textSecondary: '#fecaca', textMuted: '#991b1b',
      accent: '#ef4444', accentSecondary: '#f87171', accentGlow: 'rgba(239,68,68,0.3)',
      success: '#10b981', warning: '#f59e0b', error: '#dc2626',
    },
    effects: { starfield: true, starColor: '#fca5a5', orbColors: ['#ef4444', '#991b1b'], glowIntensity: 0.8 },
  },
  {
    id: 'gold',
    name: 'Aurum',
    mode: 'dark',
    description: 'Premium gold — luxury and wealth',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(20,16,10,0.65) 100%)',
      ambientTop: 'rgba(234,179,8,0.1)', ambientBottom: 'rgba(202,138,4,0.06)',
      particleDensity: 1.0, glowSpread: 1.15,
    },
    colors: {
      bg: '#14100a', bgSecondary: '#1c160e', surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)', border: 'rgba(234,179,8,0.15)',
      text: '#fffbeb', textSecondary: '#fde68a', textMuted: '#92400e',
      accent: '#eab308', accentSecondary: '#facc15', accentGlow: 'rgba(234,179,8,0.3)',
      success: '#10b981', warning: '#f59e0b', error: '#ef4444',
    },
    effects: { starfield: true, starColor: '#fde68a', orbColors: ['#eab308', '#ca8a04'], glowIntensity: 0.9 },
  },
  {
    id: 'violet',
    name: 'Violet',
    mode: 'dark',
    description: 'Royal purple — creativity and mystery',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(16,10,26,0.7) 100%)',
      ambientTop: 'rgba(139,92,246,0.1)', ambientBottom: 'rgba(109,40,217,0.06)',
      particleDensity: 1.0, glowSpread: 1.25,
    },
    colors: {
      bg: '#100a1a', bgSecondary: '#160e24', surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)', border: 'rgba(139,92,246,0.15)',
      text: '#f5f3ff', textSecondary: '#ddd6fe', textMuted: '#6d28d9',
      accent: '#8b5cf6', accentSecondary: '#a78bfa', accentGlow: 'rgba(139,92,246,0.35)',
      success: '#10b981', warning: '#f59e0b', error: '#ef4444',
    },
    effects: { starfield: true, starColor: '#c4b5fd', orbColors: ['#8b5cf6', '#6d28d9', '#a78bfa'], glowIntensity: 1 },
  },
  {
    id: 'rose',
    name: 'Rosé',
    mode: 'light',
    description: 'Soft pink — elegant light theme',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 60%, rgba(254,205,211,0.3) 100%)',
      ambientTop: 'rgba(225,29,72,0.05)', ambientBottom: 'rgba(244,63,94,0.04)',
      particleDensity: 0.0, glowSpread: 0.6,
    },
    colors: {
      bg: '#fff1f2', bgSecondary: '#ffe4e6', surface: 'rgba(255,255,255,0.7)',
      surfaceHover: 'rgba(255,255,255,0.9)', border: 'rgba(190,24,93,0.1)',
      text: '#4c0519', textSecondary: '#881337', textMuted: '#f9a8d4',
      accent: '#e11d48', accentSecondary: '#f43f5e', accentGlow: 'rgba(225,29,72,0.15)',
      success: '#059669', warning: '#d97706', error: '#dc2626',
    },
    effects: { starfield: false, starColor: '#fecdd3', orbColors: ['#f43f5e', '#fb7185'], glowIntensity: 0.4 },
  },
  {
    id: 'slate',
    name: 'Slate',
    mode: 'dark',
    description: 'Professional gray — minimal and focused',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 55%, rgba(15,17,21,0.6) 100%)',
      ambientTop: 'rgba(100,116,139,0.05)', ambientBottom: 'rgba(71,85,105,0.03)',
      particleDensity: 0.3, glowSpread: 0.5,
    },
    colors: {
      bg: '#0f1115', bgSecondary: '#15181e', surface: 'rgba(255,255,255,0.03)',
      surfaceHover: 'rgba(255,255,255,0.06)', border: 'rgba(148,163,184,0.08)',
      text: '#f8fafc', textSecondary: '#cbd5e1', textMuted: '#64748b',
      accent: '#64748b', accentSecondary: '#94a3b8', accentGlow: 'rgba(100,116,139,0.2)',
      success: '#10b981', warning: '#f59e0b', error: '#ef4444',
    },
    effects: { starfield: false, starColor: '#cbd5e1', orbColors: ['#64748b', '#475569'], glowIntensity: 0.3 },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    mode: 'dark',
    description: 'Northern lights — teal, green, purple dance',
    atmosphere: {
      vignette: 'radial-gradient(ellipse at center, transparent 50%, rgba(6,13,18,0.7) 100%)',
      ambientTop: 'rgba(45,212,191,0.09)', ambientBottom: 'rgba(139,92,246,0.06)',
      particleDensity: 1.0, glowSpread: 1.3,
    },
    colors: {
      bg: '#060d12', bgSecondary: '#0a141b', surface: 'rgba(255,255,255,0.04)',
      surfaceHover: 'rgba(255,255,255,0.08)', border: 'rgba(45,212,191,0.12)',
      text: '#f0fdfa', textSecondary: '#99f6e4', textMuted: '#0f766e',
      accent: '#2dd4bf', accentSecondary: '#8b5cf6', accentGlow: 'rgba(45,212,191,0.3)',
      success: '#34d399', warning: '#fbbf24', error: '#f87171',
    },
    effects: { starfield: true, starColor: '#5eead4', orbColors: ['#2dd4bf', '#8b5cf6', '#34d399'], glowIntensity: 1 },
  },
];

export const DEFAULT_THEME = 'nebula';

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

export function themeToCSS(theme: Theme): string {
  const c = theme.colors;
  return `
    --bg: ${c.bg};
    --bg-secondary: ${c.bgSecondary};
    --surface: ${c.surface};
    --surface-hover: ${c.surfaceHover};
    --border: ${c.border};
    --text: ${c.text};
    --text-secondary: ${c.textSecondary};
    --text-muted: ${c.textMuted};
    --accent: ${c.accent};
    --accent-secondary: ${c.accentSecondary};
    --accent-glow: ${c.accentGlow};
    --success: ${c.success};
    --warning: ${c.warning};
    --error: ${c.error};
  `;
}
