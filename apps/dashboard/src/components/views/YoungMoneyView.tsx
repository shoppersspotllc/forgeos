'use client';

import { useState } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, CinematicBackground,
  BotAvatar, AnimatedNumber,
} from '@/components/design-system';
import {
  DollarSign, Target, Link2, TrendingUp,
  ChevronRight, AlertTriangle, CheckCircle2, Clock,
  Rocket, Sparkles, Bot, ArrowLeft,
  CalendarDays, Flag, ExternalLink, PlayCircle,
  ShieldCheck, Megaphone, FlaskConical, Code2, Handshake,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data — honest state, no fabrication                               */
/* ------------------------------------------------------------------ */

const MONTHLY_TARGET = 10000;
const REVENUE_COLLECTED = 0;

type PlatformId = 'pindrop' | 'shogo' | 'affiliate' | 'quant';

interface RevenuePlaybook {
  whereNow: string;
  whatsStopping: string;
  whatToDo: string[];
  resolution: string; // concrete next action
}

interface Project {
  name: string;
  status: string;
  statusTone: 'good' | 'warn' | 'bad' | 'idle';
  url?: string;
  playbook: RevenuePlaybook;
}

interface DotAssignment {
  dot: string;
  function: string; // sales, marketing, research, development, safety
  doing: string;
}

interface Platform {
  id: PlatformId;
  name: string;
  tagline: string;
  icon: typeof Target;
  color: string;
  revenue: number;
  projects: Project[];
  dots: DotAssignment[];
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
      {
        name: 'Delco Air', status: 'Published & emailed', statusTone: 'good',
        url: 'https://delco-air.yoursite.page/',
        playbook: {
          whereNow: 'Website is live. Offer email ($299 setup + $39/mo) sent to delco_air@yahoo.com. No reply yet.',
          whatsStopping: 'Waiting on the prospect to respond. One email is easy to miss or ignore.',
          whatToDo: [
            'Follow up with a second email in 2 days (reminder scheduled Oct 14)',
            'If no reply, Hunter calls the business directly',
            'Offer a 15-min free site audit as a hook',
          ],
          resolution: 'Follow-up reminder is set for Oct 14. If no reply, approve the phone call and Hunter dials.',
        },
      },
      {
        name: 'Midair', status: 'Prospect #1 — outreach HELD', statusTone: 'warn',
        playbook: {
          whereNow: 'Scored 75/75 — top TX HVAC target. Research complete. Zero outreach sent.',
          whatsStopping: 'You have not decided: phone or email outreach. The team cannot act without your call.',
          whatToDo: [
            'You decide: phone or email (one word from you)',
            'Hunter sends/calls within 24h of your decision',
            'Shepherd follows up in 3 days if no response',
          ],
          resolution: 'Tell Muse "phone" or "email" — outreach launches the same day.',
        },
      },
      {
        name: '6 TX HVAC prospects', status: 'Verified — outreach HELD', statusTone: 'warn',
        playbook: {
          whereNow: '6 verified prospects scored 52–68/75. Research done. Zero outreach sent.',
          whatsStopping: 'Same blocker as Midair — your outreach channel decision holds all 7 prospects.',
          whatToDo: [
            'Batch outreach once you decide the channel',
            'Prioritize by score: highest first',
            'Track replies in one sheet so nothing slips',
          ],
          resolution: 'One decision from you unlocks all 7 prospects at once.',
        },
      },
    ],
    dots: [
      { dot: 'Scout', function: 'Research', doing: 'Verified all 7 prospects, scored 52–75/75' },
      { dot: 'Hunter', function: 'Sales', doing: 'Drafted 4 outreach emails — held, awaiting your channel decision' },
      { dot: 'Craftsman', function: 'Development', doing: 'Built & published Delco Air site' },
      { dot: 'Shepherd', function: 'Marketing', doing: 'Standing by for follow-up sequences' },
      { dot: 'Closer', function: 'Sales', doing: 'Ready with $299/$39 pricing playbook when a prospect bites' },
    ],
  },
  {
    id: 'shogo',
    name: 'Shogo AI',
    tagline: 'App builder — your ideas, live',
    icon: Rocket,
    color: '#8b5cf6',
    revenue: 0,
    projects: [
      {
        name: 'BidReady AI', status: 'Building — 1/7 tasks', statusTone: 'idle',
        url: 'https://studio.shogo.ai/',
        playbook: {
          whereNow: '33 files changed, 137 tool calls. Task 1 of 7 in progress.',
          whatsStopping: 'Build is mid-flight — needs your direction in Shogo Studio to continue.',
          whatToDo: [
            'Open the project in Shogo Studio and review task 1 output',
            'Approve or redirect, then let it continue to task 2',
            'Plan the launch: pricing + landing page when build completes',
          ],
          resolution: 'Open studio.shogo.ai, review, and keep the build moving.',
        },
      },
      {
        name: 'QuickBill Invoice Generator', status: 'Building', statusTone: 'idle',
        url: 'https://studio.shogo.ai/',
        playbook: {
          whereNow: 'Chat active, 3.3% context used. Early build stage.',
          whatsStopping: 'Needs your input to shape the product — features, pricing, target user.',
          whatToDo: [
            'Define the MVP scope in the Shogo chat',
            'Set a launch date to force focus',
            'Line up 3 beta users from your network',
          ],
          resolution: 'Spend 20 minutes in the Shogo chat defining the MVP.',
        },
      },
      {
        name: 'Founder Studio site', status: 'Live', statusTone: 'good',
        url: 'https://www.shoppersspotllc.com/',
        playbook: {
          whereNow: 'Live at www.shoppersspotllc.com. Founder Studio → secret code → ForgeOS journey in flight.',
          whatsStopping: 'Nothing blocking — site is live. Next: drive traffic to it.',
          whatToDo: [
            'Share the site with your network',
            'Add it to your email signature and socials',
            'Track visits — add analytics when ready',
          ],
          resolution: 'Site is live. Marketing it is the next lever.',
        },
      },
    ],
    dots: [
      { dot: 'Craftsman', function: 'Development', doing: 'Supports Shogo builds with technical review' },
      { dot: 'Muse', function: 'Research', doing: 'Tracks build progress, reports blockers to you' },
    ],
  },
  {
    id: 'affiliate',
    name: 'Affiliate Marketing',
    tagline: 'Content that earns while you sleep',
    icon: Link2,
    color: '#10b981',
    revenue: 0,
    projects: [
      {
        name: 'Soulmate Sketch review', status: 'Ready to publish', statusTone: 'warn',
        url: 'https://guides.shoppersspotllc.com/',
        playbook: {
          whereNow: 'Experiment #1 complete. HopLinks verified, compliance 11/11 PASS. Not published.',
          whatsStopping: 'Waiting on your "publish" approval. Content is done — it just needs your go-ahead.',
          whatToDo: [
            'You say "publish" — article goes live on guides.shoppersspotllc.com',
            'Share to Pinterest + dev.to for traffic',
            'Track clicks via the revenue API; first commission validates the funnel',
          ],
          resolution: 'One word from you — "publish" — and the first affiliate funnel is live.',
        },
      },
      {
        name: 'ClickBank', status: 'Contract accepted', statusTone: 'good',
        playbook: {
          whereNow: 'Nickname + vendor ID configured as Vercel secrets. HopLink format verified.',
          whatsStopping: 'Nothing — ready. It earns when the Soulmate review publishes and gets traffic.',
          whatToDo: ['Publish the review', 'Drive traffic', 'Watch for first commission'],
          resolution: 'Tied to the Soulmate publish — same "go" unlocks it.',
        },
      },
      {
        name: 'Deel / beehiiv / Kit / Amazon', status: 'Queued', statusTone: 'idle',
        playbook: {
          whereNow: 'Applications submitted or queued. No action needed yet.',
          whatsStopping: 'Waiting on platform approvals — outside our control.',
          whatToDo: ['Monitor application statuses', 'Start with ClickBank (already accepted)'],
          resolution: 'No action — focus energy on the ClickBank funnel first.',
        },
      },
    ],
    dots: [
      { dot: 'Analyst', function: 'Marketing', doing: 'Wrote the review, verified HopLinks, passed compliance 11/11' },
      { dot: 'Scout', function: 'Research', doing: 'Researched the Soulmate Sketch offer and angle' },
      { dot: 'Muse', function: 'Safety', doing: 'Enforces compliance-first rule: value content, no link spam' },
    ],
  },
  {
    id: 'quant',
    name: 'Quant',
    tagline: 'Trading research — capital protected',
    icon: TrendingUp,
    color: '#06b6d4',
    revenue: 0,
    projects: [
      {
        name: 'Strategy research', status: 'Complete — no edge found', statusTone: 'idle',
        playbook: {
          whereNow: '5 strategy families tested across 534 daily candles, walk-forward validated.',
          whatsStopping: 'No defensible edge found. Honest result — no fake strategy deployed.',
          whatToDo: [
            'Define a new hypothesis with a clear stopping rule',
            'Test on fresh data — do not re-mine the same candles',
            'Keep capital at $0 until a real edge validates out-of-sample',
          ],
          resolution: 'Research continues. No action needed — capital is safe.',
        },
      },
      {
        name: 'Paper trading', status: 'Not operational', statusTone: 'idle',
        playbook: {
          whereNow: 'Infrastructure ready. Not started — blocked on strategy.',
          whatsStopping: 'Paper trading a strategy with no edge teaches nothing.',
          whatToDo: ['Find edge first', 'Then paper trade for 30 days minimum'],
          resolution: 'Blocked correctly. Unblocks when research finds an edge.',
        },
      },
      {
        name: 'Live trading', status: 'Disabled', statusTone: 'bad',
        playbook: {
          whereNow: '$0 at risk. $20 hard cap enforced in code. Live execution disabled.',
          whatsStopping: 'Requires: viable strategy + paper validation + risk cert + your explicit authorization.',
          whatToDo: ['Complete the gate sequence', 'You authorize explicitly — never auto-enables'],
          resolution: 'Stays disabled. This is the safety working as designed.',
        },
      },
    ],
    dots: [
      { dot: 'Analyst', function: 'Research', doing: 'Ran the 5-family backtest honestly — reported no edge' },
      { dot: 'Muse', function: 'Safety', doing: 'Enforces $20 cap, gate sequence, no-auto-enable rule' },
    ],
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
  { name: 'Muse', role: 'Executive Commander', expertise: 'Runs your Young Money operation. Assigns work, verifies results, enforces safety.', status: 'Online', isMain: true },
  { name: 'Scout', role: 'Research Specialist', expertise: 'Prospect research, verification, intel gathering.', status: 'Online' },
  { name: 'Analyst', role: 'Data Analyst', expertise: 'Scoring, content, HopLinks, backtesting.', status: 'Unknown' },
  { name: 'Craftsman', role: 'Build Engineer', expertise: 'Websites and technical builds.', status: 'Unknown' },
  { name: 'Hunter', role: 'Outreach Specialist', expertise: 'Outreach drafts. Never sends without approval.', status: 'Unknown' },
  { name: 'Shepherd', role: 'Relationship Manager', expertise: 'Follow-ups and relationship nurturing.', status: 'Unknown' },
  { name: 'Closer', role: 'Deal Closer', expertise: 'Pricing, proposals, closing.', status: 'Unknown' },
];

