'use client';

import { useState } from 'react';
import { GlassPanel } from '@/components/design-system';
import { Send, Sparkles, Loader2, CheckCircle2, AlertCircle, Bot } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Mission Command Strip — instruct Muse/MyDots to build autonomously */
/* ------------------------------------------------------------------ */

interface Mission {
  id: string;
  instruction: string;
  platform: string;
  status: 'queued' | 'running' | 'done' | 'failed' | 'needs_approval';
  plan?: string;
  result?: string;
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
    if (s === 'running' || s === 'queued') return <Loader2 className="h-4 w-4 animate-spin" style={{ color: platformColor }} />;
    return <Bot className="h-4 w-4" style={{ color: '#f59e0b' }} />;
  };

  const statusLabel = (s: Mission['status']) => {
    if (s === 'queued') return 'Queued — Muse is picking this up';
    if (s === 'running') return 'Running — Dots are executing';
    if (s === 'done') return 'Done';
    if (s === 'failed') return 'Failed';
    return 'Needs your approval';
  };

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
        deploy professionally, and report live status here. No human steps needed after you send.
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
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{m.instruction}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{statusLabel(m.status)}</p>
              {m.plan && <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>{m.plan}</p>}
              {m.result && <p className="text-xs mt-1.5 font-semibold" style={{ color: 'var(--text)' }}>{m.result}</p>}
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}
