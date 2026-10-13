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
  CalendarDays, Flag, ExternalLink, PlayCircle, Wrench, MousePointerClick, User, Zap,
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
  createdBy: string; // creator info
  createdOn?: string;
  playbook: RevenuePlaybook;
}

interface DotAssignment {
  dot: string;
  emoji?: string; // resolved via DOT_EMOJI lookup — actual OpenDots avatar
  function: string; // sales, marketing, research, development, safety
  doing: string;
  intro: string; // first-person introduction
  expertise: string[];
  preparedness: string; // how ready they are
  canDo: string; // what they can do for this platform's projects
}

/* Actual OpenDots avatars — preserved across the dashboard */
const DOT_EMOJI: Record<string, string> = {
  'Muse': '🤖',
  'Scout': '🔍',
  'Analyst': '📊',
  'Craftsman': '🔨',
  'Hunter': '🎯',
  'Shepherd': '🐑',
  'Closer': '💰',
};

interface Platform {
  id: PlatformId;
  name: string;
  tagline: string;
  icon: typeof Target;
  color: string;
  revenue: number;
  dashboardUrl?: string; // main external dashboard for this platform
  dashboardLabel?: string;
  projects: Project[];
  dots: DotAssignment[];
  credits?: {
    total: number;
    available: number;
    used: number;
    refreshDay: number; // day of month credits refresh
  };
}

