'use client';

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, StatusPill, GlowButton, CinematicBackground,
  AnimatedNumber,
} from '@/components/design-system';
import {
  DollarSign, Target, Link2, TrendingUp, Wallet, ShieldCheck,
  ChevronRight, CheckCircle2, Clock, Pause,
  ExternalLink, Send, Bot, Globe, MessageSquare, Activity,
} from 'lucide-react';

type Engine = 'overview' | 'pindrop' | 'affiliate' | 'quant';

// Real state from ForgeOS memory (2026-10-05/06)
const PINDROP = {
  status: 'ACTIVE',
  website: 'https://pindrop.shoppersspotllc.com',
  prospects: [
    { name: 'Midair', score: '75/75', rank: 1, note: 'Top target — outreach HELD' },
    { name: 'Prospect 2', score: '68/75', rank: 2, note: 'Verified TX HVAC' },
    { name: 'Prospect 3', score: '65/75', rank: 3, note: 'Verified TX HVAC' },
    { name: 'Prospect 4', score: '62/75', rank: 4, note: 'Verified TX HVAC' },
    { name: 'Prospect 5', score: '58/75', rank: 5, note: 'Verified TX HVAC' },
    { name: 'Prospect 6', score: '55/75', rank: 6, note: 'Verified TX HVAC' },
    { name: 'Prospect 7', score: '52/75', rank: 7, note: 'Verified TX HVAC' },
  ],
  credits: { remaining: 1850, total: 2000, spent: 150 },
  outreach: 'HELD — awaiting owner decision (phone vs email)',
  payouts: 'Ready via Stripe (verified)',
  revenue: 0,
  team: ['Scout', 'Analyst', 'Craftsman', 'Hunter', 'Shepherd', 'Closer'],
};

const AFFILIATE = {
  status: 'ACTIVE',
  experiment: 'Experiment #1 READY-TO-PUBLISH',
  hoplinks: [
    { id: 'soulmate_article', tid: 'verified' },
    { id: 'soulmate_youtube', tid: 'verified' },
    { id: 'soulmate_pinterest', tid: 'verified' },
  ],
  compliance: '11/11 PASS',
  platforms: [
    { name: 'ClickBank', status: 'Contract accepted', url: 'https://www.clickbank.com', color: '#e11d2e' },
    { name: 'Deel', status: 'Application submitted ($1,500/customer)', url: 'https://www.deel.com/partners', color: '#00e6a3' },
    { name: 'beehiiv', status: 'Applied', url: 'https://www.beehiiv.com', color: '#f59e0b' },
    { name: 'Kit', status: 'Queued', url: 'https://kit.com', color: '#6366f1' },
    { name: 'Amazon Associates', status: 'Queued', url: 'https://affiliate-program.amazon.com', color: '#ff9900' },
  ],
  revenue: 0,
};

const QUANT = {
  status: 'RESEARCH_HOLD',
  strategy: 'NO_DEPLOYABLE_STRATEGY — no defensible edge found (honest)',
  infrastructure: 'LIVE_READY',
  wallet: 'READY — $20 hard cap enforced',
  paperTrading: 'NOT_OPERATIONAL',
  liveTrading: 'DISABLED',
  capitalAtRisk: 0,
  capitalCap: 20,
  marketUrl: 'https://www.tradingview.com',
  actions: [
    { date: '2026-10-06', action: 'Strategy research completed', detail: '5 strategy families tested, 534 candles, walk-forward validation' },
    { date: '2026-10-06', action: 'Backtest: +0.43% (no tradable edge)', detail: 'Killed honestly — capital preservation priority' },
    { date: '2026-10-06', action: 'Wallet infrastructure READY', detail: '18/18 acceptance tests passed, $20 hard cap enforced' },
    { date: '2026-10-06', action: 'Live execution DISABLED', detail: 'No credentials, strategy gate closed' },
  ],
  gates: [
    { name: 'Research', done: true },
    { name: 'Backtesting', done: true },
    { name: 'Paper Testing', done: false },
    { name: 'Paper Verified', done: false },
    { name: 'Risk Certified', done: false },
    { name: 'Live Ready', done: false },
    { name: 'Owner Authorization', done: false },
    { name: 'Live Enabled', done: false },
  ],
};