const FUNCTION_ICONS: Record<string, typeof Megaphone> = {
  Sales: Handshake,
  Marketing: Megaphone,
  Research: FlaskConical,
  Development: Code2,
  Safety: ShieldCheck,
};

/* ------------------------------------------------------------------ */

function daysRemainingInMonth(): number {
  const now = new Date();
  return Math.max(0, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate());
}
function monthName(): string {
  return new Date().toLocaleString('en-US', { month: 'long' });
}
function toneColor(t: 'good' | 'warn' | 'bad' | 'idle'): string {
  return t === 'good' ? '#10b981' : t === 'warn' ? '#f59e0b' : t === 'bad' ? '#ef4444' : 'var(--text-muted)';
}
function dotColor(s: Dot['status']): string {
  return s === 'Online' ? '#10b981' : s === 'Busy' ? '#f59e0b' : s === 'Offline' ? '#ef4444' : 'var(--text-muted)';
}

/* ------------------------------------------------------------------ */
/*  MIS header                                                        */
/* ------------------------------------------------------------------ */

function MisHeader() {
  const days = daysRemainingInMonth();
  const pct = MONTHLY_TARGET > 0 ? Math.round((REVENUE_COLLECTED / MONTHLY_TARGET) * 100) : 0;
  return (
    <GlassPanel glow="#f59e0b" className="mb-6">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>{monthName()} target</p>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>${MONTHLY_TARGET.toLocaleString()}</p>
        </div>
        <div className="h-10 w-px" style={{ background: 'var(--border)' }} />
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Achieved so far</p>
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
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>days left</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="w-full sm:w-64">
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>${(MONTHLY_TARGET - REVENUE_COLLECTED).toLocaleString()} to go</p>
        </div>
      </div>
    </GlassPanel>
  );
}

