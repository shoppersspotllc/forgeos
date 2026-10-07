'use client';

import { 
  Terminal, Users, Globe, DollarSign, Eye, 
  Crosshair, Sparkles, HeartPulse, Code2, Cpu, Palette, GitBranch
} from 'lucide-react';

export type View = 
  | 'command' | 'youngmoney' | 'godseye' | 'positionai' | 'mydots'
  | 'chrome' | 'github' | 'opencode' | 'claude' | 'colibri'
  | 'canva' | 'forgeai' | 'health' | 'mediaengine';

const primaryItems = [
  { id: 'command' as View, label: 'Forge Dashboard', icon: Terminal },
  { id: 'youngmoney' as View, label: 'Young Money', icon: DollarSign },
  { id: 'godseye' as View, label: "God's Eye", icon: Eye },
  { id: 'positionai' as View, label: 'Position AI', icon: Crosshair },
  { id: 'mydots' as View, label: 'My Dots', icon: Users },
  { id: 'chrome' as View, label: 'Google Chrome', icon: Globe },
  { id: 'github' as View, label: 'GitHub', icon: GitBranch },
];

const platformItems = [
  { id: 'opencode' as View, label: 'OpenCode', icon: Code2 },
  { id: 'claude' as View, label: 'Claude Code', icon: Terminal },
  { id: 'colibri' as View, label: 'Colibrì', icon: Cpu },
  { id: 'canva' as View, label: 'Canva', icon: Palette },
];

const trailItems = [
  { id: 'forgeai' as View, label: 'Forge AI', icon: Sparkles },
  { id: 'mediaengine' as View, label: 'Media Engine', icon: Palette },
  { id: 'health' as View, label: 'Health', icon: HeartPulse },
];

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
}

function Section({ title, items, currentView, onViewChange }: { 
  title: string; items: typeof primaryItems; currentView: View; onViewChange: (v: View) => void 
}) {
  return (
    <div className="mb-6">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {title}
      </p>
      {items.map((item) => {
        const active = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 hover:translate-x-1"
            style={{
              background: active ? 'var(--accent-glow)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-secondary)',
              border: active ? '1px solid var(--accent)' : '1px solid transparent',
              boxShadow: active ? '0 4px 16px var(--accent-glow)' : 'none',
            }}
          >
            <item.icon className="h-4 w-4" style={{ color: active ? 'var(--accent)' : 'inherit' }} />
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Navigation({ currentView, onViewChange }: Props) {
  return (
    <nav className="w-64 shrink-0 p-4 overflow-y-auto backdrop-blur-2xl transition-colors duration-500"
         style={{ background: 'color-mix(in srgb, var(--bg-secondary) 85%, transparent)', borderRight: '1px solid var(--border)' }}>
      <div className="mb-8 px-3">
        <h1 className="text-xl font-bold tracking-tight" style={{ 
          background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          ForgeOS
        </h1>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>AI Agent Factory v2.0</p>
      </div>
      <Section title="Primary" items={primaryItems} currentView={currentView} onViewChange={onViewChange} />
      <Section title="Platforms" items={platformItems} currentView={currentView} onViewChange={onViewChange} />
      <Section title="Power Trails" items={trailItems} currentView={currentView} onViewChange={onViewChange} />
    </nav>
  );
}