// ── Supervised Dot Chat Component ──
function SupervisedDotChat({
  dotName, dotColor, apiEndpoint, placeholder, welcomeMessage,
}: {
  dotName: string;
  dotColor: string;
  apiEndpoint: string;
  placeholder: string;
  welcomeMessage: string;
}) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'dot'; text: string }>>([
    { role: 'dot', text: welcomeMessage },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] }),
      });
      const data = await res.json();
      let reply = 'No response received.';
      if (data.result?.content) reply = data.result.content;
      else if (data.result?.text) reply = data.result.text;
      else if (typeof data.result === 'string') reply = data.result;
      else if (data.response) reply = data.response;
      else if (data.error) reply = `Error: ${data.error}`;
      setMessages((m) => [...m, { role: 'dot', text: reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'dot', text: `Connection error: ${e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <GlassPanel glow={dotColor}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${dotColor}, ${dotColor}88)` }}>
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{dotName}</p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
            <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ background: 'var(--success)' }} />
            Supervised by Muse · Online
          </p>
        </div>
      </div>
      <div className="h-64 overflow-y-auto mb-4 space-y-3 p-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] px-3 py-2 rounded-xl text-sm"
              style={{
                background: m.role === 'user' ? dotColor : 'var(--surface)',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              }}>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <span className="animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && send()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: dotColor }}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </GlassPanel>
  );
}

