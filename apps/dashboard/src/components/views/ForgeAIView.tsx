'use client';

import { useState, useEffect } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, StatusPill, CinematicBackground, AnimatedNumber,
} from '@/components/design-system';
import { Brain, Server, KeyRound, AlertTriangle, CheckCircle2, RefreshCw, Network } from 'lucide-react';

interface ProviderStatus {
  id: string;
  label: string;
  state: string;
  local: boolean;
  configured: boolean;
  lastCheck: string | null;
  latencyMs: number | null;
  modelCount: number;
  error: string | null;
}

const STATE_META: Record<string, { color: string; bg: string; label: string }> = {
  CONNECTED: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)', label: 'Connected' },
  DEGRADED: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', label: 'Degraded' },
  NEEDS_CONFIGURATION: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', label: 'Needs configuration' },
  VERIFYING: { color: 'var(--accent)', bg: 'var(--accent-glow)', label: 'Verifying' },
  OFFLINE: { color: 'var(--text-muted)', bg: 'var(--surface)', label: 'Offline' },
  TIMEOUT: { color: 'var(--error)', bg: 'color-mix(in srgb, var(--error) 12%, transparent)', label: 'Timeout' },
};

export function ForgeAIView() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [gatewayOnline, setGatewayOnline] = useState(false);

  const load = async () => {
    try {
      const [h, p] = await Promise.all([
        fetch('/api/forgeos-ai/health').then(r => r.json()),
        fetch('/api/forgeos-ai/providers').then(r => r.json()),
      ]);
      setHealth(h);
      setProviders(p.providers || []);
      setGatewayOnline(true);
    } catch {
      setGatewayOnline(false);
    }
  };

  const runChecks = async () => {
    setChecking(true);
    try {
      await fetch('/api/forgeos-ai/providers/check', { method: 'POST' });
      await load();
    } catch { /* keep old state */ }
    setChecking(false);
  };

  useEffect(() => { load(); }, []);

  const connected = providers.filter(p => p.state === 'CONNECTED').length;

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="forgeai" />
      <div className="relative p-8 max-w-7xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Intelligence Core"
            title="ForgeOS AI"
            description="The canonical model gateway — every Dot, agent, and application routes intelligence through here. Single provider abstraction, capability-aware routing, graceful fallback."
            accent="#a855f7"
          />
        </FadeUp>

        {/* Gateway status */}
        <FadeUp delay={80}>
          <GlassPanel glow={gatewayOnline ? 'var(--success)' : 'var(--error)'} className="mb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg,#8b5cf6,#d946ef)', boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}>
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold" style={{ color: 'var(--text)' }}>
                  Gateway {gatewayOnline ? `— ${health?.status || 'UNKNOWN'}` : '— Offline'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {gatewayOnline
                    ? `${connected} of ${providers.length} providers connected · v${health?.version || '2.0.0'} · OpenAI-compatible endpoint`
                    : 'The ForgeOS AI gateway is not running on this machine.'}
                </p>
              </div>
              <StatusPill status={gatewayOnline ? (connected > 0 ? 'online' : 'busy') : 'offline'} />
              {gatewayOnline && (
                <button onClick={runChecks} disabled={checking}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Checking…' : 'Health check'}
                </button>
              )}
            </div>
          </GlassPanel>
        </FadeUp>

        {!gatewayOnline ? (
          <FadeUp delay={120}>
            <GlassPanel className="text-center py-12">
              <Server className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Gateway not running</h3>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Start the ForgeOS AI gateway to enable the provider layer:<br />
                <code className="text-xs px-2 py-1 rounded mt-2 inline-block" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  cd ~/workspace/forgeos/services/forgeos-ai && npm start
                </code>
              </p>
            </GlassPanel>
          </FadeUp>
        ) : (
          <>
            {/* Architecture flow */}
            <FadeUp delay={120}>
              <GlassPanel className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--text-muted)' }}>
                  <Network className="inline h-3.5 w-3.5 mr-1" /> Intelligence Flow
                </p>
                <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                  {['USER', 'MUSE', 'RUFLO', 'REGISTRY', 'FORGEOS AI', 'PROVIDER', 'DOT'].map((s, i, arr) => (
                    <span key={s} className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg"
                            style={{
                              background: s === 'FORGEOS AI' ? 'linear-gradient(135deg,#8b5cf6,#d946ef)' : 'var(--surface)',
                              border: '1px solid var(--border)',
                              color: s === 'FORGEOS AI' ? '#fff' : 'var(--text-secondary)',
                            }}>{s}</span>
                      {i < arr.length - 1 && <span style={{ color: 'var(--accent)' }}>→</span>}
                    </span>
                  ))}
                </div>
              </GlassPanel>
            </FadeUp>

            {/* Provider cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {providers.map((p, i) => {
                const meta = STATE_META[p.state] || STATE_META.OFFLINE;
                return (
                  <FadeUp key={p.id} delay={i * 60}>
                    <GlassPanel hover>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold" style={{ color: 'var(--text)' }}>{p.label}</h3>
                          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{p.id}{p.local ? ' · local' : ''}</p>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="rounded-lg py-2" style={{ background: 'var(--surface)' }}>
                          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                            {p.latencyMs != null ? `${p.latencyMs}ms` : '—'}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Latency</p>
                        </div>
                        <div className="rounded-lg py-2" style={{ background: 'var(--surface)' }}>
                          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}><AnimatedNumber value={p.modelCount} /></p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Models</p>
                        </div>
                        <div className="rounded-lg py-2" style={{ background: 'var(--surface)' }}>
                          <p className="text-sm font-bold" style={{ color: p.configured ? 'var(--success)' : 'var(--warning)' }}>
                            {p.configured ? <CheckCircle2 className="h-4 w-4 inline" /> : <KeyRound className="h-4 w-4 inline" />}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{p.configured ? 'Key set' : 'No key'}</p>
                        </div>
                      </div>
                      {p.error && (
                        <p className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                          {p.error}
                        </p>
                      )}
                    </GlassPanel>
                  </FadeUp>
                );
              })}
            </div>

            <FadeUp delay={200}>
              <p className="text-xs mt-6 text-center" style={{ color: 'var(--text-muted)' }}>
                Credentials are never displayed or transmitted. Add a provider key via <code>FORGEOS_&lt;ID&gt;_KEY</code> env var or <code>secrets/&lt;id&gt;.env</code> — then run a health check.
              </p>
            </FadeUp>
          </>
        )}
      </div>
    </div>
  );
}
