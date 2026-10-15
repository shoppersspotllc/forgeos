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

  // Provider Hub (desktop gateway management) — admin token lives in memory only.
  const [adminToken, setAdminToken] = useState('');
  const [hubOnline, setHubOnline] = useState(false);
  const [hubBusy, setHubBusy] = useState(false);
  const [hubError, setHubError] = useState<string | null>(null);
  const [hubProviders, setHubProviders] = useState<any[]>([]);
  const [keyInput, setKeyInput] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, string | boolean>>({});
  const [hubMsg, setHubMsg] = useState<Record<string, string>>({});
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [issuedKey, setIssuedKey] = useState<{ key: string; keyId: string; name: string } | null>(null);

  const adminFetch = async (path: string, method = 'GET', body?: any) => {
    const res = await fetch(`/api/forgeos-ai/admin/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  };

  const setOpBusy = (id: string, op: string | boolean) =>
    setBusy(prev => ({ ...prev, [id]: op }));

  const connectHub = async () => {
    setHubBusy(true);
    setHubError(null);
    try {
      const data = await adminFetch('providers');
      setHubProviders(data.providers || []);
      const keys = await adminFetch('keys');
      setApiKeys(keys.keys || []);
      setHubOnline(true);
    } catch (e: any) {
      setHubError(e.message || 'Could not reach the provider hub');
      setHubOnline(false);
    }
    setHubBusy(false);
  };

  const refreshHubProviders = async () => {
    try {
      const data = await adminFetch('providers');
      setHubProviders(data.providers || []);
    } catch { /* keep old state */ }
  };

  const saveCredential = async (id: string) => {
    const credential = (keyInput[id] || '').trim();
    if (!credential) return;
    setOpBusy(id, 'save');
    setHubMsg(prev => ({ ...prev, [id]: '' }));
    try {
      await adminFetch(`providers/${encodeURIComponent(id)}/credential`, 'POST', { credential });
      setKeyInput(prev => ({ ...prev, [id]: '' }));
      setHubMsg(prev => ({ ...prev, [id]: 'Key saved securely. Run Test to validate.' }));
      await refreshHubProviders();
    } catch (e: any) {
      setHubMsg(prev => ({ ...prev, [id]: '' }));
      setHubError(e.message);
    }
    setOpBusy(id, false);
  };

  const testProvider = async (id: string) => {
    setOpBusy(id, 'test');
    try {
      const data = await adminFetch(`providers/${encodeURIComponent(id)}/test`, 'POST');
      setHubProviders(prev => prev.map(p => (p.id === id ? { ...p, ...data.provider } : p)));
      setHubMsg(prev => ({ ...prev, [id]: `Test complete: ${data.provider.state}` }));
    } catch (e: any) {
      setHubError(e.message);
    }
    setOpBusy(id, false);
  };

  const toggleProvider = async (id: string, enable: boolean) => {
    setOpBusy(id, true);
    try {
      await adminFetch(`providers/${encodeURIComponent(id)}/${enable ? 'enable' : 'disable'}`, 'POST');
      await refreshHubProviders();
    } catch (e: any) {
      setHubError(e.message);
    }
    setOpBusy(id, false);
  };

  const createApiKey = async () => {
    const name = newKeyName.trim();
    if (!name) return;
    setOpBusy('newkey', true);
    try {
      const data = await adminFetch('keys', 'POST', { name });
      setIssuedKey({ key: data.key, keyId: data.keyId, name: data.name });
      setNewKeyName('');
      const keys = await adminFetch('keys');
      setApiKeys(keys.keys || []);
    } catch (e: any) {
      setHubError(e.message);
    }
    setOpBusy('newkey', false);
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      await adminFetch(`keys/${encodeURIComponent(keyId)}/revoke`, 'POST');
      const keys = await adminFetch('keys');
      setApiKeys(keys.keys || []);
    } catch (e: any) {
      setHubError(e.message);
    }
  };

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
      // Use the /check response directly — it contains fresh health states.
      // Do NOT re-fetch from /providers: serverless function isolation means
      // the /providers route has a separate pool instance with stale state.
      const res = await fetch('/api/forgeos-ai/providers/check', { method: 'POST' });
      const data = await res.json();
      if (data.providers && Array.isArray(data.providers)) {
        setProviders(data.providers);
        setGatewayOnline(true);
      } else {
        await load(); // fallback to full reload if check response is unexpected
      }
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
                Provider keys can be added below in the Provider Hub, or via <code>FORGEOS_&lt;ID&gt;_KEY</code> env var / <code>secrets/&lt;id&gt;.env</code> on the gateway host.
              </p>
            </FadeUp>

            {/* Provider Hub — credential management, testing, API keys (desktop gateway) */}
            <FadeUp delay={240}>
              <GlassPanel className="mt-8">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Provider Hub</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Add provider credentials, test connections, and issue ForgeOS API keys.
                      Managed through the desktop gateway — credentials never leave the server.
                    </p>
                  </div>
                  <StatusPill status={hubOnline ? 'online' : 'offline'} />
                </div>

                {!hubOnline ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      value={adminToken}
                      onChange={e => setAdminToken(e.target.value)}
                      placeholder="Admin token (FORGEOS_ADMIN_TOKEN)"
                      className="flex-1 min-w-[220px] px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    />
                    <button onClick={connectHub} disabled={hubBusy || !adminToken}
                            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#8b5cf6,#d946ef)', color: '#fff' }}>
                      {hubBusy ? 'Connecting…' : 'Connect'}
                    </button>
                    {hubError && <p className="w-full text-xs" style={{ color: 'var(--error)' }}>{hubError}</p>}
                    {!hubError && (
                      <p className="w-full text-xs" style={{ color: 'var(--text-muted)' }}>
                        The desktop gateway must be running. The admin token is kept in memory for this session only.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {hubProviders.map(p => (
                        <div key={p.id} className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{p.label}</span>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                    style={{
                                      background: p.enabled ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'var(--surface)',
                                      color: p.enabled ? 'var(--success)' : 'var(--text-muted)',
                                      border: '1px solid var(--border)',
                                    }}>
                                {p.enabled ? (STATE_META[p.state]?.label || p.state) : 'Disabled'}
                              </span>
                              {!p.configured && p.requiresKey !== false && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--warning) 12%, transparent)', color: 'var(--warning)' }}>
                                  No key
                                </span>
                              )}
                            </div>
                            <button onClick={() => toggleProvider(p.id, !p.enabled)} disabled={!!busy[p.id]}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                              {p.enabled ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="password"
                              value={keyInput[p.id] || ''}
                              onChange={e => setKeyInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                              placeholder={`Paste ${p.label} API key`}
                              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg text-sm"
                              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                            />
                            <button onClick={() => saveCredential(p.id)} disabled={!!busy[p.id] || !(keyInput[p.id] || '').trim()}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#d946ef)', color: '#fff' }}>
                              {busy[p.id] === 'save' ? 'Saving…' : 'Save key'}
                            </button>
                            <button onClick={() => testProvider(p.id)} disabled={!!busy[p.id]}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                              {busy[p.id] === 'test' ? 'Testing…' : 'Test'}
                            </button>
                          </div>
                          {p.error && <p className="text-xs mt-1.5" style={{ color: 'var(--warning)' }}>{p.error}</p>}
                          {hubMsg[p.id] && <p className="text-xs mt-1.5" style={{ color: 'var(--success)' }}>{hubMsg[p.id]}</p>}
                        </div>
                      ))}
                    </div>

                    {/* ForgeOS API keys */}
                    <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <h4 className="font-bold text-sm mb-1" style={{ color: 'var(--text)' }}>
                        <KeyRound className="inline h-4 w-4 mr-1" /> ForgeOS API Keys
                      </h4>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                        One key authenticates an app or Dot to ForgeOS AI — it never needs upstream provider keys.
                        Keys are stored as hashes only; the plaintext is shown once.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <input
                          value={newKeyName}
                          onChange={e => setNewKeyName(e.target.value)}
                          placeholder="Consumer name (e.g. Scout / God's Eye)"
                          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg text-sm"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                        />
                        <button onClick={createApiKey} disabled={!!busy['newkey'] || !newKeyName.trim()}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg,#8b5cf6,#d946ef)', color: '#fff' }}>
                          {busy['newkey'] ? 'Creating…' : 'Create API key'}
                        </button>
                      </div>
                      {issuedKey && (
                        <div className="rounded-lg p-3 mb-3" style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', border: '1px solid var(--success)' }}>
                          <p className="text-xs font-bold mb-1" style={{ color: 'var(--success)' }}>
                            Key created — copy it now, it will never be shown again:
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs font-mono break-all px-2 py-1 rounded" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                              {issuedKey.key}
                            </code>
                            <button onClick={() => { navigator.clipboard?.writeText(issuedKey.key).catch(() => {}); }}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
                                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                              Copy
                            </button>
                            <button onClick={() => setIssuedKey(null)}
                                    className="text-xs px-2 py-1.5 rounded-lg shrink-0" style={{ color: 'var(--text-muted)' }}>
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {apiKeys.map(k => (
                          <div key={k.keyId} className="flex items-center justify-between gap-2 text-xs px-2 py-1.5 rounded-lg"
                               style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text)' }}>
                              <span className="font-semibold">{k.name}</span>
                              <span className="font-mono ml-2" style={{ color: 'var(--text-muted)' }}>{k.keyId.slice(0, 12)}…</span>
                              {k.revoked && <span className="ml-2 px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--error) 12%, transparent)', color: 'var(--error)' }}>revoked</span>}
                            </span>
                            {!k.revoked && (
                              <button onClick={() => revokeApiKey(k.keyId)}
                                      className="font-semibold px-2.5 py-1 rounded-lg hover:scale-105 transition-all"
                                      style={{ border: '1px solid var(--error)', color: 'var(--error)' }}>
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                        {apiKeys.length === 0 && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No API keys issued yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </GlassPanel>
            </FadeUp>
            {/* Unified API reference */}
            <FadeUp delay={280}>
              <GlassPanel className="mt-8">
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>Unified API</h3>
                <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                  One stable interface for apps, Dots, and agents. Consumers authenticate with a ForgeOS API key —
                  they never need upstream provider keys. ForgeOS AI selects the provider behind the scenes.
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-muted)' }}>BASE URL</p>
                    <code className="font-mono break-all" style={{ color: 'var(--text)' }}>
                      {typeof window !== 'undefined' ? window.location.origin : ''}
                    </code>
                    <p className="font-bold mt-3 mb-1" style={{ color: 'var(--text-muted)' }}>ENDPOINT</p>
                    <code className="font-mono" style={{ color: 'var(--text)' }}>POST /api/forgeos-ai/chat</code>
                    <p className="font-bold mt-3 mb-1" style={{ color: 'var(--text-muted)' }}>AUTHENTICATION</p>
                    <code className="font-mono" style={{ color: 'var(--text)' }}>Authorization: Bearer fk_…</code>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                      Issue keys in the Provider Hub above. Limit: 60 requests/min per key.
                    </p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-muted)' }}>EXAMPLE REQUEST</p>
                    <pre className="font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-all"
                         style={{ color: 'var(--text)' }}>
{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/forgeos-ai/chat \\
  -H "Authorization: Bearer fk_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`}
                    </pre>
                    <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                      <code>model</code>: <code>auto</code> (router picks) or a specific model. Optional:{' '}
                      <code>capability</code> (chat/coding/fast), <code>temperature</code>. Failed providers fall back
                      automatically; if all fail you get an honest error — never a fabricated reply.
                    </p>
                  </div>
                </div>
              </GlassPanel>
            </FadeUp>
          </>
        )}
      </div>
    </div>
  );
}
