'use client';

import { useState, useEffect } from 'react';
import { Navigation, View } from '@/components/Navigation';
import { ColibriView } from '@/components/views/ColibriView';
import { CanvaView } from '@/components/views/CanvaView';
import { CommandView } from '@/components/views/CommandView';
import { MyDotsView } from '@/components/views/MyDotsView';
import { ForgeAIView } from '@/components/views/ForgeAIView';
import { YoungMoneyView } from '@/components/views/YoungMoneyView';
import { GitHubView } from '@/components/views/GitHubView';
import { TerminalView } from '@/components/views/TerminalView';
import { LocalTerminal } from '@/components/views/LocalTerminal';
import { GodsEyeView } from '@/components/views/GodsEyeView';
import { PositionAIView } from '@/components/views/PositionAIView';
import { ChromeView } from '@/components/views/ChromeView';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Terminal, DollarSign, Eye, Crosshair, Sparkles, HeartPulse, Palette, Globe, GitBranch, Code2 } from 'lucide-react';

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={`rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.01] ${className}`}
      style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {children}
    </div>
  );
}

function PlaceholderView({ title, description, icon: Icon }: { title: string; description: string; icon: any }) {
  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
             style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', boxShadow: '0 8px 24px var(--accent-glow)' }}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>{title}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{description}</p>
        </div>
      </div>
      <GlassCard className="text-center py-12">
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>ForgeOS v2.0 — Cinematic Edition</p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Full implementation staged for this view.</p>
      </GlassCard>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>('command');

  const renderView = () => {
    switch (view) {
      case 'command': return <CommandView />;
      case 'mydots': return <MyDotsView />;
      case 'colibri': return <ColibriView />;
      case 'canva': return <CanvaView />;
      case 'youngmoney': return <YoungMoneyView />;
      case 'godseye': return <GodsEyeView />;
      case 'positionai': return <PositionAIView />;
      case 'forgeai': return <ForgeAIView />;
      case 'mediaengine': return <PlaceholderView title="Media Engine" description="Media generation pipeline" icon={Palette} />;
      case 'health': return <PlaceholderView title="Health" description="System health matrix" icon={HeartPulse} />;
      case 'opencode': return <LocalTerminal worker="opencode" sessionId="forgeos-opencode" />;
      case 'claude': return <LocalTerminal worker="claude" sessionId="forgeos-claude" />;
      case 'chrome': return <ChromeView />;
      case 'github': return <GitHubView />;
      default: return <CommandView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-500" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navigation currentView={view} onViewChange={setView} />
      <main className="flex-1 overflow-y-auto relative">
        <div className="sticky top-0 z-20 flex justify-end p-4 backdrop-blur-xl" style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)', borderBottom: '1px solid var(--border)' }}>
          <ThemeSwitcher />
        </div>
        {renderView()}
      </main>
    </div>
  );
}
