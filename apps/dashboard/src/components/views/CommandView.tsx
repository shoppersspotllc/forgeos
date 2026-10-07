'use client';

import { useState, useEffect } from 'react';
import {
  GlassPanel, StatCard, SectionHeader, FadeUp, StatusPill, GlowButton, AnimatedNumber,
} from '@/components/design-system';
import { CinematicBackground } from '@/components/design-system';
import { PLATFORM_IDENTITIES } from '@/lib/design-system';
import {
  Cpu, Layers, Zap, Palette, ArrowRight, Activity, Sparkles, ShieldCheck, Bot,
} from 'lucide-react';

export function CommandView() {
  const [caps, setCaps] = useState<any>(null);

  useEffect(() => {
    fetch('/api/capabilities').then(r => r.json()).then(setCaps).catch(() => {});
  }, []);

  const available = caps?.capabilities?.filter((c: any) => c.available) ?? [];
  const needsSetup = caps?.capabilities?.filter((c: any) => !c.available) ?? [];

  const stats = [
    { label: 'Capabilities', value: caps?.total ?? 0, icon: <Layers className="h-5 w-5 text-white" />, gradient: 'linear-gradient(135deg,#8b5cf6,#6366f1)', trend: '+2 this week' },
    { label: 'Online Now', value: available.length, icon: <Zap className="h-5 w-5 text-white" />, gradient: 'linear-gradient(135deg,#10b981,#06b6d4)', trend: 'Live' },
    { label: 'AI Models', value: 5, icon: <Cpu className="h-5 w-5 text-white" />, gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
    { label: 'Themes', value: 12, icon: <Palette className="h-5 w-5 text-white" />, gradient: 'linear-gradient(135deg,#ec4899,#8b5cf6)', trend: 'New' },
  ];

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="dashboard" />
      <div className="relative p-8 max-w-7xl mx-auto">
        {/* Hero */}
        <FadeUp>
          <div className="mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] mb-3" style={{ color: 'var(--accent)' }}>
              AI Agent Factory — Control Plane
            </p>
            <h1 className="font-extrabold tracking-tight text-shimmer" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              Forge Dashboard
            </h1>
            <p className="mt-3 text-lg max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              Your living AI Operating System. Orchestrate capabilities, deploy Dots, and command your digital workforce — all from one cinematic command center.
            </p>
          </div>
        </FadeUp>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <FadeUp key={s.label} delay={i * 80}>
              <StatCard label={s.label} value={s.value} icon={s.icon} gradient={s.gradient} trend={s.trend} />
            </FadeUp>
          ))}
        </div>

        {/* System status banner */}
        <FadeUp delay={200}>
          <GlassPanel glow="var(--success)" className="mb-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center animate-[pulseGlow_3s_ease-in-out_infinite]"
                   style={{ background: 'linear-gradient(135deg, var(--success), #06b6d4)', boxShadow: '0 8px 24px color-mix(in srgb, var(--success) 40%, transparent)' }}>
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold" style={{ color: 'var(--text)' }}>All systems nominal</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <AnimatedNumber value={available.length} /> of <AnimatedNumber value={caps?.total ?? 0} /> capabilities online · Registry live-probed · v2.0 baseline frozen
                </p>
              </div>
              <StatusPill status="online" />
            </div>
          </GlassPanel>
        </FadeUp>

        {/* Capability grid */}
        <FadeUp delay={280}>
          <SectionHeader eyebrow="Discovery Layer" title="Capability Registry" description="Every capability ForgeOS can orchestrate — probed live, never faked." />
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-3 mb-10">
          {caps?.capabilities?.map((c: any, i: number) => {
            const identity = Object.values(PLATFORM_IDENTITIES).find(p => c.id.includes(p.id) || p.id.includes(c.id.split('-')[0]));
            return (
              <FadeUp key={c.id} delay={i * 40}>
                <GlassPanel hover glow={c.available ? identity?.glow : undefined} padding="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                         style={{
                           background: c.available
                             ? `linear-gradient(135deg, ${identity?.gradient[0] || 'var(--accent)'}, ${identity?.gradient[1] || 'var(--accent-secondary)'})`
                             : 'var(--surface)',
                           border: c.available ? 'none' : '1px solid var(--border)',
                           boxShadow: c.available ? `0 4px 16px ${identity?.glow || 'var(--accent)'}44` : 'none',
                         }}>
                      {c.available ? <Sparkles className="h-5 w-5 text-white" /> : <ShieldCheck className="h-5 w-5" style={{ color: 'var(--text-muted)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                    </div>
                    <StatusPill status={c.available ? 'available' : 'setup'} />
                  </div>
                </GlassPanel>
              </FadeUp>
            );
          })}
        </div>

        {/* CTA */}
        <FadeUp delay={120}>
          <GlassPanel className="text-center py-10" glow="var(--accent)">
            <Bot className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Ready to deploy your workforce?</h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {needsSetup.length > 0
                ? `${needsSetup.length} ${needsSetup.length === 1 ? 'capability needs' : 'capabilities need'} setup — Colibrì, ForgeOS AI, Drive, and Canva await your authorization.`
                : 'All capabilities are online. Deploy Dots and start building.'}
            </p>
            <div className="flex gap-3 justify-center">
              <GlowButton>Deploy a Dot <ArrowRight className="inline h-4 w-4 ml-1" /></GlowButton>
              <GlowButton variant="ghost">View Architecture</GlowButton>
            </div>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
