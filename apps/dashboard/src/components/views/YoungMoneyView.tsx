'use client';

import { useState } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, StatusPill, GlowButton, CinematicBackground,
  BotAvatar, AnimatedNumber,
} from '@/components/design-system';
import {
  DollarSign, Target, Link2, TrendingUp, Wallet, ShieldCheck,
  ChevronRight, AlertTriangle, CheckCircle2, Clock, Pause,
} from 'lucide-react';

type Engine = 'overview' | 'pindrop' | 'affiliate' | 'quant';

// Real state from ForgeOS memory (2026-10-05/06)
const PINDROP = {
  status: 'ACTIVE',
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
    { name: 'ClickBank', status: 'Contract accepted' },
    { name: 'Deel', status: 'Application submitted ($1,500/customer)' },
    { name: 'beehiiv', status: 'Applied' },
    { name: 'Kit', status: 'Queued' },
    { name: 'Amazon', status: 'Queued' },
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

// Verified Stripe state (2026-10-10) — TEST pilot. Facts only, no forecasts.
const PAYMENTS = {
  rows: [
    { label: 'Credential', value: 'VERIFIED — SHOPPERS SPOT LLC (via Stripe API)', done: true },
    { label: 'Key mode', value: 'Stored key is LIVE — TEST key (sk_test_) still required for the pilot', done: false },
    { label: 'Gateway', value: 'Fail-closed armed — rejects non-sk_test_ keys before any network call', done: true },
    { label: 'TEST transaction', value: 'PENDING — $1.00 controlled checkout (needs TEST key + preview)', done: false },
    { label: 'Webhook', value: 'PENDING — signing secret STRIPE_WEBHOOK_SECRET_FRESHTURN not provisioned', done: false },
    { label: 'Live payments', value: 'DISABLED in code — cannot be enabled through this module', done: true },
  ],
};

function PinDropView() {
  const pct = Math.round((PINDROP.credits.remaining / PINDROP.credits.total) * 100);
  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <GlassPanel glow="#f59e0b">
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
            <AnimatedNumber value={PINDROP.credits.remaining} />
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>/{PINDROP.credits.total}</span>
          </p>
          <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Credits remaining ({pct}%)</p>
          <div className="h-2 rounded-full mt-3 overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#eab308)' }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{PINDROP.credits.spent} spent (100 sunk + 50 draft)</p>
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
  );
}

function AffiliateView() {
  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <GlassPanel glow="#10b981">
          <p className="font-bold" style={{ color: 'var(--text)' }}>{AFFILIATE.experiment}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Compliance QA: {AFFILIATE.compliance}</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>{AFFILIATE.hoplinks.length}</p>
          <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>HopLinks (TID verified)</p>
        </GlassPanel>
        <GlassPanel>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>${AFFILIATE.revenue}</p>
          <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Revenue</p>
        </GlassPanel>
      </div>

      <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Link2 className="h-4 w-4" style={{ color: '#10b981' }} /> Platforms
      </h3>
      <div className="grid gap-2">
        {AFFILIATE.platforms.map((p) => (
          <GlassPanel key={p.name} padding="p-3" hover>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{p.name}</p>
              <StatusPill status={p.status.includes('accepted') ? 'available' : 'busy'} />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{p.status}</p>
          </GlassPanel>
        ))}
      </div>
      <div className="grid gap-2 mt-4">
        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Link2 className="h-4 w-4" style={{ color: '#10b981' }} /> HopLinks
        </h3>
        {AFFILIATE.hoplinks.map((h) => (
          <div key={h.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
               style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <code className="font-mono text-xs" style={{ color: 'var(--accent)' }}>{h.id}</code>
            <span className="text-xs ml-auto" style={{ color: 'var(--success)' }}>✓ {h.tid}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuantView() {
  return (
    <div>
      <GlassPanel glow="var(--warning)" className="mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
          <div>
            <p className="font-bold" style={{ color: 'var(--text)' }}>Status: {QUANT.status}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{QUANT.strategy}</p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Infrastructure: {QUANT.infrastructure} · Wallet: {QUANT.wallet} · Paper: {QUANT.paperTrading} · Live: {QUANT.liveTrading}
            </p>
          </div>
        </div>
      </GlassPanel>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <GlassPanel>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Capital</p>
          </div>
          <p className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
            ${QUANT.capitalAtRisk.toFixed(2)} <span className="text-lg" style={{ color: 'var(--text-muted)' }}>/ ${QUANT.capitalCap}.00</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Hard ceiling — no auto-increase, no leverage beyond cap</p>
        </GlassPanel>
        <GlassPanel>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4" style={{ color: 'var(--success)' }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Safety Gates</p>
          </div>
          <div className="space-y-1.5">
            {QUANT.gates.map((g) => (
              <div key={g.name} className="flex items-center gap-2 text-xs">
                {g.done
                  ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} />
                  : <Clock className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />}
                <span style={{ color: g.done ? 'var(--text)' : 'var(--text-muted)' }}>{g.name}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Live trading requires explicit owner authorization after all gates pass. Never auto-enables.
      </p>
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
            description="Three engines. Real state restored from previous work. Ready to continue execution — not recreated from zero."
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

        {engine === 'overview' && (
          <div className="grid md:grid-cols-3 gap-4">
            {engines.map((e, i) => (
              <FadeUp key={e.id} delay={i * 80}>
                <GlassPanel hover glow={e.color} className="cursor-pointer" >
                  <div onClick={() => setEngine(e.id)}>
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                         style={{ background: `linear-gradient(135deg, ${e.color}, ${e.color}88)`, boxShadow: `0 8px 20px ${e.color}44` }}>
                      <e.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>{e.name}</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{e.desc}</p>
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: e.color }}>
                      Open <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </GlassPanel>
              </FadeUp>
            ))}
          </div>
        )}

        {engine === 'overview' && (
          <FadeUp delay={120}>
            <GlassPanel glow="#10b981" className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4" style={{ color: '#10b981' }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Payments — Stripe TEST pilot</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b55' }}>
                  TEST ONLY
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-left">
                {PAYMENTS.rows.map((r) => (
                  <div key={r.label} className="flex items-start gap-2">
                    {r.done
                      ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                      : <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />}
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold" style={{ color: 'var(--text)' }}>{r.label}:</span> {r.value}
                    </p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </FadeUp>
        )}

        {engine === 'pindrop' && <FadeUp><PinDropView /></FadeUp>}
        {engine === 'affiliate' && <FadeUp><AffiliateView /></FadeUp>}
        {engine === 'quant' && <FadeUp><QuantView /></FadeUp>}

        <FadeUp delay={200}>
          <GlassPanel className="mt-8 text-center py-6">
            <DollarSign className="h-8 w-8 mx-auto mb-2" style={{ color: '#f59e0b' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Young Money Architecture</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              New revenue projects can be added without redesigning the platform. All state preserved.
            </p>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
