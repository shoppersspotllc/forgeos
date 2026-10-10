'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CinematicBackground,
  GlassPanel,
  GlowButton,
  AnimatedNumber,
  SectionHeader,
  FadeUp,
} from '@/components/design-system';
import {
  DollarSign, Target, Link2, ShieldCheck,
  ChevronRight, CheckCircle2, Clock, AlertTriangle,
  ArrowLeft, ExternalLink, Users, Zap, Activity,
  FlaskConical, Sparkles, MousePointerClick, FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ============================================================================
 * Young Money — premium revenue command view.
 * All figures are real verified state. $0 means $0. The $50K target is a
 * target, never a forecast. No revenue, activity, or liveness is fabricated.
 * ========================================================================== */

type EngineId = 'pindrop' | 'affiliate' | 'quant';
type ViewState = 'overview' | EngineId;

const TARGET_MONTHLY = 50000;
const COLLECTED_REVENUE = 0;

interface DotInfo { name: string; role: string; state: string; tone: 'green' | 'amber' | 'muted'; }
interface TimelineItem { title: string; detail: string; when: string; done: boolean; }
interface Metric { label: string; value: number; prefix?: string; suffix?: string; sub: string; }
interface Bar { label: string; pct: number; note: string; }

interface EngineData {
  id: EngineId;
  name: string;
  tagline: string;
  color: string;
  icon: LucideIcon;
  status: string;
  statusTone: 'amber' | 'green' | 'muted';
  health: string;
  metrics: Metric[];
  bars: Bar[];
  dots: DotInfo[];
  dotsTitle: string;
  timeline: TimelineItem[];
  next: string[];
  platform: { label: string; url: string };
  goalNote: string;
}

const ENGINES: EngineData[] = [
  {
    id: 'pindrop',
    name: 'PinDrop',
    tagline: 'AI outreach engine',
    color: '#f59e0b',
    icon: Target,
    status: 'OUTREACH HELD',
    statusTone: 'amber',
    health: 'Operational — 6/6 Dots certified, drafts ready, awaiting owner call',
    metrics: [
      { label: 'Verified prospects', value: 7, sub: 'TX HVAC shops, scored 52–75/75' },
      { label: 'Credits remaining', value: 1850, suffix: '/2000', sub: '92% — 150 spent' },
      { label: 'Revenue collected', value: 0, prefix: '$', sub: 'Outreach not yet launched' },
    ],
    bars: [
      { label: 'Prospects verified', pct: 100, note: '7 of 7' },
      { label: 'Credits remaining', pct: 92, note: '1,850 / 2,000' },
      { label: 'Launch readiness', pct: 85, note: 'Drafts done — decision pending' },
    ],
    dotsTitle: 'Outreach crew — 6 Dots',
    dots: [
      { name: 'Scout', role: 'Prospect discovery', state: 'CERTIFIED', tone: 'green' },
      { name: 'Analyst', role: 'Scoring & research', state: 'CERTIFIED', tone: 'green' },
      { name: 'Craftsman', role: 'Message drafting', state: 'STANDBY', tone: 'amber' },
      { name: 'Hunter', role: 'Lead sourcing', state: 'CERTIFIED', tone: 'green' },
      { name: 'Shepherd', role: 'Follow-up sequences', state: 'STANDBY', tone: 'amber' },
      { name: 'Closer', role: 'Handoff & booking', state: 'STANDBY', tone: 'amber' },
    ],
    timeline: [
      { title: '7 prospects scored & verified', detail: 'Texas HVAC shops ranked 52–75/75. Midair ranked #1.', when: 'Oct 2026', done: true },
      { title: 'Outreach drafts prepared', detail: 'Personalized sequences drafted per prospect — held, not sent.', when: 'Oct 2026', done: true },
      { title: 'Platform economics confirmed', detail: '10mins.co founder confirmed fees, webhooks & USD terms in writing.', when: 'Oct 10, 2026', done: true },
      { title: 'Outreach launch', detail: 'Awaiting owner decision: phone vs email.', when: 'Pending', done: false },
    ],
    next: [
      'Owner decision: phone vs email outreach',
      'Launch first outreach wave to 7 prospects',
      'Book first 10 research conversations',
    ],
    platform: { label: 'Open Leads Platform', url: '/platform/leads' },
    goalNote: 'PinDrop earns its share of the $50K the day booked conversations turn into paying customers. No outreach has been sent — every future send is tracked here.',
  },
  {
    id: 'affiliate',
    name: 'Affiliate Marketing',
    tagline: 'Content & commissions',
    color: '#10b981',
    icon: Link2,
    status: 'READY TO PUBLISH',
    statusTone: 'green',
    health: 'Monetization-ready — HopLinks verified end to end in the browser',
    metrics: [
      { label: 'Live properties', value: 2, sub: 'Guide site + Dev.to article' },
      { label: 'Pins drafted', value: 5, sub: 'Awaiting Pinterest Standard review' },
      { label: 'Revenue collected', value: 0, prefix: '$', sub: 'No hops yet' },
    ],
    bars: [
      { label: 'Experiment #1 build', pct: 90, note: 'Publishing gates remain' },
      { label: 'HopLink verification', pct: 100, note: '3/3 verified live' },
      { label: 'Distribution', pct: 40, note: '2 of 5 channels live' },
    ],
    dotsTitle: 'Distribution channels',
    dots: [
      { name: 'Guide site', role: 'guides.shoppersspotllc.com', state: 'LIVE', tone: 'green' },
      { name: 'Dev.to', role: 'Published article', state: 'LIVE', tone: 'green' },
      { name: 'Pinterest', role: '5 pins drafted', state: 'AWAITING REVIEW', tone: 'amber' },
      { name: 'Medium', role: 'Article drafted', state: 'API UNAVAILABLE', tone: 'muted' },
      { name: 'ClickBank', role: 'Nickname + vendor ID live', state: 'CONFIGURED', tone: 'green' },
    ],
    timeline: [
      { title: 'Guide property live', detail: 'guides.shoppersspotllc.com — IONOS DNS + TLS verified, HTTP 200.', when: 'Oct 9, 2026', done: true },
      { title: 'ClickBank wired end to end', detail: 'Nickname + vendor ID as Vercel secrets; guide → HopLink → vendor page verified in the browser.', when: 'Oct 9, 2026', done: true },
      { title: 'Dev.to article published', detail: '"I Researched Soulmate Sketch So You Don\'t Have To" — live, HTTP 200.', when: 'Oct 9, 2026', done: true },
      { title: 'Pinterest app created', detail: '"Young Money Publisher" on Trial; Standard access review submitted.', when: 'Oct 9, 2026', done: true },
      { title: 'First commission', detail: 'Pending: publish pins → first hops → first conversions.', when: 'Pending', done: false },
    ],
    next: [
      'Pinterest Standard approval',
      'Publish the 5 prepared pins',
      'First 100 guide visits',
    ],
    platform: { label: 'Open Live Guide', url: 'https://guides.shoppersspotllc.com/guides/soulmate-sketch' },
    goalNote: 'Affiliate earns its share of the $50K one commission at a time. Every click is tracked; every dollar shown here will be verified revenue.',
  },
  {
    id: 'quant',
    name: 'Quant',
    tagline: 'Algorithmic trading research',
    color: '#8b5cf6',
    icon: FlaskConical,
    status: 'RESEARCH HOLD',
    statusTone: 'muted',
    health: 'Infrastructure LIVE_READY — strategy gate closed, capital protected',
    metrics: [
      { label: 'Capital at risk', value: 0, prefix: '$', suffix: '.00', sub: 'Hard ceiling $20.00 — untouched' },
      { label: 'Wallet tests', value: 18, suffix: '/18', sub: 'Acceptance suite passing' },
      { label: 'Strategies tested', value: 5, sub: '0 deployable edges found' },
    ],
    bars: [
      { label: 'Capital deployed', pct: 0, note: '$0.00 of $20.00' },
      { label: 'Research coverage', pct: 100, note: '5 families, 534 candles' },
      { label: 'Safety gates passed', pct: 25, note: '2 of 8 gates' },
    ],
    dotsTitle: 'Safety gates — 8 required',
    dots: [
      { name: 'Research', role: 'Hypothesis + methodology', state: 'PASSED', tone: 'green' },
      { name: 'Backtesting', role: 'Walk-forward validation', state: 'PASSED', tone: 'green' },
      { name: 'Paper Testing', role: 'Simulated execution', state: 'LOCKED', tone: 'muted' },
      { name: 'Paper Verified', role: 'Results reviewed', state: 'LOCKED', tone: 'muted' },
      { name: 'Risk Certified', role: 'Independent sign-off', state: 'LOCKED', tone: 'muted' },
      { name: 'Live Ready', role: 'Infra + keys ready', state: 'LOCKED', tone: 'muted' },
      { name: 'Owner Authorization', role: 'Explicit approval', state: 'LOCKED', tone: 'muted' },
      { name: 'Live Enabled', role: 'Trading switch', state: 'DISABLED', tone: 'amber' },
    ],
    timeline: [
      { title: 'Wallet certified', detail: '18/18 acceptance tests. $20 hard cap enforced in code — profit cannot raise it.', when: 'Oct 2026', done: true },
      { title: 'Strategy research completed', detail: '5 families, 534 daily candles, walk-forward validation — no defensible edge. Killed honestly.', when: 'Oct 6, 2026', done: true },
      { title: 'Exchange selection', detail: 'Coinbase vs Kraken decision package prepared — awaiting owner pick.', when: 'Pending', done: false },
      { title: 'Paper trading', detail: 'Gated behind a viable strategy + risk certification.', when: 'Locked', done: false },
    ],
    next: [
      'Owner picks exchange (Coinbase / Kraken)',
      'Read-only connection validation',
      'Paper validation — only after an edge is found',
    ],
    platform: { label: 'Open Quant Console', url: '#youngmoney=quant' },
    goalNote: 'Quant contributes to the $50K only with a proven edge and every gate passed. Until then the $20 stays untouched — that discipline is the feature.',
  },
];

const PAYMENTS_ROWS = [
  { label: 'Credential', value: 'VERIFIED — SHOPPERS SPOT LLC (via Stripe API)', done: true },
  { label: 'Key mode', value: 'Stored key is LIVE — TEST key (sk_test_) still required', done: false },
  { label: 'Gateway', value: 'Fail-closed armed — rejects non-sk_test_ keys before any network call', done: true },
  { label: 'TEST transaction', value: 'PENDING — $1.00 controlled checkout (needs TEST key + preview)', done: false },
  { label: 'Webhook', value: 'PENDING — signing secret STRIPE_WEBHOOK_SECRET_FRESHTURN not provisioned', done: false },
  { label: 'Live payments', value: 'DISABLED in code — cannot be enabled through this module', done: true },
];

const ROADMAP = [
  { stage: 'First outreach', detail: 'PinDrop launches', active: false },
  { stage: 'First click', detail: 'Affiliate hops begin', active: false },
  { stage: 'First $1', detail: 'Verified revenue', active: false },
  { stage: '$1K / month', detail: 'Traction', active: false },
  { stage: '$10K / month', detail: 'Scale', active: false },
  { stage: '$50K / month', detail: 'Target', active: false },
];

/* ------------------------------ visual atoms ------------------------------ */

function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  );
}

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 200 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${w}%`, background: color, transition: 'width 1.1s cubic-bezier(0.22,1,0.36,1)' }}
      />
    </div>
  );
}

function ProgressRing({ pct, color, size = 132 }: { pct: number; color: string; size?: number }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOff(c * (1 - pct / 100)), 250);
    return () => clearTimeout(t);
  }, [pct, c]);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{pct}%</span>
      </div>
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: 'amber' | 'green' | 'muted'; children: ReactNode }) {
  const map = {
    amber: { bg: '#f59e0b22', fg: '#f59e0b', border: '#f59e0b55' },
    green: { bg: '#10b98122', fg: '#10b981', border: '#10b98155' },
    muted: { bg: '#64748b22', fg: '#94a3b8', border: '#64748b55' },
  }[tone];
  return (
    <span
      className="text-[11px] px-2.5 py-1 rounded-full font-bold tracking-wide inline-flex items-center gap-1.5"
      style={{ background: map.bg, color: map.fg, border: `1px solid ${map.border}` }}
    >
      <PulseDot color={map.fg} />
      {children}
    </span>
  );
}

function ToneDot({ tone }: { tone: 'green' | 'amber' | 'muted' }) {
  const color = tone === 'green' ? 'var(--success)' : tone === 'amber' ? '#f59e0b' : 'var(--text-muted)';
  return <PulseDot color={color} />;
}

function Timeline({ items, color }: { items: TimelineItem[]; color: string }) {
  return (
    <div className="relative pl-7">
      <div className="absolute left-[8px] top-2 bottom-2 w-px" style={{ background: 'var(--border)' }} />
      {items.map((it, i) => (
        <FadeUp key={i} delay={i * 90}>
          <div className="relative pb-5 last:pb-0">
            <span
              className="absolute -left-7 top-1 flex h-[17px] w-[17px] items-center justify-center rounded-full border-2"
              style={{ borderColor: it.done ? 'var(--success)' : color, background: 'var(--surface)' }}
            >
              {it.done && <CheckCircle2 className="h-3 w-3" style={{ color: 'var(--success)' }} />}
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{it.title}</p>
              <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>{it.when}</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{it.detail}</p>
          </div>
        </FadeUp>
      ))}
    </div>
  );
}

/* ------------------------------- overview --------------------------------- */

function Hero() {
  return (
    <FadeUp>
      <GlassPanel glow="#f59e0b" className="mb-6 overflow-hidden">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: '#f59e0b' }}>
              The target
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-5xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--text-muted)' }}>$</span><AnimatedNumber value={COLLECTED_REVENUE} />
              </p>
              <p className="text-xl font-semibold" style={{ color: 'var(--text-muted)' }}>
                / ${TARGET_MONTHLY.toLocaleString()}<span className="text-sm">/mo</span>
              </p>
            </div>
            <p className="text-sm mt-2 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
              Verified collected revenue. The $50,000 target is a target — never a forecast.
              Every dollar shown here will be real, verified money.
            </p>
            <div className="mt-5 max-w-xl">
              <AnimatedBar pct={0} color="linear-gradient(90deg,#f59e0b,#eab308)" />
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>$0 collected</span>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>$50,000 target</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 mx-auto">
            <ProgressRing pct={0} color="#f59e0b" />
            <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
              of target reached
            </p>
          </div>
        </div>
      </GlassPanel>
    </FadeUp>
  );
}

function Roadmap() {
  return (
    <FadeUp delay={100}>
      <GlassPanel className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4" style={{ color: '#f59e0b' }} />
          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Roadmap to $50K — stages, not promises</p>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {ROADMAP.map((r, i) => (
            <div key={r.stage} className="flex items-center shrink-0">
              <div className="flex flex-col items-center px-3">
                <span
                  className="h-3 w-3 rounded-full border-2 mb-1.5"
                  style={{
                    borderColor: r.active ? '#f59e0b' : 'var(--border)',
                    background: r.active ? '#f59e0b' : 'transparent',
                  }}
                />
                <p className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>{r.stage}</p>
                <p className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{r.detail}</p>
              </div>
              {i < ROADMAP.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
          ))}
        </div>
      </GlassPanel>
    </FadeUp>
  );
}

function EngineCard({ engine, index, onOpen }: { engine: EngineData; index: number; onOpen: () => void }) {
  const Icon = engine.icon;
  return (
    <FadeUp delay={index * 90}>
      <GlassPanel hover glow={engine.color} className="cursor-pointer h-full" >
        <div onClick={onOpen} role="button" tabIndex={0}
             onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
             className="h-full flex flex-col outline-none">
          <div className="flex items-start justify-between mb-4">
            <div
              className="h-13 w-13 rounded-2xl flex items-center justify-center p-3 transition-transform duration-300 group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${engine.color}, ${engine.color}88)`, boxShadow: `0 8px 20px ${engine.color}44` }}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <StatusBadge tone={engine.statusTone}>{engine.status}</StatusBadge>
          </div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{engine.name}</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{engine.tagline}</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {engine.metrics.map((m) => (
              <div key={m.label} className="rounded-xl px-2 py-2 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-lg font-extrabold" style={{ color: 'var(--text)' }}>
                  {m.prefix}<AnimatedNumber value={m.value} />{m.suffix}
                </p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto">
            <div className="flex justify-between text-[11px] mb-1">
              <span style={{ color: 'var(--text-muted)' }}>{engine.bars[0].label}</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{engine.bars[0].pct}%</span>
            </div>
            <AnimatedBar pct={engine.bars[0].pct} color={engine.color} delay={index * 120} />
          </div>
          <span className="mt-4 text-sm font-semibold flex items-center gap-1" style={{ color: engine.color }}>
            Explore engine <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </GlassPanel>
    </FadeUp>
  );
}

function PaymentsStrip() {
  return (
    <FadeUp delay={120}>
      <GlassPanel glow="#10b981" className="mt-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <ShieldCheck className="h-4 w-4" style={{ color: '#10b981' }} />
          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Payments — Stripe TEST pilot</p>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b55' }}
          >
            TEST ONLY
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-xs text-left">
          {PAYMENTS_ROWS.map((r) => (
            <div key={r.label} className="flex items-start gap-2">
              {r.done
                ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                : <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />}
              <p style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{r.label}:</span> {r.value}
              </p>
            </div>
          ))}
        </div>
      </GlassPanel>
    </FadeUp>
  );
}

/* ------------------------------- detail view -------------------------------- */

function MetricTile({ m, color, index }: { m: Metric; color: string; index: number }) {
  return (
    <FadeUp delay={index * 80}>
      <GlassPanel glow={color}>
        <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
          {m.prefix}<AnimatedNumber value={m.value} />{m.suffix}
        </p>
        <p className="text-xs uppercase tracking-[0.14em] font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>
          {m.label}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{m.sub}</p>
      </GlassPanel>
    </FadeUp>
  );
}

function EngineDetail({ engine, onBack }: { engine: EngineData; onBack: () => void }) {
  const Icon = engine.icon;
  const isExternal = /^https?:\/\//.test(engine.platform.url);
  return (
    <div>
      <FadeUp>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <ArrowLeft className="h-4 w-4" /> All engines
          </button>
          <StatusBadge tone={engine.statusTone}>{engine.status}</StatusBadge>
        </div>
      </FadeUp>

      <FadeUp delay={60}>
        <GlassPanel glow={engine.color} className="mb-6">
          <div className="flex items-start gap-5 flex-wrap">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${engine.color}, ${engine.color}88)`, boxShadow: `0 12px 28px ${engine.color}44` }}
            >
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-[220px]">
              <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                {engine.name}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{engine.tagline}</p>
              <p className="text-sm mt-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Activity className="h-4 w-4" style={{ color: engine.color }} />
                {engine.health}
              </p>
            </div>
            <a
              href={engine.platform.url}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : { target: '_blank' })}
              className="shrink-0"
            >
              <GlowButton>
                <span className="inline-flex items-center gap-2">
                  {engine.platform.label} <ExternalLink className="h-4 w-4" />
                </span>
              </GlowButton>
            </a>
          </div>
        </GlassPanel>
      </FadeUp>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {engine.metrics.map((m, i) => (
          <MetricTile key={m.label} m={m} color={engine.color} index={i} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <FadeUp delay={100}>
          <GlassPanel className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4" style={{ color: engine.color }} />
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Progress</p>
            </div>
            <div className="space-y-4">
              {engine.bars.map((b, i) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{b.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{b.note}</span>
                  </div>
                  <AnimatedBar pct={b.pct} color={engine.color} delay={i * 140} />
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <MousePointerClick className="h-4 w-4" style={{ color: engine.color }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Next actions toward $50K</p>
              </div>
              <ul className="space-y-2">
                {engine.next.map((n, i) => (
                  <li key={n} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span
                      className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: `${engine.color}22`, color: engine.color, border: `1px solid ${engine.color}55` }}
                    >
                      {i + 1}
                    </span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </GlassPanel>
        </FadeUp>

        <FadeUp delay={160}>
          <GlassPanel className="h-full">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4" style={{ color: engine.color }} />
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{engine.dotsTitle}</p>
            </div>
            <div className="space-y-2">
              {engine.dots.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <ToneDot tone={d.tone} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{d.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{d.role}</p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                    style={{
                      background: d.tone === 'green' ? 'var(--success)' : d.tone === 'amber' ? '#f59e0b' : 'var(--text-muted)',
                      color: '#fff', opacity: d.tone === 'muted' ? 0.7 : 1,
                    }}
                  >
                    {d.state}
                  </span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </FadeUp>
      </div>

      <FadeUp delay={200}>
        <GlassPanel className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="h-4 w-4" style={{ color: engine.color }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Complete action history</p>
          </div>
          <Timeline items={engine.timeline} color={engine.color} />
        </GlassPanel>
      </FadeUp>

      <FadeUp delay={240}>
        <GlassPanel glow={engine.color} className="text-center py-5">
          <DollarSign className="h-7 w-7 mx-auto mb-2" style={{ color: engine.color }} />
          <p className="text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {engine.goalNote}
          </p>
        </GlassPanel>
      </FadeUp>
    </div>
  );
}

/* --------------------------------- main ----------------------------------- */

export function YoungMoneyView() {
  const [view, setView] = useState<ViewState>('overview');

  // Deep links: #youngmoney=pindrop|affiliate|quant — shareable engine URLs.
  useEffect(() => {
    const m = window.location.hash.match(/youngmoney=(pindrop|affiliate|quant)/);
    if (m) setView(m[1] as EngineId);
  }, []);

  const go = (v: ViewState) => {
    setView(v);
    if (v === 'overview') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      window.location.hash = `youngmoney=${v}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const engine = ENGINES.find((e) => e.id === view);

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="youngmoney" />
      <div className="relative p-8 max-w-7xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Revenue Operating System"
            title="Young Money"
            description="Three engines, one target: $50,000/month in verified revenue. Open an engine to see its health, progress, crew, and complete action history."
            accent="#f59e0b"
          />
        </FadeUp>

        {view === 'overview' ? (
          <>
            <Hero />
            <Roadmap />
            <div className="grid md:grid-cols-3 gap-4">
              {ENGINES.map((e, i) => (
                <EngineCard key={e.id} engine={e} index={i} onOpen={() => go(e.id)} />
              ))}
            </div>
            <PaymentsStrip />
            <FadeUp delay={200}>
              <GlassPanel className="mt-6 text-center py-5">
                <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <p>Figures show verified state only. $0 means $0 — nothing is estimated or projected.</p>
                </div>
              </GlassPanel>
            </FadeUp>
          </>
        ) : (
          engine && <EngineDetail engine={engine} onBack={() => go('overview')} />
        )}

        {view !== 'overview' && (
          <FadeUp delay={120}>
            <div className="flex gap-2 mt-8 flex-wrap">
              {ENGINES.filter((e) => e.id !== view).map((e) => (
                <button
                  key={e.id}
                  onClick={() => go(e.id)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 flex items-center gap-2"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <e.icon className="h-4 w-4" style={{ color: e.color }} /> {e.name}
                </button>
              ))}
            </div>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
