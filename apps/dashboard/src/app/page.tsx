'use client';

import { useState, useEffect } from 'react';
import { Navigation, View, MobileMenuButton } from '@/components/Navigation';
import { ColibriView } from '@/components/views/ColibriView';
import { CanvaView } from '@/components/views/CanvaView';
import { CommandView } from '@/components/views/CommandView';
import { MyDotsView } from '@/components/views/MyDotsView';
import { TasksView } from '@/components/views/TasksView';
import { ForgeAIView } from '@/components/views/ForgeAIView';
import { YoungMoneyView } from '@/components/views/YoungMoneyView';
import { GitHubView } from '@/components/views/GitHubView';
import { TerminalView } from '@/components/views/TerminalView';
import { LocalTerminal } from '@/components/views/LocalTerminal';
import { GodsEyeView } from '@/components/views/GodsEyeView';
import { PositionAIView } from '@/components/views/PositionAIView';
import { ChromeView } from '@/components/views/ChromeView';
import { MediaEngineView } from '@/components/views/MediaEngineView';
import { HealthView } from '@/components/views/HealthView';
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

export default function Home() {
  const [view, setView] = useState<View>('command');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  // Close mobile nav on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderView = () => {
    switch (view) {
      case 'command': return <CommandView />;
      case 'mydots': return <MyDotsView />;
      case 'tasks': return <TasksView />;
      case 'colibri': return <ColibriView />;
      case 'canva': return <CanvaView />;
      case 'youngmoney': return <YoungMoneyView />;
      case 'godseye': return <GodsEyeView />;
      case 'positionai': return <PositionAIView />;
      case 'forgeai': return <ForgeAIView />;
      case 'mediaengine': return <MediaEngineView />;
      case 'health': return <HealthView />;
      case 'opencode': return <LocalTerminal worker="opencode" sessionId="forgeos-opencode" />;
      case 'claude': return <LocalTerminal worker="claude" sessionId="forgeos-claude" />;
      case 'chrome': return <ChromeView />;
      case 'github': return <GitHubView />;
      default: return <CommandView />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-500" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Navigation
        currentView={view}
        onViewChange={setView}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <main className="flex-1 overflow-y-auto relative min-w-0">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 p-3 sm:p-4 backdrop-blur-xl" style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)', borderBottom: '1px solid var(--border)' }}>
          <MobileMenuButton onClick={() => setMobileNavOpen(true)} />
          <div className="flex-1 lg:hidden" />
          <ThemeSwitcher />
        </div>
        {renderView()}
      </main>
    </div>
  );
}