/* ------------------------------------------------------------------ */
/*  Platform detail — the drill-down dashboard                        */
/* ------------------------------------------------------------------ */

function PlatformDetail({ platform, onBack }: { platform: Platform; onBack: () => void }) {
  const Icon = platform.icon;
  const liveCount = platform.projects.filter((p) => p.statusTone === 'good').length;

  return (
    <FadeUp>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold mb-4 px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
        <ArrowLeft className="h-4 w-4" /> All platforms
      </button>

      {/* Platform header + stats */}
      <GlassPanel glow={platform.color} className="mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
               style={{ background: `linear-gradient(135deg, ${platform.color}, ${platform.color}88)`, boxShadow: `0 8px 20px ${platform.color}44` }}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{platform.name}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{platform.tagline}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Projects created', value: String(platform.projects.length) },
            { label: 'Live now', value: String(liveCount) },
            { label: 'Revenue', value: `$${platform.revenue.toLocaleString()}` },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{s.value}</p>
              <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Projects with revenue playbooks */}
      <h3 className="text-lg font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Flag className="h-5 w-5" style={{ color: platform.color }} /> Projects & revenue playbook
      </h3>
      <div className="space-y-4 mb-8">
        {platform.projects.map((p) => (
          <GlassPanel key={p.name}>
            <div className="flex items-center justify-between gap-2 mb-3">
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                   className="font-bold text-base flex items-center gap-1.5 hover:opacity-80"
                   style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  {p.name} <ExternalLink className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                </a>
              ) : (
                <p className="font-bold text-base" style={{ color: 'var(--text)' }}>{p.name}</p>
              )}
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ background: `${toneColor(p.statusTone)}22`, color: toneColor(p.statusTone) }}>
                {p.status}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: platform.color }}>Where are we now</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.playbook.whereNow}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: '#f59e0b0d', border: '1px solid #f59e0b33' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: '#f59e0b' }}>
                  <AlertTriangle className="h-3.5 w-3.5" /> What's stopping us
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.playbook.whatsStopping}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl mt-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>What can be done — best path to revenue</p>
              <ul className="space-y-1.5">
                {p.playbook.whatToDo.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3 mt-3 p-3 rounded-xl"
                 style={{ background: `linear-gradient(135deg, ${platform.color}18, transparent)`, border: `1px solid ${platform.color}44` }}>
              <PlayCircle className="h-5 w-5 shrink-0" style={{ color: platform.color }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.playbook.resolution}</p>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Dots on this platform */}
      <h3 className="text-lg font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Bot className="h-5 w-5" style={{ color: platform.color }} /> Dots on {platform.name}
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {platform.dots.map((d) => {
          const FIcon = FUNCTION_ICONS[d.function] || Bot;
          return (
            <GlassPanel key={d.dot} padding="p-4" hover>
              <div className="flex items-center gap-2 mb-1.5">
                <FIcon className="h-4 w-4" style={{ color: platform.color }} />
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{d.dot}</p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-auto"
                      style={{ background: `${platform.color}22`, color: platform.color }}>
                  {d.function}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.doing}</p>
            </GlassPanel>
          );
        })}
      </div>
    </FadeUp>
  );
}

