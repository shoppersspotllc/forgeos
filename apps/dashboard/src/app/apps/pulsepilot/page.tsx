/**
 * PulsePilot — flagship landing.
 * Cinematic hero + pulse line · intensity plans · sample training week ·
 * coaching options · membership steps · FAQ.
 * All claims realistic; sample data clearly labeled as demo.
 */
import Link from 'next/link';
import {
  Activity, ArrowRight, Check, Dumbbell, Flame, HeartPulse, Users,
  Salad, CalendarCheck, ChevronDown, Zap, Bike, Waves, Timer, ShieldCheck,
} from 'lucide-react';
import NavBar from './components/NavBar';
import HeroScene from './components/HeroScene';
import PulseLine from './components/PulseLine';
import Reveal from './components/Reveal';
import Tilt from './components/Tilt';

export const metadata = {
  title: 'PulsePilot — Train With a Pulse',
  description:
    'Premium fitness memberships with personal coaching. Transparent monthly pricing, no contracts, cancel anytime. Test mode — no real memberships yet.',
};

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    level: 1,
    blurb: 'Open gym access plus a weekly group class to build the habit.',
    features: ['Full gym floor access', 'Locker room & showers', '1 group class / week', 'PulsePilot app tracking'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    level: 2,
    blurb: 'For consistent trainers who want classes, recovery, and coaching.',
    features: ['Everything in Basic', 'Unlimited group classes', 'Sauna & recovery zone', '1 personal session / month'],
    hot: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 79,
    level: 3,
    blurb: 'Maximum coaching and structure for serious goals.',
    features: ['Everything in Pro', '4 personal sessions / month', 'Custom nutrition guidance', 'Priority class booking'],
  },
];

const WEEK = [
  { day: 'Mon', title: 'Strength A', note: 'Squat · press · row — 60 min', icon: <Dumbbell size={18} /> },
  { day: 'Tue', title: 'Conditioning', note: 'Intervals · 35 min', icon: <Flame size={18} /> },
  { day: 'Wed', title: 'Mobility', note: 'Hips · shoulders — 30 min', icon: <Waves size={18} /> },
  { day: 'Thu', title: 'Strength B', note: 'Hinge · pull · carry — 60 min', icon: <Dumbbell size={18} /> },
  { day: 'Fri', title: 'Engine', note: 'Bike or rower · 40 min', icon: <Bike size={18} /> },
  { day: 'Sat', title: 'Team workout', note: 'Coach-led group session', icon: <Users size={18} /> },
  { day: 'Sun', title: 'Rest', note: 'Walk, sleep, recover', icon: <Timer size={18} />, rest: true },
];

const COACHING = [
  {
    icon: <HeartPulse size={24} />,
    title: '1-on-1 Personal Coaching',
    body: 'A coach who learns how you move and builds every session around your schedule, equipment, and goals.',
    points: ['Movement assessment first', 'Sessions adapt weekly', 'Available on Pro & Elite'],
  },
  {
    icon: <Users size={24} />,
    title: 'Coach-Led Group Classes',
    body: 'Small groups, real coaching — strength, conditioning, and mobility classes across the week.',
    points: ['Capped class sizes', 'All levels welcome', 'Unlimited on Pro & Elite'],
  },
  {
    icon: <Salad size={24} />,
    title: 'Nutrition Guidance',
    body: 'Practical eating structure that fits your life — no crash diets, no miracle claims, just consistency.',
    points: ['Habit-based approach', 'Reviewed monthly', 'Included with Elite'],
  },
];

