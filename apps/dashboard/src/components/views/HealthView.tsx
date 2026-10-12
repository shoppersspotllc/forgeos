'use client';

import { useState, useEffect } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, CinematicBackground, StatusPill, AnimatedNumber,
} from '@/components/design-system';
import { HeartPulse, Server, Cpu, Zap, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ServiceStatus {
  name: string;
  endpoint: string;
  online: boolean;
  latencyMs?: number;
  detail?: string;
}

export function HealthView() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const checks: { name: string; endpoint: string }[] = [
      { name: 'ForgeOS AI Gateway', endpoint: '/api/forgeos-ai/health' },
      { name: 'Capabilities Registry', endpoint: '/api/capabilities' },
      { name: 'Task Engine', endpoint: '/api/tasks' },
      { name: 'Colibrì (Local AI)', endpoint: '/api/colibri/status' },
      { name: "God's Eye", endpoint: '/api/godseye/status' },
    ];

    const results = await Promise.all(
      checks.map(async (c) => {
        const start = performance.now();
        try {
          // God's Eye is served from the same origin via rewrite (/gods-eye).
          // Probe it directly from the browser — no Tailscale, no PC needed.
          if (c.endpoint === '/api/godseye/status') {
            await fetch('/gods-eye/', {
              mode: 'no-cors',
              signal: AbortSignal.timeout(8000),
            });
            return {
              name: c.name,
              endpoint: c.endpoint,
              online: true,
              latencyMs: Math.round(performance.now() - start),
            } as ServiceStatus;
          }
          const res = await fetch(c.endpoint, { signal: AbortSignal.timeout(8000) });
          const latency = Math.round(performance.now() - start);
          const data = await res.json().catch(() => ({}));
          // Normalize different API response shapes
          const online = res.ok && (
            data.online === true ||
            data.reachable === true ||
            data.status === 'ok' ||
            Array.isArray(data.capabilities) ||
            Array.isArray(data.tasks) ||
            data.online === undefined // endpoint responded OK
          );
          return {
            name: c.name,
            endpoint: c.endpoint,
            online,
            latencyMs: latency,
            detail: data.version ? `v${data.version}` : undefined,
          } as ServiceStatus;
        } catch {
          return { name: c.name, endpoint: c.endpoint, online: false } as ServiceStatus;
        }
      })
    );

    setServices(results);
    setLastCheck(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { checkHealth(); }, []);

  const onlineCount = services.filter(s => s.online).length;
  const totalCount = services.length;
  const healthPct = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;
  const avgLatency = services.filter(s => s.latencyMs).reduce((a, s) => a + (s.latencyMs || 0), 0) /
    Math.max(services.filter(s => s.latencyMs).length, 1);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="health" />
      <div className="relative p-4 sm:p-8 max-w-5xl mx-auto">
        <FadeUp>
          <div className="flex items-start justify-between gap-4 mb-2">
            <SectionHeader
              eyebrow="System Status"
              title="Health"
              description="Live probes of every ForgeOS service. No cached values — every check is real-time."
              accent="#34d399"
            />
            <button
              onClick={() => checkHealth(true)}
              disabled={refreshing}
              className="shrink-0 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 min-h-[44px]"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Checking...' : 'Re-check'}</span>
            </button>
          </div>
        </FadeUp>

        {/* Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Services Online', value: onlineCount, suffix: `/${totalCount}`, icon: Server, color: onlineCount === totalCount ? 'var(--success)' : 'var(--warning)' },
            { label: 'Health Score', value: healthPct, suffix: '%', icon: HeartPulse, color: healthPct >= 80 ? 'var(--success)' : healthPct >= 50 ? 'var(--warning)' : 'var(--error)' },
            { label: 'Avg Latency', value: Math.round(avgLatency), suffix: 'ms', icon: Zap, color: 'var(--accent)' },
            { label: 'Last Check', value: lastCheck ? lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--', icon: Cpu, color: 'var(--text-secondary)', isText: true },
          ].map((s, i) => (
            <FadeUp key={s.label} delay={i * 70}>
              <GlassPanel>
                <s.icon className="h-5 w-5 mb-3" style={{ color: s.color }} />
                {s.isText ? (
                  <p className="text-lg font-extrabold font-mono" style={{ color: 'var(--text)' }}>{s.value}</p>
                ) : (
                  <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
                    <AnimatedNumber value={s.value as number} /><span className="text-lg">{s.suffix}</span>
                  </p>
                )}
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </GlassPanel>
            </FadeUp>
          ))}
        </div>

        {/* Service list */}
        <FadeUp delay={150}>
          <h3 className="font-bold mb-3 text-sm sm:text-base" style={{ color: 'var(--text)' }}>
            Service Status
          </h3>
        </FadeUp>
        <div className="space-y-2">
          {services.map((s, i) => (
            <FadeUp key={s.name} delay={180 + i * 40}>
              <GlassPanel padding="p-3 sm:p-4" hover>
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{
                          background: s.online ? 'var(--success)' : 'var(--error)',
                          boxShadow: s.online ? '0 0 8px var(--success)' : '0 0 8px var(--error)',
                        }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {s.name}
                    </p>
                    <p className="text-[11px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                      {s.endpoint}{s.detail ? ` · ${s.detail}` : ''}
                    </p>
                  </div>
                  {s.latencyMs !== undefined && s.online && (
                    <span className="text-xs font-mono hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                      {s.latencyMs}ms
                    </span>
                  )}
                  <StatusPill status={s.online ? 'online' : 'offline'} />
                </div>
              </GlassPanel>
            </FadeUp>
          ))}
        </div>

        {onlineCount < totalCount && (
          <FadeUp delay={300}>
            <GlassPanel className="mt-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {totalCount - onlineCount} service{totalCount - onlineCount > 1 ? 's' : ''} offline.
                Check that local services (Colibrì/Ollama, God's Eye) are running on your workstation.
              </p>
            </GlassPanel>
          </FadeUp>
        )}

        {onlineCount === totalCount && totalCount > 0 && (
          <FadeUp delay={300}>
            <GlassPanel className="mt-6 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'var(--success)' }} />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                All systems operational.
              </p>
            </GlassPanel>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