/* ------------------------------------------------------------------ */
/*  Dots section (overview)                                           */
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
          Sales, marketing, research, development, safety — covered.
        </p>
      </FadeUp>
      <FadeUp>
        <GlassPanel glow="#f59e0b" className="mb-4">
          <div className="flex items-center gap-4">
            <BotAvatar name={main.name} emoji="🤖" size={56} status="online" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-extrabold text-lg" style={{ color: 'var(--text)' }}>{main.name}</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#f59e0b,#eab308)', color: '#fff' }}>MAIN DOT</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: dotColor(main.status) }} />
                  <span style={{ color: dotColor(main.status) }}>{main.status}</span>
                </span>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{main.role}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{main.expertise}</p>
            </div>
          </div>
        </GlassPanel>
      </FadeUp>
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
                  <span className="h-2 w-2 rounded-full" style={{ background: dotColor(d.status) }} />
                  <span style={{ color: dotColor(d.status) }}>{d.status}</span>
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
/*  Main view                                                         */
/* ------------------------------------------------------------------ */

export function YoungMoneyView() {
  const [selected, setSelected] = useState<PlatformId | null>(null);
  const platform = PLATFORMS.find((p) => p.id === selected) || null;

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

        <FadeUp delay={60}><MisHeader /></FadeUp>

        {platform ? (
          <PlatformDetail platform={platform} onBack={() => setSelected(null)} />
        ) : (
          <>
            <FadeUp delay={100}>
              <h2 className="text-xl font-extrabold mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Rocket className="h-5 w-5" style={{ color: '#f59e0b' }} /> Platforms
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                Tap a platform to open its status dashboard — projects, revenue playbook, and dots.
              </p>
            </FadeUp>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLATFORMS.map((p, i) => {
                const Icon = p.icon;
                const live = p.projects.filter((x) => x.statusTone === 'good').length;
                return (
                  <FadeUp key={p.id} delay={i * 70}>
                    <GlassPanel hover glow={p.color} className="cursor-pointer h-full">
                      <div onClick={() => setSelected(p.id)}>
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                             style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}88)`, boxShadow: `0 8px 20px ${p.color}44` }}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>{p.name}</h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{p.tagline}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>${p.revenue.toLocaleString()}</span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                style={{ background: `${p.color}22`, color: p.color, border: `1px solid ${p.color}44` }}>
                            {p.projects.length} projects · {live} live
                          </span>
                        </div>
                        <span className="text-sm font-semibold flex items-center gap-1" style={{ color: p.color }}>
                          Open dashboard <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </GlassPanel>
                  </FadeUp>
                );
              })}
            </div>
            <DotsSection />
          </>
        )}

        <FadeUp delay={200}>
          <GlassPanel className="mt-8 text-center py-6">
            <DollarSign className="h-8 w-8 mx-auto mb-2" style={{ color: '#f59e0b' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              ${(MONTHLY_TARGET - REVENUE_COLLECTED).toLocaleString()} to go in {monthName()}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Open a platform above to see exactly how to get there.
            </p>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
