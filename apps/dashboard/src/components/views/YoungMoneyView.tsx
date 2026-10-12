'use client';

import { useState, useMemo } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, StatusPill, GlowButton, CinematicBackground,
  BotAvatar, AnimatedNumber,
} from '@/components/design-system';
import {
  DollarSign, Target, Link2, TrendingUp, Wallet, ShieldCheck, Bot,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Clock, Pause,
  Rocket, Sparkles, Brain, Hammer, Radar, HeartHandshake, Handshake,
  CalendarDays, Flag, Ban, CircleDot, ExternalLink,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data — honest state, no fabrication                               */
/* ------------------------------------------------------------------ */

const MONTHLY_TARGET = 10000; // USD — Young Money monthly revenue target
const REVENUE_COLLECTED = 0;  // USD — verified collected revenue

type PlatformId = 'pindrop' | 'shogo' | 'affiliate' | 'quant';

interface Project {
  name: string;
  status: string;
  statusTone: 'good' | 'warn' | 'bad' | 'idle';
  detail: string;
  url?: string; // Clicking the project opens this URL in a new tab
}

interface Platform {
  id: PlatformId;
  name: string;
  tagline: string;
  icon: typeof Target;
  color: string;
  revenue: number;
  projects: Project[];
  botActivity: string;
  blocker: string;
  blockerTone: 'warn' | 'idle' | 'good';
}

const PLATFORMS: Platform[] = [
  {
    id: 'pindrop',
    name: 'PinDrop',
    tagline: 'Outreach engine — websites that sell',
    icon: Target,
    color: '#f59e0b',
    revenue: 0,
    projects: [
      { name: 'Delco Air', status: 'Published & emailed', statusTone: 'good', detail: 'Live site — $299 setup + $39/mo offer sent. Awaiting reply.', url: 'https://delco-air.yoursite.page/' },
      { name: 'Midair', status: 'Prospect #1 — outreach HELD', statusTone: 'warn', detail: 'Scored 75/75. Top TX HVAC target. Waiting on your call: phone or email?' },
      { name: '6 TX HVAC prospects', status: 'Verified — outreach HELD', statusTone: 'warn', detail: 'Scored 52–68/75. Research complete. Same blocker: your outreach decision.' },
    ],
    botActivity: 'Hunter drafted 4 outreach drafts. Scout verified all 7 prospects. Nothing sent — awaiting your decision.',
    blocker: 'You need to decide: phone or email outreach? Until you choose, the team holds.',
    blockerTone: 'warn',
  },
  {
    id: 'shogo',
    name: 'Shogo AI',
    tagline: 'App builder — your ideas, live',
    icon: Rocket,
    color: '#8b5cf6',
    revenue: 0,
    projects: [
      { name: 'BidReady AI', status: 'Building — 1/7 tasks', statusTone: 'idle', detail: '33 files changed, 137 tool calls. In progress.', url: 'https://studio.shogo.ai/' },
      { name: 'QuickBill Invoice Generator', status: 'Building', statusTone: 'idle', detail: 'Chat active, 3.3% context used. In progress.', url: 'https://studio.shogo.ai/' },
      { name: 'Founder Studio site', status: 'Live', statusTone: 'good', detail: 'www.shoppersspotllc.com serving. Redirect fix in flight.', url: 'https://www.shoppersspotllc.com/' },
    ],
    botActivity: 'Shogo is the builder — you direct it in studio.shogo.ai. No ForgeOS bot runs these; they are your builds.',
    blocker: 'None — build at your pace. These become revenue when you launch them.',
    blockerTone: 'good',
  },
  {
    id: 'affiliate',
    name: 'Affiliate Marketing',
    tagline: 'Content that earns while you sleep',
    icon: Link2,
    color: '#10b981',
    revenue: 0,
    projects: [
      { name: 'Soulmate Sketch review', status: 'Ready to publish', statusTone: 'warn', detail: 'Experiment #1. HopLinks verified, compliance 11/11 PASS. Waiting on your go-ahead.', url: 'https://guides.shoppersspotllc.com/' },
      { name: 'ClickBank', status: 'Contract accepted', statusTone: 'good', detail: 'Nickname + vendor ID configured. Ready.' },
      { name: 'Deel / beehiiv / Kit / Amazon', status: 'Queued', statusTone: 'idle', detail: 'Applications submitted or queued. No action needed yet.' },
    ],
    botActivity: 'Analyst prepared the review content and HopLinks. Nothing published yet.',
    blocker: 'You need to say "publish" — the content is ready, it just needs your approval to go live.',
    blockerTone: 'warn',
  },
  {
    id: 'quant',
    name: 'Quant',
    tagline: 'Trading research — capital protected',
    icon: TrendingUp,
    color: '#06b6d4',
    revenue: 0,
    projects: [
      { name: 'Strategy research', status: 'Complete — no edge found', statusTone: 'idle', detail: '5 strategy families tested across 534 candles. Honest result: no deployable edge.' },
      { name: 'Paper trading', status: 'Not operational', statusTone: 'idle', detail: 'Blocked until a viable strategy is found.' },
      { name: 'Live trading', status: 'Disabled', statusTone: 'bad', detail: '$20 hard cap enforced. Requires strategy + your explicit authorization.' },
    ],
    botActivity: 'Quant (researcher) completed the backtest honestly. No fake edge claimed. Standing by.',
    blocker: 'No profitable strategy found yet. Research continues — capital stays at $0 risk until there is a real edge.',
    blockerTone: 'idle',
  },
];

interface Dot {
  name: string;
  role: string;
  expertise: string;
  status: 'Online' | 'Unknown' | 'Busy' | 'Offline';
  isMain?: boolean;
}

const DOTS: Dot[] = [
  { name: 'Muse', role: 'Executive Commander', expertise: 'Runs your Young Money operation. Assigns work to dots, verifies results, reports to you.', status: 'Online', isMain: true },
  { name: 'Scout', role: 'Research Specialist', expertise: 'Finds prospects, verifies businesses, gathers intel. Proven browser-execution path.', status: 'Online' },
  { name: 'Analyst', role: 'Data Analyst', expertise: 'Crunch numbers, score prospects, prepare affiliate content and HopLinks.', status: 'Unknown' },
  { name: 'Craftsman', role: 'Build Engineer', expertise: 'Builds websites and technical assets via PinDrop.', status: 'Unknown' },
  { name: 'Hunter', role: 'Outreach Specialist', expertise: 'Drafts outreach messages. Never sends without your approval.', status: 'Unknown' },
  { name: 'Shepherd', role: 'Relationship Manager', expertise: 'Follows up with prospects, nurtures relationships.', status: 'Unknown' },
  { name: 'Closer', role: 'Deal Closer', expertise: 'Handles pricing, proposals, and closing conversations.', status: 'Unknown' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function daysRemainingInMonth(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, last.getDate() - now.getDate());
}

function monthName(): string {
  return new Date().toLocaleString('en-US', { month: 'long' });
}

function statusColor(tone: Project['statusTone']): string {
  switch (tone) {
    case 'good': return '#10b981';
    case 'warn': return '#f59e0b';
    case 'bad': return '#ef4444';
    default: return 'var(--text-muted)';
  }
}

function dotStatusColor(s: Dot['status']): string {
  switch (s) {
    case 'Online': return '#10b981';
    case 'Busy': return '#f59e0b';
    case 'Offline': return '#ef4444';
    default: return 'var(--text-muted)';
  }
}

/* ------------------------------------------------------------------ */
/*  MIS Header — target, achieved, days left                          */
/* ------------------------------------------------------------------ */

function MisHeader() {
  const days = daysRemainingInMonth();
  const pct = MONTHLY_TARGET > 0 ? Math.round((REVENUE_COLLECTED / MONTHLY_TARGET) * 100) : 0;

  return (
    <GlassPanel glow="#f59e0b" className="mb-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#f59e0b,#eab308)', boxShadow: '0 8px 20px #f59e0b44' }}>
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
              {monthName()} target
            </p>
            <p className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>
              ${MONTHLY_TARGET.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="h-10 w-px" style={{ background: 'var(--border)' }} />

        <div>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
            Achieved so far
          </p>
          <p className="text-2xl font-extrabold" style={{ color: '#10b981' }}>
            $<AnimatedNumber value={REVENUE_COLLECTED} />
            <span className="text-sm font-semibold ml-2" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
          </p>
        </div>

        <div className="h-10 w-px" style={{ background: 'var(--border)' }} />

        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{days}</p>
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
              days left in {monthName()}
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="w-full sm:w-64">
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="h-full rounded-full transition-all"
                 style={{ width: `${Math.min(100, pct)}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            ${(MONTHLY_TARGET - REVENUE_COLLECTED).toLocaleString()} to go
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------ */
/*  Platform cards + expandable detail                                 */
/* ------------------------------------------------------------------ */

function PlatformCard({ platform, expanded, onToggle }: {
  platform: Platform; expanded: boolean; onToggle: () => void;
}) {
  const Icon = platform.icon;
  return (
    <div>
      <GlassPanel hover glow={platform.color} className="cursor-pointer" >
        <div onClick={onToggle}>
          <div className="flex items-start justify-between">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: `linear-gradient(135deg, ${platform.color}, ${platform.color}88)`, boxShadow: `0 8px 20px ${platform.color}44` }}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                         style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>{platform.name}</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{platform.tagline}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>
              ${platform.revenue.toLocaleString()}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: `${platform.color}22`, color: platform.color, border: `1px solid ${platform.color}44` }}>
              {platform.projects.length} projects
            </span>
          </div>
        </div>
      </GlassPanel>

      {expanded && (
        <FadeUp>
          <GlassPanel className="mt-3" glow={platform.color}>
            {/* Projects */}
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Flag className="h-4 w-4" style={{ color: platform.color }} /> Projects
            </h4>
            <div className="space-y-2 mb-5">
              {platform.projects.map((p) => {
                const inner = (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                        {p.name}
                        {p.url && <ExternalLink className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />}
                      </p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: `${statusColor(p.statusTone)}22`, color: statusColor(p.statusTone) }}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{p.detail}</p>
                  </>
                );
                return p.url ? (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                     className="block p-3 rounded-xl transition-all hover:scale-[1.01]"
                     style={{ background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                    {inner}
                  </a>
                ) : (
                  <div key={p.name} className="p-3 rounded-xl"
                       style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    {inner}
                  </div>
                );
              })}
            </div>

            {/* Bot activity */}
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Bot className="h-4 w-4" style={{ color: platform.color }} /> What the bots are doing
            </h4>
            <p className="text-sm mb-5 p-3 rounded-xl" style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {platform.botActivity}
            </p>

            {/* Blocker — plain language */}
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              {platform.blockerTone === 'good'
                ? <CheckCircle2 className="h-4 w-4" style={{ color: '#10b981' }} />
                : platform.blockerTone === 'warn'
                  ? <AlertTriangle className="h-4 w-4" style={{ color: '#f59e0b' }} />
                  : <Ban className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />}
              Why no revenue yet — in plain words
            </h4>
            <p className="text-sm p-3 rounded-xl" style={{
              background: platform.blockerTone === 'warn' ? '#f59e0b11' : 'var(--surface)',
              color: 'var(--text-secondary)',
              border: `1px solid ${platform.blockerTone === 'warn' ? '#f59e0b44' : 'var(--border)'}`,
            }}>
              {platform.blocker}
            </p>
          </GlassPanel>
        </FadeUp>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dots section                                                       */
/* ------------------------------------------------------------------ */

function DotsSection() {
  const main = DOTS.find((d) => d.isMain)!;
  const rest = DOTS.filter((d) => !d.isMain);

  return (
    <div className="mt-10">
      <FadeUp>
        <h2 className="text-xl font-extrabold mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Sparkles className="h-5 w-5" style={{ color: '#f59e0b' }} /> Your Team
        </h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
          The dots running Young Money under Muse's command.
        </p>
      </FadeUp>

      {/* Main DOT */}
      <FadeUp>
        <GlassPanel glow="#f59e0b" className="mb-4">
          <div className="flex items-center gap-4">
            <BotAvatar name={main.name} emoji="🤖" size={56} status="online" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-lg" style={{ color: 'var(--text)' }}>{main.name}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'linear-gradient(135deg,#f59e0b,#eab308)', color: '#fff' }}>
                  MAIN DOT
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: dotStatusColor(main.status) }} />
                  <span style={{ color: dotStatusColor(main.status) }}>{main.status}</span>
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{main.role}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{main.expertise}</p>
            </div>
          </div>
        </GlassPanel>
      </FadeUp>

      {/* Other dots */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rest.map((d, i) => (
          <FadeUp key={d.name} delay={i * 60}>
            <GlassPanel hover padding="p-4">
              <div className="flex items-center gap-3 mb-2">
                <BotAvatar name={d.name} emoji="🤖" size={40} status={d.status === 'Online' ? 'online' : d.status === 'Busy' ? 'busy' : 'unknown'} />
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{d.name}</p>
                  <p className="text-xs" style={{ color: 'var(--accent)' }}>{d.role}</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full" style={{ background: dotStatusColor(d.status) }} />
                  <span style={{ color: dotStatusColor(d.status) }}>{d.status}</span>
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.expertise}</p>
            </GlassPanel>
          </FadeUp>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main view                                                          */
/* ------------------------------------------------------------------ */

export function YoungMoneyView() {
  const [open, setOpen] = useState<PlatformId | null>(null);

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="youngmoney" />
      <div className="relative p-8 max-w-7xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Revenue Operating System"
            title="Young Money"
            description="Your revenue playground. Every platform, every project, every bot — one executive view."
            accent="#f59e0b"
          />
        </FadeUp>

        <FadeUp delay={60}>
          <MisHeader />
        </FadeUp>

        <FadeUp delay={100}>
          <h2 className="text-xl font-extrabold mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Rocket className="h-5 w-5" style={{ color: '#f59e0b' }} /> Platforms
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Tap a platform to see its projects, bot activity, and what's blocking revenue.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORMS.map((p, i) => (
            <FadeUp key={p.id} delay={i * 70}>
              <PlatformCard
                platform={p}
                expanded={open === p.id}
                onToggle={() => setOpen(open === p.id ? null : p.id)}
              />
            </FadeUp>
          ))}
        </div>

        <DotsSection />

        <FadeUp delay={200}>
          <GlassPanel className="mt-8 text-center py-6">
            <DollarSign className="h-8 w-8 mx-auto mb-2" style={{ color: '#f59e0b' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              ${(MONTHLY_TARGET - REVENUE_COLLECTED).toLocaleString()} to go in {monthName()}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Unblock a platform above to start the climb.
            </p>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
