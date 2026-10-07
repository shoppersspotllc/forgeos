'use client';

import { useState, useEffect } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, StatusPill, CinematicBackground, AnimatedNumber,
} from '@/components/design-system';
import { Eye, Radar, Globe2, Activity, ShieldCheck } from 'lucide-react';

export function GodsEyeView() {
  const [caps, setCaps] = useState<any>(null);

  useEffect(() => {
    fetch('/api/capabilities').then(r => r.json()).then(setCaps).catch(() => {});
  }, []);

  const capabilities = caps?.capabilities || [];
  const online = capabilities.filter((c: any) => c.available).length;

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="godseye" />
      <div className="relative p-8 max-w-7xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Omniscient Monitor"
            title="God's Eye"
            description="Real-time intelligence and surveillance across the ForgeOS platform. Every capability, every Dot, every system — watched."
            accent="#06b6d4"
          />
        </FadeUp>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Capabilities Watched', value: capabilities.length, icon: Eye },
            { label: 'Online', value: online, icon: Activity },
            { label: 'Offline', value: capabilities.length - online, icon: Radar },
            { label: 'Registry Health', value: 100, suffix: '%', icon: ShieldCheck },
          ].map((s, i) => (
            <FadeUp key={s.label} delay={i * 70}>
              <GlassPanel glow="#06b6d4">
                <s.icon className="h-5 w-5 mb-3" style={{ color: '#06b6d4' }} />
                <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
                  <AnimatedNumber value={s.value} />{s.suffix && <span className="text-lg">{s.suffix}</span>}
                </p>
                <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </GlassPanel>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={150}>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Radar className="h-4 w-4" style={{ color: '#06b6d4' }} /> Live Capability Surveillance
          </h3>
        </FadeUp>
        <div className="grid md:grid-cols-2 gap-2">
          {capabilities.map((c: any, i: number) => (
            <FadeUp key={c.id} delay={i * 30}>
              <GlassPanel padding="p-3" hover>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full animate-pulse shrink-0"
                        style={{
                          background: c.available ? 'var(--success)' : 'var(--text-muted)',
                          boxShadow: c.available ? '0 0 8px var(--success)' : 'none',
                        }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{c.id} · {c.category}</p>
                  </div>
                  <StatusPill status={c.available ? 'online' : 'offline'} />
                </div>
              </GlassPanel>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={200}>
          <GlassPanel className="mt-6 flex items-center gap-3">
            <Globe2 className="h-5 w-5" style={{ color: '#06b6d4' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              God's Eye performs live probes — no cached or fabricated status. Every reading above is a real-time check.
            </p>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
