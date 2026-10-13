'use client';

import { useState, useRef, useEffect } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, BotAvatar, StatusPill, CinematicBackground,
} from '@/components/design-system';
import { Send, Loader2, X, BarChart3, Rocket } from 'lucide-react';

interface Dot {
  name: string;
  emoji: string;
  role: string;
  specialty: string;
  status: 'online' | 'busy' | 'offline' | 'unknown';
  // Verified task counts / reliability do not exist yet (2026-10-12).
  // Null renders "No verified data yet" instead of fictional numbers.
  tasksCompleted: number | null;
  performance: number | null;
  capability: string;
}

const DOTS: Dot[] = [
  // NOTE (2026-10-12): tasksCompleted/performance were hardcoded literals,
  // not measurements. Set to null until the Governor provides verified counts.
  // Statuses are 'unknown' (no liveness source) except Scout, which has a
  // proven browser-execution path (vertical slice).
  { name: 'Scout', emoji: '🔍', role: 'Research Specialist', specialty: 'Market intelligence & discovery', status: 'online', tasksCompleted: null, performance: null, capability: 'chat' },
  { name: 'Analyst', emoji: '📊', role: 'Data Analyst', specialty: 'Deep analysis & insights', status: 'unknown', tasksCompleted: null, performance: null, capability: 'chat' },
  { name: 'Craftsman', emoji: '🔨', role: 'Build Engineer', specialty: 'Implementation & construction', status: 'unknown', tasksCompleted: null, performance: null, capability: 'coding' },
  { name: 'Hunter', emoji: '🎯', role: 'Outreach Specialist', specialty: 'Lead engagement & conversion', status: 'unknown', tasksCompleted: null, performance: null, capability: 'chat' },
  { name: 'Shepherd', emoji: '🐑', role: 'Relationship Manager', specialty: 'Nurturing & follow-up', status: 'unknown', tasksCompleted: null, performance: null, capability: 'chat' },
  { name: 'Closer', emoji: '💰', role: 'Deal Closer', specialty: 'Final conversion & revenue', status: 'unknown', tasksCompleted: null, performance: null, capability: 'chat' },
];

interface Message {
  role: 'user' | 'dot';
  content: string;
  provider?: string;
}

function DotChat({ dot, onClose }: { dot: Dot; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Calls My Dots' server-side API route, which authenticates to
      // ForgeOS AI using My Dots' dedicated fk_ credential (server-side only).
      // The browser never sees the credential and never calls ForgeOS AI directly.
      // The Dot's persona (system prompt) is constructed server-side.
      const res = await fetch('/api/my-dots/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dot: {
            name: dot.name,
            role: dot.role,
            specialty: dot.specialty,
            capability: dot.capability,
          },
          messages: [{ role: 'user', content: userMsg }],
        }),
        signal: AbortSignal.timeout(120000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const content = data.choices?.[0]?.message?.content || '(no response)';
      setMessages(m => [...m, { role: 'dot', content, provider: data.forgeos?.label || data.forgeos?.provider }]);
    } catch (e: any) {
      const msg = e.message === 'All providers unavailable'
        ? `${dot.name} cannot respond — ForgeOS AI has no available providers. Add a provider key or install Ollama.`
        : `Error: ${e.message}`;
      setMessages(m => [...m, { role: 'dot', content: msg }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
           style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', height: '70vh' }}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <BotAvatar name={dot.name} emoji={dot.emoji} size={40} status={dot.status} />
          <div className="flex-1">
            <p className="font-bold" style={{ color: 'var(--text)' }}>{dot.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dot.role} · via ForgeOS AI ({dot.capability})</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-transform hover:scale-110"
                  style={{ background: 'var(--surface)', color: 'var(--text)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
              Give {dot.name} a task. Powered by ForgeOS AI — real execution, not simulated.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                   style={{
                     background: m.role === 'user' ? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))' : 'var(--surface)',
                     color: m.role === 'user' ? '#fff' : 'var(--text)',
                     border: m.role === 'dot' ? '1px solid var(--border)' : 'none',
                   }}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.provider && (
                  <p className="text-[10px] mt-1 opacity-60">via {m.provider}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--accent)' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={`Assign a task to ${dot.name}...`}
            disabled={dot.status === 'offline'}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-transparent"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          <button onClick={send} disabled={loading || dot.status === 'offline'}
                  className="px-4 py-2.5 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', color: '#fff' }}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MyDotsView({ onLaunchPlatform }: { onLaunchPlatform?: () => void }) {
  const [activeDot, setActiveDot] = useState<Dot | null>(null);

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="mydots" />
      <div className="relative p-8 max-w-7xl mx-auto">
        <FadeUp>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <SectionHeader
              eyebrow="AI Workforce — Click a Dot to execute"
              title="My Dots"
              description="Dot roster. Scout has a proven browser-execution path (vertical slice, 2026-10-12); other Dots are chat-only until onboarded. Metrics appear after Governor verification."
              accent="#10b981"
            />
            {onLaunchPlatform && (
              <button
                onClick={onLaunchPlatform}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 mt-2"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#fff',
                  boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
                }}
              >
                <Rocket className="h-5 w-5" />
                Launch OpenDots Platform
              </button>
            )}
          </div>
        </FadeUp>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Dots Defined', value: DOTS.length },
            { label: 'Verified Tasks', value: '—', sub: 'no verified task data yet' },
            { label: 'Reliability', value: '—', sub: 'measured after Governor ships' },
          ].map((s: any, i) => (
            <FadeUp key={s.label} delay={i * 80}>
              <GlassPanel glow="#10b981">
                <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
                  {s.value}{s.suffix || ''}{s.total && <span className="text-lg" style={{ color: 'var(--text-muted)' }}>/{s.total}</span>}
                </p>
                <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                {s.sub && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>}
              </GlassPanel>
            </FadeUp>
          ))}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DOTS.map((dot, i) => (
            <FadeUp key={dot.name} delay={i * 70}>
              <div onClick={() => dot.status !== 'offline' && setActiveDot(dot)}
                   className={dot.status === 'offline' ? 'opacity-60' : 'cursor-pointer'}>
                <GlassPanel hover={dot.status !== 'offline'}>
                  <div className="flex items-start gap-4 mb-4">
                    <BotAvatar name={dot.name} emoji={dot.emoji} size={56} status={dot.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{dot.name}</h3>
                        <StatusPill status={dot.status} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{dot.role}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dot.specialty}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-muted)' }}>Performance</span>
                      <span className="font-bold" style={{ color: 'var(--text)' }}>
                        {dot.performance === null ? 'No verified data yet' : `${dot.performance}%`}
                      </span>
                    </div>
                    {dot.performance !== null && (
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                        <div className="h-full rounded-full" style={{ width: `${dot.performance}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <BarChart3 className="h-3.5 w-3.5" /> {dot.tasksCompleted === null ? 'No verified tasks yet' : `${dot.tasksCompleted} tasks`}
                    </span>
                    <span className="text-xs font-bold" style={{ color: dot.status === 'offline' ? 'var(--text-muted)' : '#10b981' }}>
                      {dot.status === 'offline' ? 'Offline' : dot.status === 'unknown' ? 'Click to chat →' : 'Click to execute →'}
                    </span>
                  </div>
                </GlassPanel>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>

      {activeDot && <DotChat dot={activeDot} onClose={() => setActiveDot(null)} />}
    </div>
  );
}