// ── PinDrop Dashboard ──
function PinDropView() {
  const pct = Math.round((PINDROP.credits.remaining / PINDROP.credits.total) * 100);
  return (
    <div>
      {/* Website link banner */}
      <FadeUp>
        <GlassPanel glow="#f59e0b" className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8" style={{ color: '#f59e0b' }} />
              <div>
                <p className="font-bold" style={{ color: 'var(--text)' }}>PinDrop Platform</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{PINDROP.website}</p>
              </div>
            </div>
            <a href={PINDROP.website} target="_blank" rel="noopener noreferrer">
              <GlowButton>
                Open PinDrop Website <ExternalLink className="inline h-4 w-4 ml-1" />
              </GlowButton>
            </a>
          </div>
        </GlassPanel>
      </FadeUp>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <GlassPanel glow="#f59e0b">
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
            <AnimatedNumber value={PINDROP.credits.remaining} />
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>/{PINDROP.credits.total}</span>
          </p>
          <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Credits remaining</p>
          <div className="h-2 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#eab308)' }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{PINDROP.credits.spent} spent</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>${PINDROP.revenue}</p>
          <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Revenue</p>
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--success)' }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> {PINDROP.payouts}
          </p>
        </GlassPanel>
        <GlassPanel>
          <div className="flex items-center gap-2 mb-2">
            <Pause className="h-4 w-4" style={{ color: 'var(--warning)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Outreach HELD</p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{PINDROP.outreach}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Team: {PINDROP.team.join(', ')}</p>
        </GlassPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Target className="h-4 w-4" style={{ color: '#f59e0b' }} /> 7 Verified TX HVAC Prospects
          </h3>
          <div className="grid gap-2">
            {PINDROP.prospects.map((p) => (
              <GlassPanel key={p.rank} padding="p-3" hover>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-lg w-8" style={{ color: p.rank === 1 ? '#f59e0b' : 'var(--text-muted)' }}>#{p.rank}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{p.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.note}</p>
                  </div>
                  <span className="text-sm font-bold px-2.5 py-1 rounded-lg" style={{
                    background: p.rank === 1 ? 'linear-gradient(135deg,#f59e0b,#eab308)' : 'var(--surface)',
                    color: p.rank === 1 ? '#fff' : 'var(--text)', border: '1px solid var(--border)',
                  }}>{p.score}</span>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <MessageSquare className="h-4 w-4" style={{ color: '#f59e0b' }} /> PinDrop Dot — Supervised
          </h3>
          <SupervisedDotChat
            dotName="PinDrop Hunter"
            dotColor="#f59e0b"
            apiEndpoint="/api/pindrop/analyze"
            placeholder="Ask about prospects, outreach status, or assign a task…"
            welcomeMessage="Hello! I'm the PinDrop Dot, supervised by Muse. I can help with prospect research, outreach planning, marketing tasks, and follow-ups. Outreach is currently HELD awaiting your decision on phone vs email. What would you like to know?"
          />
        </div>
      </div>
    </div>
  );
}

// ── Affiliate Marketing Dashboard ──
function AffiliateView() {
  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <GlassPanel glow="#10b981">
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>${AFFILIATE.revenue}</p>
          <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Revenue</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{AFFILIATE.experiment}</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>{AFFILIATE.hoplinks.length}</p>
          <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Verified HopLinks</p>
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--success)' }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Compliance: {AFFILIATE.compliance}
          </p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>{AFFILIATE.platforms.length}</p>
          <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Partner Platforms</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Click any platform to visit</p>
        </GlassPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Link2 className="h-4 w-4" style={{ color: '#10b981' }} /> Partner Platforms
          </h3>
          <div className="grid gap-2">
            {AFFILIATE.platforms.map((p) => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="block">
                <GlassPanel padding="p-4" hover>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-sm"
                      style={{ background: p.color }}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.status}</p>
                    </div>
                    <ExternalLink className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </GlassPanel>
              </a>
            ))}
          </div>
          <h3 className="font-bold mb-3 mt-6 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <ShieldCheck className="h-4 w-4" style={{ color: '#10b981' }} /> Verified HopLinks
          </h3>
          <div className="grid gap-2">
            {AFFILIATE.hoplinks.map((h) => (
              <GlassPanel key={h.id} padding="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>{h.id}</p>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--success)', color: '#fff' }}>{h.tid}</span>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <MessageSquare className="h-4 w-4" style={{ color: '#10b981' }} /> Affiliate Dot — Supervised
          </h3>
          <SupervisedDotChat
            dotName="Affiliate Analyst"
            dotColor="#10b981"
            apiEndpoint="/api/pindrop/analyze"
            placeholder="Ask about affiliate status, blockers, or revenue…"
            welcomeMessage="Hello! I'm the Affiliate Marketing Dot, supervised by Muse. I can update you on partner platforms, HopLink status, compliance, and revenue. Experiment #1 is ready to publish. What's on your mind?"
          />
        </div>
      </div>
    </div>
  );
}

// ── Quant Dashboard ──
function QuantView() {
  const gatePct = Math.round((QUANT.gates.filter(g => g.done).length / QUANT.gates.length) * 100);
  return (
    <div>
      {/* Market link banner */}
      <FadeUp>
        <GlassPanel glow="#8b5cf6" className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8" style={{ color: '#8b5cf6' }} />
              <div>
                <p className="font-bold" style={{ color: 'var(--text)' }}>Live Market</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quant performs on the live market · ${QUANT.capitalAtRisk} at risk / ${QUANT.capitalCap} cap</p>
              </div>
            </div>
            <a href={QUANT.marketUrl} target="_blank" rel="noopener noreferrer">
              <GlowButton>
                Open Live Market <ExternalLink className="inline h-4 w-4 ml-1" />
              </GlowButton>
            </a>
          </div>
        </GlassPanel>
      </FadeUp>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <GlassPanel glow="#8b5cf6">
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Status</p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--warning)', color: '#fff' }}>{QUANT.status}</span>
          <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>{QUANT.strategy}</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Capital</p>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
            ${QUANT.capitalAtRisk}<span className="text-lg" style={{ color: 'var(--text-muted)' }}>/${QUANT.capitalCap}</span>
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{QUANT.wallet}</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Certification Gates</p>
          <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="h-full rounded-full" style={{ width: `${gatePct}%`, background: 'linear-gradient(90deg,#8b5cf6,#6366f1)' }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {QUANT.gates.filter(g => g.done).length}/{QUANT.gates.length} gates passed ({gatePct}%)
          </p>
        </GlassPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Activity className="h-4 w-4" style={{ color: '#8b5cf6' }} /> Quant Actions (Supervised)
          </h3>
          <div className="grid gap-2 mb-6">
            {QUANT.actions.map((a, i) => (
              <GlassPanel key={i} padding="p-3">
                <p className="text-xs font-mono mb-1" style={{ color: 'var(--text-muted)' }}>{a.date}</p>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{a.action}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{a.detail}</p>
              </GlassPanel>
            ))}
          </div>
          <h3 className="font-bold mb-3" style={{ color: 'var(--text)' }}>Strategy</h3>
          <GlassPanel>
            <p className="text-sm" style={{ color: 'var(--text)' }}>{QUANT.strategy}</p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Infrastructure: {QUANT.infrastructure} · Paper: {QUANT.paperTrading} · Live: {QUANT.liveTrading}
            </p>
          </GlassPanel>
          <h3 className="font-bold mb-3 mt-6" style={{ color: 'var(--text)' }}>Gates</h3>
          <div className="grid grid-cols-2 gap-2">
            {QUANT.gates.map((g) => (
              <div key={g.name} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {g.done
                  ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} />
                  : <Clock className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />}
                <span style={{ color: 'var(--text)' }}>{g.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <MessageSquare className="h-4 w-4" style={{ color: '#8b5cf6' }} /> Quant Dot — Supervised
          </h3>
          <SupervisedDotChat
            dotName="Quant Analyst"
            dotColor="#8b5cf6"
            apiEndpoint="/api/quant/analyze"
            placeholder="Ask Quant about strategy, progress, or market…"
            welcomeMessage="Hello! I'm the Quant Dot, supervised by Muse. I can explain my research findings, strategy analysis, risk gates, and capital status. Currently in RESEARCH_HOLD — no deployable strategy found yet (honest assessment). Capital at risk: $0 of $20 cap. What would you like to know?"
          />
        </div>
      </div>
    </div>
  );
}

function OverviewView({ setEngine }: { setEngine: (e: Engine) => void }) {
  const engines = [
    { id: 'pindrop' as Engine, name: 'PinDrop', icon: Target, desc: 'Outreach engine — 7 prospects, 1,850 credits', color: '#f59e0b', revenue: PINDROP.revenue },
    { id: 'affiliate' as Engine, name: 'Affiliate Marketing', icon: Link2, desc: 'ClickBank + HopLinks, ready to publish', color: '#10b981', revenue: AFFILIATE.revenue },
    { id: 'quant' as Engine, name: 'Quant', icon: TrendingUp, desc: 'Research hold — $20 cap, paper only', color: '#8b5cf6', revenue: 0 },
  ];
  const totalRevenue = PINDROP.revenue + AFFILIATE.revenue;
  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <GlassPanel glow="#f59e0b">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5" style={{ color: '#f59e0b' }} />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Total Revenue</p>
          </div>
          <p className="text-4xl font-extrabold" style={{ color: 'var(--text)' }}>${totalRevenue}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Objective: generate money</p>
        </GlassPanel>
        <GlassPanel>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Capital at Risk</p>
          </div>
          <p className="text-4xl font-extrabold" style={{ color: 'var(--text)' }}>${QUANT.capitalAtRisk}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Hard cap: ${QUANT.capitalCap}</p>
        </GlassPanel>
        <GlassPanel>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5" style={{ color: 'var(--success)' }} />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Engines Active</p>
          </div>
          <p className="text-4xl font-extrabold" style={{ color: 'var(--text)' }}>3<span className="text-lg" style={{ color: 'var(--text-muted)' }}>/3</span></p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>PinDrop · Affiliate · Quant</p>
        </GlassPanel>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {engines.map((e) => (
          <div key={e.id} onClick={() => setEngine(e.id)} className="cursor-pointer">
            <GlassPanel hover glow={e.color}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${e.color}22` }}>
                  <e.icon className="h-5 w-5" style={{ color: e.color }} />
                </div>
                <p className="font-bold" style={{ color: 'var(--text)' }}>{e.name}</p>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{e.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>${e.revenue} revenue</span>
                <ChevronRight className="h-4 w-4" style={{ color: e.color }} />
              </div>
            </GlassPanel>
          </div>
        ))}
      </div>
    </div>
  );
}

export function YoungMoneyView() {
  const [engine, setEngine] = useState<Engine>('overview');

  const engines = [
    { id: 'pindrop' as Engine, name: 'PinDrop', icon: Target, desc: 'Outreach engine — 7 prospects, 1,850 credits', color: '#f59e0b' },
    { id: 'affiliate' as Engine, name: 'Affiliate Marketing', icon: Link2, desc: 'ClickBank + HopLinks, ready to publish', color: '#10b981' },
    { id: 'quant' as Engine, name: 'Quant', icon: TrendingUp, desc: 'Research hold — $20 cap, paper only', color: '#8b5cf6' },
  ];

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="youngmoney" />
      <div className="relative p-8 max-w-7xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Revenue Operating System"
            title="Young Money"
            description="Three engines. Real revenue operations — supervised by Muse. The ultimate objective: generate money."
            accent="#f59e0b"
          />
        </FadeUp>

        {/* Engine tabs */}
        <FadeUp delay={80}>
          <div className="flex gap-2 mb-8 flex-wrap">
            <button onClick={() => setEngine('overview')}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: engine === 'overview' ? 'var(--accent-glow)' : 'var(--surface)',
                border: `1px solid ${engine === 'overview' ? 'var(--accent)' : 'var(--border)'}`,
                color: 'var(--text)',
              }}>Overview</button>
            {engines.map((e) => (
              <button key={e.id} onClick={() => setEngine(e.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                style={{
                  background: engine === e.id ? `${e.color}22` : 'var(--surface)',
                  border: `1px solid ${engine === e.id ? e.color : 'var(--border)'}`,
                  color: 'var(--text)',
                }}>
                <e.icon className="h-4 w-4" style={{ color: e.color }} /> {e.name}
              </button>
            ))}
          </div>
        </FadeUp>

        <FadeUp delay={120}>
          {engine === 'overview' && <OverviewView setEngine={setEngine} />}
          {engine === 'pindrop' && <PinDropView />}
          {engine === 'affiliate' && <AffiliateView />}
          {engine === 'quant' && <QuantView />}
        </FadeUp>
      </div>
    </div>
  );
}
