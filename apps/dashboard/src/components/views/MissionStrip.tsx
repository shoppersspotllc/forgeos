'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/design-system';
import { Send, Sparkles, Loader2, CheckCircle2, AlertCircle, Bot, Square, ShieldCheck } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Mission Command Strip — instruct Muse/MyDots to build autonomously */
/* ------------------------------------------------------------------ */

interface Mission {
  id: string;
  instruction: string;
  platform: string;
  status: 'needs_approval' | 'approved' | 'queued' | 'running' | 'done' | 'failed' | 'stopped';
  plan?: string;
  result?: string;
  creditsEstimated?: number;
  creditsUsed?: number;
  createdAt: string;
}

const TEMPLATES = [
  { label: 'Real estate near me', instruction: 'Create 3 professional websites for real estate agents near me' },
  { label: 'Beauticians in Texas', instruction: 'Create 3 professional websites for beauticians and salons in Texas' },
  { label: 'Restaurants in USA', instruction: 'Create 2 professional websites for restaurants in the USA' },
  { label: 'HVAC in Houston', instruction: 'Create 3 professional websites for HVAC companies in Houston, TX' },
];

export function MissionStrip({ platformId, platformName, platformColor }: {
  platformId: string;
  platformName: string;
  platformColor: string;
}) {
  const [instruction, setInstruction] = useState('');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [sending, setSending] = useState(false);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/young-money/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId, instruction: trimmed }),
      });
      const mission = await res.json();
      setMissions((prev) => [mission, ...prev]);
      setInstruction('');
    } catch {
      // network error — show inline
      setMissions((prev) => [{
        id: `err-${Date.now()}`,
        instruction: trimmed,
        platform: platformId,
        status: 'failed',
        result: 'Could not reach the mission system. Try again.',
        createdAt: new Date().toISOString(),
      }, ...prev]);
    } finally {
      setSending(false);
    }
  };

  const statusIcon = (s: Mission['status']) => {
    if (s === 'done') return <CheckCircle2 className="h-4 w-4" style={{ color: '#10b981' }} />;
    if (s === 'failed') return <AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} />;
    if (s === 'stopped') return <Square className="h-4 w-4" style={{ color: '#ef4444' }} />;
    if (s === 'running' || s === 'queued' || s === 'approved') return <Loader2 className="h-4 w-4 animate-spin" style={{ color: platformColor }} />;
    return <ShieldCheck className="h-4 w-4" style={{ color: '#f59e0b' }} />;
  };

  const statusLabel = (s: Mission['status']) => {
    if (s === 'needs_approval') return 'Waiting for your approval — 0 credits used';
    if (s === 'approved') return 'Approved — starting execution';
    if (s === 'queued') return 'Queued — Muse is picking this up';
    if (s === 'running') return 'Running — Dots are executing';
    if (s === 'done') return 'Done';
    if (s === 'failed') return 'Failed';
    return 'Stopped — 0 credits used';
  };

  const updateStatus = async (id: string, status: Mission['status']) => {
    try {
      const res = await fetch('/api/young-money/missions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const updated = await res.json();
      if (!updated.error) {
        setMissions((prev) => prev.map((m) => (m.id === id ? updated : m)));
      }
    } catch {
      // ignore — status will refresh on next load
    }
  };

  const canStop = (s: Mission['status']) =>
    ['needs_approval', 'approved', 'queued', 'running'].includes(s);

  return (
    <GlassPanel glow={platformColor} className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5" style={{ color: platformColor }} />
        <h3 className="font-extrabold text-base" style={{ color: 'var(--text)' }}>
          Command Muse &amp; MyDots
        </h3>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Type an instruction — Muse and the Dots will research, build with minimum credits,
        deploy professionally, and report live status here.{' '}
        <strong style={{ color: '#f59e0b' }}>Nothing runs until you approve.</strong>{' '}
        The red <strong>Stop</strong> button kills any mission instantly — zero credits used.
      </p>

      {/* Template chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            onClick={() => submit(t.instruction)}
            disabled={sending}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:opacity-80 disabled:opacity-50"
            style={{ background: `${platformColor}18`, border: `1px solid ${platformColor}44`, color: platformColor }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Instruction input */}
      <div className="flex gap-2">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(instruction); }}
          placeholder={`e.g. "Create 3 websites for dentists in Dallas, TX"`}
          disabled={sending}
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none disabled:opacity-50"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <button
          onClick={() => submit(instruction)}
          disabled={sending || !instruction.trim()}
          className="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)`, color: '#fff', border: 'none', cursor: 'pointer' }}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Sending…' : 'Launch'}
        </button>
      </div>

      {/* Mission list */}
      {missions.length > 0 && (
        <div className="mt-4 space-y-2">
          {missions.map((m) => (
            <div key={m.id} className="p-3 rounded-xl text-sm"
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-1">
                {statusIcon(m.status)}
                <span className="font-semibold flex-1" style={{ color: 'var(--text)' }}>{m.instruction}</span>
                {/* Stop switch — always available while mission is active */}
                {canStop(m.status) && (
                  <button
                    onClick={() => updateStatus(m.id, 'stopped')}
                    title="Stop immediately — no credits will be used"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    <Square className="h-3.5 w-3.5" /> Stop
                  </button>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{statusLabel(m.status)}</p>
              {m.plan && <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{m.plan}</p>}
              {m.creditsEstimated !== undefined && (
                <p className="text-xs mt-1 font-semibold" style={{ color: '#f59e0b' }}>
                  Estimated: ~{m.creditsEstimated} credits · Used so far: {m.creditsUsed || 0}
                </p>
              )}
              {m.result && <p className="text-xs mt-1.5 font-semibold" style={{ color: 'var(--text)' }}>{m.result}</p>}

              {/* Approval gate — explicit approve before any credits or platform access */}
              {m.status === 'needs_approval' && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: '#f59e0b0d', border: '1px solid #f59e0b44' }}>
                  <p className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                    <ShieldCheck className="h-4 w-4" /> Approval required
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    Nothing has been built. No credits used. No platforms accessed.
                    Approving lets Muse + Dots use ~{m.creditsEstimated} credits and access {platformName} to build &amp; deploy.
                  </p>
                  <button
                    onClick={() => updateStatus(m.id, 'approved')}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)`, color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Approve &amp; Execute
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