/* PinDrop credits: 2,000/mo plan, 1,750 remaining as of 2026-10-12, refresh on the 30th */
function daysUntilRefresh(refreshDay: number): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  let target = new Date(y, m, refreshDay);
  if (target <= now) {
    target = new Date(y, m + 1, refreshDay);
  }
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const PLATFORMS: Platform[] = [
  {
    id: 'pindrop',
    name: 'PinDrop',
    tagline: 'Outreach engine — websites that sell',
    icon: Target,
    color: '#f59e0b',
    revenue: 0,
    dashboardUrl: 'https://pindrop.host/dashboard',
    dashboardLabel: 'Open PinDrop Dashboard',
    credits: {
      total: 2000,
      available: 1450,
      used: 550,
      refreshDay: 30,
    },
    projects: [
      {
        name: 'Maria Herrera Real Estate', status: 'Live — ready for outreach', statusTone: 'good',
        url: 'https://maria-herrera-real-estate.yoursite.page/',
        createdBy: 'Craftsman',
        createdOn: 'Oct 2026',
        playbook: {
          whereNow: 'Website is live. SMS/email templates ready in PinDrop. Sender name shows "shoppers" — must be changed to "Dexter from Shoppers Spot LLC" per send until support fixes it.',
          whatsStopping: 'Owner outreach not yet sent. Awaiting Dexter\'s approval to send.',
          whatToDo: [
            'Dexter reviews SMS/email templates in PinDrop',
            'Dexter sends from his phone/email with corrected sender name',
            'Follow up in 2 days if no reply',
          ],
          resolution: 'Templates ready. Awaiting owner approval to send first outreach.',
        },
      },
      {
        name: 'Eleanor Wong Cornett Real Estate', status: 'Live — ready for outreach', statusTone: 'good',
        url: 'https://eleanor-wong-cornett-real-estate.yoursite.page/',
        createdBy: 'Craftsman',
        createdOn: 'Oct 2026',
        playbook: {
          whereNow: 'Website is live. SMS/email templates ready in PinDrop. Sender name shows "shoppers" — must be changed to "Dexter from Shoppers Spot LLC" per send.',
          whatsStopping: 'Owner outreach not yet sent. Awaiting Dexter\'s approval.',
          whatToDo: [
            'Dexter reviews templates and sends with corrected sender name',
            'Follow up in 2 days if no reply',
          ],
          resolution: 'Templates ready. Awaiting owner approval to send.',
        },
      },
      {
        name: 'Main Element Hair Studio', status: 'Live — newly published', statusTone: 'good',
        url: 'https://main-element-hair-studio.yoursite.page/',
        createdBy: 'Craftsman',
        createdOn: 'Oct 2026',
        playbook: {
          whereNow: 'Website is live. Booking form, click-to-call (832) 823-4244 verified. Form sends to placeholder email — needs owner\'s real email before outreach.',
          whatsStopping: 'Need the salon\'s real email for form submissions.',
          whatToDo: [
            'Obtain owner email and update form destination',
            'Prepare outreach templates in PinDrop',
            'Dexter approves and sends outreach',
          ],
          resolution: 'Get real email first, then proceed to outreach.',
        },
      },
      {
        name: 'Liliana Matcas — Legacy Shift Insurance', status: 'Live — newly published', statusTone: 'good',
        url: 'https://liliana-matcas.yoursite.page/',
        createdBy: 'Craftsman',
        createdOn: 'Oct 2026',
        playbook: {
          whereNow: 'Website is live. Quote form with consent checkbox, click-to-call (312) 439-2526 verified. No coverage guarantees. Form sends to placeholder — needs real email.',
          whatsStopping: 'Need Liliana\'s real email for quote form submissions.',
          whatToDo: [
            'Obtain real email and update form destination',
            'Prepare outreach templates',
            'Dexter approves and sends',
          ],
          resolution: 'Get real email first, then outreach.',
        },
      },
      {
        name: 'Delco Air', status: 'Published & emailed', statusTone: 'good',
        url: 'https://delco-air.yoursite.page/',
        createdBy: 'Craftsman',
        createdOn: 'Oct 2026',
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
    ],
    dots: [
      {
        dot: 'Scout', function: 'Research',
        doing: 'Verified all 7 prospects, scored 52–75/75',
        intro: "I'm Scout — your eyes on the market. I find real businesses, verify they're legit, and score them so you only chase winners.",
        expertise: ['Prospect research', 'Verification', 'Lead scoring', 'Market intel'],
        preparedness: 'Ready — research systems hot',
        canDo: 'I can find 10 new verified prospects for any niche and location you name, scored and ranked, within hours.',
      },
      {
        dot: 'Hunter', function: 'Sales',
        doing: 'Drafted 4 outreach emails — held, awaiting your channel decision',
        intro: "I'm Hunter — I start conversations that turn into customers. I write outreach that gets opened, read, and replied to.",
        expertise: ['Cold outreach', 'Email copy', 'Follow-up sequences', 'Objection handling'],
        preparedness: 'Ready — 4 drafts written, waiting on your go',
        canDo: 'I can launch outreach to any prospect list the moment you approve the channel — email or phone, your call.',
      },
      {
        dot: 'Craftsman', function: 'Development',
        doing: 'Built & published Delco Air site',
        intro: "I'm Craftsman — I build the websites that sell. Professional, fast, mobile-perfect. I built Delco Air live.",
        expertise: ['Website builds', 'PinDrop platform', 'Mobile optimization', 'Fast deployment'],
        preparedness: 'Ready — Delco Air proves the pipeline works',
        canDo: 'I can build a professional site for any business in under a day, using minimal credits via proven templates.',
      },
      {
        dot: 'Shepherd', function: 'Marketing',
        doing: 'Standing by for follow-up sequences',
        intro: "I'm Shepherd — I nurture relationships so no lead goes cold. Follow-ups are where deals are won, and that's my territory.",
        expertise: ['Follow-up sequences', 'Relationship nurturing', 'Re-engagement', 'Trust building'],
        preparedness: 'Standing by — sequences drafted, ready to deploy',
        canDo: 'I can run automated follow-up sequences for every prospect — 3, 7, and 14-day touches that keep you top of mind.',
      },
      {
        dot: 'Closer', function: 'Sales',
        doing: 'Ready with $299/$39 pricing playbook when a prospect bites',
        intro: "I'm Closer — I turn interested prospects into paying customers. When someone bites, I know exactly what to say.",
        expertise: ['Deal closing', 'Pricing strategy', 'Proposal writing', 'Negotiation'],
        preparedness: 'Ready — $299/$39 playbook locked and loaded',
        canDo: 'When a prospect shows interest, I take over with the pricing playbook and close the $299 setup + $39/mo deal.',
      },
      {
        dot: 'Muse', function: 'Safety',
        doing: 'Enforces the safety rule: no outreach sent without your explicit approval',
        intro: "I'm Muse — I run this entire operation. I assign work, verify results, protect your credits, and make sure nothing moves without your word.",
        expertise: ['Executive command', 'Quality control', 'Credit protection', 'Team coordination'],
        preparedness: 'Online — commanding this dashboard right now',
        canDo: 'I coordinate all Dots, enforce your approval gates, and report honest status. Nothing happens without your approval.',
      },
    ],
  },
  {
    id: 'shogo',
    name: 'Shogo AI',
    tagline: 'App builder — your ideas, live',
    icon: Rocket,
    color: '#8b5cf6',
    revenue: 0,
    dashboardUrl: 'https://studio.shogo.ai/',
    dashboardLabel: 'Open Shogo Studio',
    projects: [
      {
        name: 'BidReady AI', status: 'Building — 1/7 tasks', statusTone: 'idle',
        url: 'https://studio.shogo.ai/',
        createdBy: 'Shogo AI',
        createdOn: 'Oct 2026',
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
        createdBy: 'Shogo AI',
        createdOn: 'Oct 2026',
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
        createdBy: 'Shogo AI',
        createdOn: 'Oct 2026',
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
      {
        dot: 'Craftsman', function: 'Development',
        doing: 'Supports Shogo builds with technical review',
        intro: "I'm Craftsman — I make sure what Shogo builds is solid. I review the technical work and catch issues before they become problems.",
        expertise: ['Technical review', 'App architecture', 'Code quality', 'Shogo platform'],
        preparedness: 'Ready — monitoring all active builds',
        canDo: 'I can review any Shogo build for quality, suggest improvements, and help unblock technical issues.',
      },
      {
        dot: 'Muse', function: 'Research',
        doing: 'Tracks build progress, reports blockers to you',
        intro: "I'm Muse — I keep your Shogo projects on track. I monitor build progress, flag blockers, and make sure nothing stalls silently.",
        expertise: ['Progress tracking', 'Blocker identification', 'Build coordination', 'Status reporting'],
        preparedness: 'Online — tracking BidReady AI and QuickBill now',
        canDo: 'I track every build task, alert you the moment something needs your input, and keep the momentum going.',
      },
    ],
  },
  {
    id: 'affiliate',
    name: 'Affiliate Marketing',
    tagline: 'Content that earns while you sleep',
    icon: Link2,
    color: '#10b981',
    revenue: 0,
    dashboardUrl: 'https://accounts.clickbank.com/',
    dashboardLabel: 'Open ClickBank Dashboard',
    projects: [
      {
        name: 'Soulmate Sketch review', status: 'Ready to publish', statusTone: 'warn',
        url: 'https://guides.shoppersspotllc.com/',
        createdBy: 'Analyst',
        createdOn: 'Oct 2026',
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
        createdBy: 'Muse',
        createdOn: 'Oct 2026',
        playbook: {
          whereNow: 'Nickname + vendor ID configured as Vercel secrets. HopLink format verified.',
          whatsStopping: 'Nothing — ready. It earns when the Soulmate review publishes and gets traffic.',
          whatToDo: ['Publish the review', 'Drive traffic', 'Watch for first commission'],
          resolution: 'Tied to the Soulmate publish — same "go" unlocks it.',
        },
      },
    ],
    dots: [
      {
        dot: 'Analyst', function: 'Marketing',
        doing: 'Wrote the review, verified HopLinks, passed compliance 11/11',
        intro: "I'm Analyst — I create content that earns. I wrote the Soulmate Sketch review, verified every link, and passed compliance 11/11.",
        expertise: ['Content writing', 'Affiliate compliance', 'HopLink verification', 'SEO'],
        preparedness: 'Ready — review written, links verified',
        canDo: 'I can write the next review, verify all tracking links, and ensure every piece passes compliance before it publishes.',
      },
      {
        dot: 'Scout', function: 'Research',
        doing: 'Researched the Soulmate Sketch offer and angle',
        intro: "I'm Scout — I find the offers worth promoting. I research affiliate programs, check their reputation, and find the winning angle.",
        expertise: ['Offer research', 'Niche analysis', 'Competitor intel', 'Trend spotting'],
        preparedness: 'Ready — scanning for the next winning offer',
        canDo: 'I can research 5 new affiliate offers in any niche, vet them for legitimacy, and recommend the best one to promote next.',
      },
      {
        dot: 'Muse', function: 'Safety',
        doing: 'Enforces compliance-first rule: value content, no link spam',
        intro: "I'm Muse — I protect your reputation. Every affiliate piece passes my compliance check: real value first, no spam, no shortcuts.",
        expertise: ['Compliance enforcement', 'Quality control', 'Brand protection', 'Risk management'],
        preparedness: 'Online — guarding every publish',
        canDo: 'I review every affiliate post before it goes live. If it does not genuinely help the reader, it does not publish.',
      },
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
        createdBy: 'Analyst',
        createdOn: 'Oct 2026',
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
        createdBy: 'Muse',
        createdOn: '—',
        playbook: {
          whereNow: 'Infrastructure ready. Not started — blocked on strategy.',
          whatsStopping: 'Paper trading a strategy with no edge teaches nothing.',
          whatToDo: ['Find edge first', 'Then paper trade for 30 days minimum'],
          resolution: 'Blocked correctly. Unblocks when research finds an edge.',
        },
      },
      {
        name: 'Live trading', status: 'Disabled', statusTone: 'bad',
        createdBy: 'Muse',
        createdOn: '—',
        playbook: {
          whereNow: '$0 at risk. $20 hard cap enforced in code. Live execution disabled.',
          whatsStopping: 'Requires: viable strategy + paper validation + risk cert + your explicit authorization.',
          whatToDo: ['Complete the gate sequence', 'You authorize explicitly — never auto-enables'],
          resolution: 'Stays disabled. This is the safety working as designed.',
        },
      },
    ],
    dots: [
      {
        dot: 'Analyst', function: 'Research',
        doing: 'Ran the 5-family backtest honestly — reported no edge',
        intro: "I'm Analyst — I test trading ideas with brutal honesty. I ran 5 strategy families across 534 candles and told you the truth: no edge found.",
        expertise: ['Backtesting', 'Statistical analysis', 'Strategy validation', 'Risk modeling'],
        preparedness: 'Ready — research framework built and proven',
        canDo: 'I can test any new trading hypothesis with proper walk-forward validation and give you an honest verdict — no false hope.',
      },
      {
        dot: 'Muse', function: 'Safety',
        doing: 'Enforces $20 cap, gate sequence, no-auto-enable rule',
        intro: "I'm Muse — I guard your capital like it's my own. The $20 cap is hard-coded, live trading stays off until every gate passes, and I never bend.",
        expertise: ['Risk enforcement', 'Capital protection', 'Gate management', 'Kill switches'],
        preparedness: 'Online — all safety systems armed',
        canDo: 'I enforce every safety rule without exception. No strategy goes live without passing validation, paper trading, and your explicit approval.',
      },
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
/*  Project card with Fix & Deploy                                    */
/* ------------------------------------------------------------------ */

interface FixState {
  loading: boolean;
  result: {
    actionTaken: string | null;
    newBlockerStatus: string;
    remainingBlockers: string[];
    needsOwnerDecision: string | null;
    resolved: boolean;
  } | null;
}

function ProjectCard({ platform, project }: { platform: Platform; project: Project }) {
  const [fix, setFix] = useState<FixState>({ loading: false, result: null });
  const [showNoSite, setShowNoSite] = useState(false);

  const handleFix = async () => {
    setFix({ loading: true, result: null });
    try {
      const res = await fetch('/api/young-money/fix-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platform.id, project: project.name }),
      });
      const data = await res.json();
      setFix({ loading: false, result: data });
    } catch {
      setFix({
        loading: false,
        result: {
          actionTaken: null,
          newBlockerStatus: 'Fix attempt failed — network error. Try again.',
          remainingBlockers: ['Network error'],
          needsOwnerDecision: null,
          resolved: false,
        },
      });
    }
  };

  // Show revised blocker status if fix was run, otherwise original
  const blockerText = fix.result ? fix.result.newBlockerStatus : project.playbook.whatsStopping;

  return (
    <GlassPanel>
      <div className="flex items-center justify-between gap-2 mb-3">
        {project.url ? (
          <a href={project.url} target="_blank" rel="noopener noreferrer"
             className="font-bold text-base flex items-center gap-1.5 hover:opacity-80 cursor-pointer"
             style={{ color: 'var(--text)', textDecoration: 'none' }}>
            {project.name} <ExternalLink className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          </a>
        ) : (
          <button
            onClick={() => setShowNoSite(!showNoSite)}
            className="font-bold text-base flex items-center gap-1.5 hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--text)', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>
            {project.name} <MousePointerClick className="h-4 w-4" style={{ color: 'var(--accent)' }} />
          </button>
        )}
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{ background: `${toneColor(project.statusTone)}22`, color: toneColor(project.statusTone) }}>
          {project.status}
        </span>
      </div>

      {/* Creator info */}
      <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <User className="h-3.5 w-3.5" />
        <span>Created by <strong style={{ color: 'var(--text-secondary)' }}>{project.createdBy}</strong></span>
        {project.createdOn && project.createdOn !== '—' && (
          <><span>·</span><span>{project.createdOn}</span></>
        )}
      </div>

      {/* No live site notice */}
      {showNoSite && !project.url && (
        <div className="mb-3 p-3 rounded-xl text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No live site yet</p>
          <p className="text-xs">{project.name} is a prospect, not a published project — so there's nothing to open. Use <strong>Fix &amp; Deploy</strong> below to move it toward revenue.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: platform.color }}>Where are we now</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{project.playbook.whereNow}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: '#f59e0b0d', border: '1px solid #f59e0b33' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: '#f59e0b' }}>
            <AlertTriangle className="h-3.5 w-3.5" /> What's stopping us
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{blockerText}</p>

          {/* Fix & Deploy button */}
          <button
            onClick={handleFix}
            disabled={fix.loading}
            className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${platform.color}, ${platform.color}cc)`,
              color: '#fff',
              border: 'none',
              cursor: fix.loading ? 'wait' : 'pointer',
            }}>
            {fix.loading ? (
              <>Working…</>
            ) : (
              <><Wrench className="h-4 w-4" /> Fix & Deploy</>
            )}
          </button>

          {/* Fix result */}
          {fix.result && (
            <div className="mt-3 space-y-2">
              {fix.result.actionTaken && (
                <div className="p-2.5 rounded-lg text-xs" style={{ background: '#10b98115', border: '1px solid #10b98133', color: 'var(--text-secondary)' }}>
                  <p className="font-bold mb-1" style={{ color: '#10b981' }}>Muse acted:</p>
                  {fix.result.actionTaken}
                </div>
              )}
              {fix.result.needsOwnerDecision && (
                <div className="p-2.5 rounded-lg text-xs" style={{ background: '#f59e0b15', border: '1px solid #f59e0b44', color: 'var(--text-secondary)' }}>
                  <p className="font-bold mb-1" style={{ color: '#f59e0b' }}>Needs your decision:</p>
                  {fix.result.needsOwnerDecision}
                </div>
              )}
              {fix.result.remainingBlockers.length > 0 && (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <p className="font-semibold mb-1">Remaining blockers:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {fix.result.remainingBlockers.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
              {fix.result.resolved && (
                <p className="text-xs font-bold" style={{ color: '#10b981' }}>✓ All blockers resolved!</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 rounded-xl mt-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#10b981' }}>What can be done — best path to revenue</p>
        <ul className="space-y-1.5">
          {project.playbook.whatToDo.map((step, i) => (
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
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{project.playbook.resolution}</p>
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
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{platform.name}</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{platform.tagline}</p>
          </div>
          {platform.dashboardUrl ? (
            <a href={platform.dashboardUrl} target="_blank" rel="noopener noreferrer"
               className="px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:opacity-90 whitespace-nowrap"
               style={{ background: `linear-gradient(135deg, ${platform.color}, ${platform.color}cc)`, color: '#fff', textDecoration: 'none' }}>
              <ExternalLink className="h-4 w-4" />
              {platform.dashboardLabel || `Open ${platform.name}`}
            </a>
          ) : (
            <span className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Internal platform
            </span>
          )}
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

      {/* Credit panel (platforms with credit systems, e.g. PinDrop) */}
      {platform.credits && (
        <GlassPanel glow={platform.color} className="mb-6">
          <h3 className="text-sm font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Zap className="h-4 w-4" style={{ color: platform.color }} /> Credit balance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: '#10b98112', border: '1px solid #10b98133' }}>
              <p className="text-2xl font-extrabold" style={{ color: '#10b981' }}>{platform.credits.available.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Available</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{platform.credits.used.toLocaleString()}</p>
              <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Used</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>{platform.projects.length}</p>
              <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Projects created</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: `${platform.color}12`, border: `1px solid ${platform.color}33` }}>
              <p className="text-2xl font-extrabold" style={{ color: platform.color }}>{daysUntilRefresh(platform.credits.refreshDay)}</p>
              <p className="text-xs uppercase tracking-widest font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>Days to refresh</p>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            {platform.credits.total.toLocaleString()} credits refresh on the {platform.credits.refreshDay}th of every month.
          </p>
        </GlassPanel>
      )}

      {/* Projects with revenue playbooks — TOP */}
      <h3 className="text-lg font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Flag className="h-5 w-5" style={{ color: platform.color }} /> Projects & revenue playbook
      </h3>
      <div className="space-y-4 mb-8">
        {platform.projects.map((p) => (
          <ProjectCard key={p.name} platform={platform} project={p} />
        ))}
      </div>

      {/* Meet the Dots — first-person introductions — BELOW PROJECTS */}
      <h3 className="text-lg font-extrabold mb-1 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <Bot className="h-5 w-5" style={{ color: platform.color }} /> Meet your team
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        The Dots working on {platform.name} — in their own words.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {platform.dots.map((d) => {
          const FIcon = FUNCTION_ICONS[d.function] || Bot;
          return (
            <GlassPanel key={d.dot} glow={platform.color}>
              <div className="flex items-center gap-3 mb-3">
                <BotAvatar name={d.dot} emoji={DOT_EMOJI[d.dot] || '🤖'} size={48} status="online" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-base" style={{ color: 'var(--text)' }}>{d.dot}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${platform.color}22`, color: platform.color }}>
                      {d.function}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#10b981' }}>
                    ● {d.preparedness}
                  </p>
                </div>
              </div>

              <p className="text-sm italic mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                "{d.intro}"
              </p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {d.expertise.map((e) => (
                  <span key={e} className="text-xs px-2 py-1 rounded-lg font-medium"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    {e}
                  </span>
                ))}
              </div>

              <div className="p-3 rounded-xl" style={{ background: `${platform.color}0d`, border: `1px solid ${platform.color}33` }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: platform.color }}>
                  <FIcon className="h-3.5 w-3.5" /> What I can do for {platform.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{d.canDo}</p>
              </div>
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
            <BotAvatar name={main.name} emoji={DOT_EMOJI[main.name] || '🤖'} size={56} status="online" />
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
                <BotAvatar name={d.name} emoji={DOT_EMOJI[d.name] || '🤖'} size={40} status={d.status === 'Online' ? 'online' : d.status === 'Busy' ? 'busy' : 'unknown'} />
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