const FAQS = [
  {
    q: 'How fast will I see results?',
    a: 'Honestly: it depends on consistency, sleep, and nutrition — not on a program name. Most members who train 3+ times a week notice strength and energy changes within 6–8 weeks. We will never promise a specific outcome or timeline for your body.',
  },
  {
    q: 'Are there contracts or cancellation fees?',
    a: 'No. Every plan is month-to-month and you can cancel anytime. Subscriptions are billed monthly through Stripe; cancel in one click and you keep access until the end of the billing period.',
  },
  {
    q: 'Is this page taking real payments?',
    a: 'No — the site is in test mode while we finalize launch. Checkout uses Stripe test mode only, no real membership is activated, and no real charge can occur.',
  },
  {
    q: 'I am a beginner. Is PulsePilot for me?',
    a: 'Yes. Your first personal session is a movement assessment — your coach meets you where you are and scales everything. Group classes welcome all levels and every workout lists scaled options.',
  },
  {
    q: 'What does the sample training week represent?',
    a: 'It is a demo illustration of how a week can be structured — not a prescription and not a result anyone achieved. Your actual plan is built with your coach after your assessment.',
  },
];

export default function PulsePilotHome() {
  return (
    <>
      <NavBar />

      {/* ============ CINEMATIC HERO ============ */}
      <header className="pp-hero">
        <div
          className="pp-hero__bg"
          style={{ backgroundImage: "url('/apps/pulsepilot/hero.jpg')" }}
          role="img"
          aria-label="Athlete training in a dark gym with dramatic red lighting"
        />
        <div className="pp-hero__scrim" />
        <HeroScene />
        <div className="pp-hero__content">
          <div>
            <Reveal immediate>
              <span className="pp-eyebrow" style={{ color: '#fca5a5' }}>
                Premium fitness memberships
              </span>
            </Reveal>
            <Reveal immediate delay={120}>
              <h1 className="pp-display">
                Train with
                <br />
                a <span className="pp-accent">pulse.</span>
              </h1>
            </Reveal>
            <Reveal immediate delay={200}>
              <PulseLine />
            </Reveal>
            <Reveal immediate delay={280}>
              <p className="pp-hero__sub">
                PulsePilot pairs open gym access with real coaching — transparent
                monthly pricing, no contracts, cancel anytime. Built for
                consistency, not quick fixes.
              </p>
            </Reveal>
            <Reveal immediate delay={380}>
              <div className="pp-hero__ctas">
                <Link href="/apps/pulsepilot/subscribe" className="pp-btn">
                  Start training <ArrowRight size={18} />
                </Link>
                <a href="#plans" className="pp-btn pp-btn--ghost">
                  Compare plans
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal immediate delay={320}>
            <Tilt max={6}>
              <div className="pp-glass pp-statcard">
                <div className="pp-statcard__head">
                  <h3>Training zones</h3>
                  <span className="pp-demo">Sample data</span>
                </div>
                <div className="pp-hr">
                  <strong>142</strong>
                  <span>Avg. heart rate<br />last session</span>
                </div>
                <div className="pp-zones">
                  {[
                    { name: 'Zone 2 base', label: '62%', fill: 0.62 },
                    { name: 'Threshold', label: '24%', fill: 0.24 },
                    { name: 'Peak', label: '9%', fill: 0.09 },
                  ].map((z, i) => (
                    <div key={z.name} className="pp-zonebar">
                      <span>{z.name}</span>
                      <span className="pp-zonebar__track">
                        <span
                          className="pp-zonebar__fill"
                          style={{ ['--w' as never]: z.fill, animationDelay: `${i * 180}ms` }}
                        />
                      </span>
                      <span>{z.label}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--pp-muted)', margin: '14px 0 18px', lineHeight: 1.6 }}>
                  Illustrative — your zones are measured at your assessment and
                  tracked in the app.
                </p>
                <Link
                  href="/apps/pulsepilot/subscribe?plan=pro"
                  className="pp-btn pp-btn--dark"
                  style={{ width: '100%' }}
                >
                  <Zap size={17} /> Join Pro — $49/mo
                </Link>
              </div>
            </Tilt>
          </Reveal>
        </div>
        <div className="pp-scrollcue" aria-hidden="true">
          <span>Scroll</span>
          <span className="pp-scrollcue__line" />
        </div>
      </header>

      {/* ============ INTENSITY PLANS ============ */}
      <section id="plans" className="pp-section">
        <div className="pp-wrap">
          <Reveal>
            <div className="pp-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="pp-eyebrow" style={{ justifyContent: 'center' }}>Membership</span>
              <h2 className="pp-display">Pick your intensity.</h2>
              <p>
                Three monthly plans. No contracts, no joining fees, cancel
                anytime — and every price below is shown upfront.
              </p>
            </div>
          </Reveal>
          <div className="pp-plans">
            {PLANS.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <Tilt max={5}>
                  <article
                    className={`pp-glass pp-plan${p.hot ? ' pp-plan--hot' : ''}`}
                    aria-label={`${p.name} plan, $${p.price} per month`}
                  >
                    {p.hot && <div className="pp-plan__tag">Most popular</div>}
                    <div className="pp-plan__level" aria-label={`Intensity level ${p.level} of 3`}>
                      {[1, 2, 3].map((l) => (
                        <i key={l} className={l <= p.level ? 'on' : ''} />
                      ))}
                    </div>
                    <h3>{p.name}</h3>
                    <p className="pp-plan__desc">{p.blurb}</p>
                    <div className="pp-plan__price">
                      <strong>${p.price}</strong>
                      <span>/ month</span>
                    </div>
                    <p className="pp-plan__per">Billed monthly · cancel anytime</p>
                    <ul className="pp-plan__feats">
                      {p.features.map((f) => (
                        <li key={f} className="pp-plan__feat">
                          <Check size={17} strokeWidth={3} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/apps/pulsepilot/subscribe?plan=${p.id}`}
                      className={`pp-btn${p.hot ? '' : ' pp-btn--dark'}`}
                      style={{ width: '100%' }}
                    >
                      Choose {p.name} <ArrowRight size={16} />
                    </Link>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SAMPLE TRAINING WEEK ============ */}
      <section id="training" className="pp-section" style={{ paddingTop: 0 }}>
        <div className="pp-wrap">
          <Reveal>
            <div className="pp-section__head">
              <span className="pp-eyebrow">Training</span>
              <h2 className="pp-display">A week, structured.</h2>
              <p>
                How a balanced week can look. <span className="pp-demo">Demo plan</span> —
                your real program is built with your coach after your assessment.
              </p>
            </div>
          </Reveal>
          <div className="pp-week">
            {WEEK.map((d, i) => (
              <Reveal key={d.day} delay={i * 60}>
                <div className={`pp-day${d.rest ? ' pp-day--rest' : ''}`}>
                  <div className="pp-day__icon">{d.icon}</div>
                  <small>{d.day}</small>
                  <strong>{d.title}</strong>
                  <p>{d.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <p style={{ marginTop: 22, fontSize: 13.5, color: 'var(--pp-muted)', lineHeight: 1.7 }}>
              Sample illustration only — not a prescription and not anyone&apos;s
              results. Training load is personalized to your assessment, schedule,
              and recovery.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ COACHING OPTIONS ============ */}
      <section id="coaching" className="pp-section" style={{ paddingTop: 0 }}>
        <div className="pp-wrap">
          <Reveal>
            <div className="pp-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="pp-eyebrow" style={{ justifyContent: 'center' }}>Coaching</span>
              <h2 className="pp-display">Never train alone.</h2>
              <p>Three ways to get coached — mixed and matched to your plan.</p>
            </div>
          </Reveal>
          <div className="pp-coach">
            {COACHING.map((c, i) => (
              <Reveal key={c.title} delay={i * 110}>
                <Tilt max={5}>
                  <div className="pp-glass pp-coachcard">
                    <div className="pp-coachcard__icon">{c.icon}</div>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                    <ul>
                      {c.points.map((pt) => (
                        <li key={pt}><Check size={15} strokeWidth={3} /> {pt}</li>
                      ))}
                    </ul>
                  </div>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ MEMBERSHIP STEPS ============ */}
      <section className="pp-band pp-section">
        <div className="pp-wrap" style={{ position: 'relative' }}>
          <Reveal>
            <div className="pp-section__head">
              <span className="pp-eyebrow" style={{ color: '#fca5a5' }}>Membership</span>
              <h2 className="pp-display" style={{ color: '#fff' }}>From signup to first session.</h2>
              <p style={{ color: 'rgba(248,242,234,.7)' }}>
                Four steps. Your membership activates the moment checkout completes.
              </p>
            </div>
          </Reveal>
          <div className="pp-steps">
            {[
              { t: 'Choose your plan', d: 'Basic, Pro, or Elite — monthly billing, no contract.' },
              { t: 'Create your account', d: 'Name, email, and phone. Thirty seconds, no paperwork.' },
              { t: 'Check out securely', d: 'Stripe test-mode checkout while we finalize launch.' },
              { t: 'Book your assessment', d: 'Your first coaching session maps your movement and goals.' },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 100}>
                <div className="pp-glass pp-glass--dark pp-step">
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DETAIL SPLIT ============ */}
      <section className="pp-section">
        <div className="pp-wrap">
          <div className="pp-split">
            <Reveal>
              <div className="pp-split__img">
                <img
                  src="/apps/pulsepilot/detail.jpg"
                  alt="Hands gripping a barbell with chalk dust in dramatic red light"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <div>
              <Reveal delay={100}>
                <span className="pp-eyebrow">Why PulsePilot</span>
                <h2 className="pp-display" style={{ fontSize: 'clamp(30px, 3.8vw, 48px)', margin: '18px 0 14px' }}>
                  Built for the long game.
                </h2>
                <p style={{ color: 'var(--pp-muted)', fontSize: 16.5, lineHeight: 1.7, margin: 0 }}>
                  No crash programs, no miracle claims. Just coaching, structure,
                  and a plan you can actually stick to.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <ul className="pp-checklist">
                  <li><ShieldCheck size={19} /> <span><strong>No contracts.</strong> Month-to-month billing; cancel anytime and keep access through the billing period.</span></li>
                  <li><CalendarCheck size={19} /> <span><strong>Coaching included.</strong> Personal sessions on Pro and Elite — your plan adapts as you progress.</span></li>
                  <li><Activity size={19} /> <span><strong>Measured, not guessed.</strong> Your assessment sets real baselines; the app tracks every session.</span></li>
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="pp-section" style={{ paddingTop: 0 }}>
        <div className="pp-wrap">
          <Reveal>
            <div className="pp-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="pp-eyebrow" style={{ justifyContent: 'center' }}>Questions</span>
              <h2 className="pp-display">Straight answers.</h2>
            </div>
          </Reveal>
          <div className="pp-faq">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details>
                  <summary>
                    {f.q}
                    <ChevronDown size={19} />
                  </summary>
                  <p className="pp-a">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="pp-section" style={{ paddingTop: 0 }}>
        <div className="pp-wrap">
          <Reveal>
            <div className="pp-cta">
              <h2 className="pp-display">Your first session<br />is waiting.</h2>
              <p>
                Join in two minutes. Transparent monthly pricing, no contracts,
                coaching from day one.
              </p>
              <Link href="/apps/pulsepilot/subscribe" className="pp-btn" style={{ fontSize: 17, padding: '18px 40px' }}>
                Become a member <ArrowRight size={19} />
              </Link>
              <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,.55)' }}>
                Test mode — checkout uses Stripe test cards only. No real membership is activated.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="pp-footer">
        <div className="pp-footer__inner">
          <Link href="/apps/pulsepilot" className="pp-brand" style={{ color: '#fff', fontSize: 17 }}>
            <span className="pp-brand__mark"><Activity size={17} strokeWidth={2.6} /></span>
            PulsePilot
          </Link>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <Link href="/apps/pulsepilot/subscribe">Join</Link>
            <a href="#plans">Plans</a>
            <a href="#training">Training</a>
          </div>
          <span className="pp-testmode">Test mode · No live payments</span>
        </div>
        <div className="pp-footer__inner" style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 12.5 }}>
          <span>© 2026 PulsePilot. Train with a pulse.</span>
          <span>Sample training content is illustrative. No real memberships in test mode.</span>
        </div>
      </footer>
    </>
  );
}
