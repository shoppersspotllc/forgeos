'use client';

import { useState, useRef, useEffect } from 'react';
import {
  GlassPanel, FadeUp, BotAvatar, StatusPill,
} from '@/components/design-system';
import { Send, Loader2, ArrowLeft, Sparkles } from 'lucide-react';

interface Dot {
  name: string;
  emoji: string;
  role: string;
  specialty: string;
  status: 'online' | 'busy' | 'offline' | 'unknown';
  capability: string;
  greeting: string;
}

// Preserved OpenDots Dot identities — emoji avatars are the canonical
// visual identity (2026-10-12 audit: no image assets exist in repo).
const DOTS: Dot[] = [
  { name: 'Scout', emoji: '🔍', role: 'Research Specialist', specialty: 'Market intelligence & discovery', status: 'online', capability: 'chat',
    greeting: "Scout here. Give me a research target — a market, a competitor, a trend — and I'll dig in." },
  { name: 'Analyst', emoji: '📊', role: 'Data Analyst', specialty: 'Deep analysis & insights', status: 'online', capability: 'chat',
    greeting: "Analyst ready. Share data, a question, or a problem and I'll break it down." },
  { name: 'Craftsman', emoji: '🔨', role: 'Build Engineer', specialty: 'Implementation & construction', status: 'online', capability: 'coding',
    greeting: "Craftsman at your service. Describe what you want built and I'll plan the implementation." },
  { name: 'Hunter', emoji: '🎯', role: 'Outreach Specialist', specialty: 'Lead engagement & conversion', status: 'online', capability: 'chat',
    greeting: "Hunter locked in. Tell me who we're pursuing and I'll map the approach." },
  { name: 'Shepherd', emoji: '🐑', role: 'Relationship Manager', specialty: 'Nurturing & follow-up', status: 'online', capability: 'chat',
    greeting: "Shepherd here. I'll keep every relationship warm — who needs follow-up?" },
  { name: 'Closer', emoji: '💰', role: 'Deal Closer', specialty: 'Final conversion & revenue', status: 'online', capability: 'chat',
    greeting: "Closer ready. Point me at the deal and I'll work the close." },
];

interface Message {
  role: 'user' | 'dot';
  content: string;
  provider?: string;
}

export function OpenDotsPlatformView({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<Dot>(DOTS[0]);
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = threads[selected.name] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selected.name]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setThreads(t => ({ ...t, [selected.name]: [...(t[selected.name] || []), { role: 'user', content: userMsg }] }));
    setLoading(true);

    try {
      const res = await fetch('/api/my-dots/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dot: {
            name: selected.name,
            role: selected.role,
            specialty: selected.specialty,
            capability: selected.capability,
          },
          messages: [...(threads[selected.name] || []).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })), { role: 'user', content: userMsg }],
        }),
        signal: AbortSignal.timeout(120000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const content = data.choices?.[0]?.message?.content || '(no response)';
      setThreads(t => ({
        ...t,
        [selected.name]: [...(t[selected.name] || []), { role: 'dot', content, provider: data.forgeos?.label || data.forgeos?.provider }],
      }));
    } catch (e: any) {
      const msg = e.message === 'All providers unavailable'
        ? `${selected.name} cannot respond — ForgeOS AI has no available providers right now.`
        : `Error: ${e.message}`;
      setThreads(t => ({ ...t, [selected.name]: [...(t[selected.name] || []), { role: 'dot', content: msg }] }));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
      {/* Platform header */}
      <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <ArrowLeft className="h-4 w-4" /> My Dots
        </button>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⬡</span>
          <div>
            <h1 className="font-extrabold text-lg leading-tight" style={{ color: 'var(--text)' }}>
              OpenDots Platform
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              All Dots online · powered by ForgeOS AI
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs font-semibold" style={{ color: '#10b981' }}>
          <Sparkles className="h-4 w-4" /> Live
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Dot roster */}
        <div className="w-72 shrink-0 p-4 space-y-2 overflow-y-auto" style={{ borderRight: '1px solid var(--border)' }}>
          {DOTS.map((dot) => (
            <button
              key={dot.name}
              onClick={() => setSelected(dot)}
              className="w-full text-left rounded-2xl p-3 transition-all hover:scale-[1.02]"
              style={{
                background: selected.name === dot.name ? 'var(--surface)' : 'transparent',
                border: `1px solid ${selected.name === dot.name ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              <div className="flex items-center gap-3">
                <BotAvatar name={dot.name} emoji={dot.emoji} size={44} status={dot.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{dot.name}</p>
                    <StatusPill status={dot.status} />
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{dot.role}</p>
                </div>
              </div>
            </button>
          ))}
          <p className="text-[11px] px-2 pt-2" style={{ color: 'var(--text-muted)' }}>
            Select a Dot to start a conversation. Each Dot keeps its own thread.
          </p>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <BotAvatar name={selected.name} emoji={selected.emoji} size={40} status={selected.status} />
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>{selected.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selected.role} · {selected.specialty}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.length === 0 && (
              <FadeUp>
                <GlassPanel glow="#10b981">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{selected.emoji}</span>
                    <div>
                      <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>{selected.name}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.greeting}</p>
                    </div>
                  </div>
                </GlassPanel>
              </FadeUp>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'dot' && (
                  <span className="text-2xl mr-2 mt-1 shrink-0">{selected.emoji}</span>
                )}
                <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
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
                <span className="text-2xl mr-2 mt-1">{selected.emoji}</span>
                <div className="rounded-2xl px-4 py-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--accent)' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Ask ${selected.name} anything...`}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <button
              onClick={send}
              disabled={loading}
              className="px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff' }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
