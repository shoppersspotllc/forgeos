'use client';

/**
 * PulsePilot flagship enrollment flow.
 * Step 1: Plan → Step 2: Details → Step 3: Review & subscribe.
 * Same /api/apps/pulsepilot/checkout contract as the original flow;
 * prices computed server-side. Stripe TEST mode only.
 */
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check, ArrowRight, ArrowLeft, Dumbbell, Flame, Rocket,
  Lock, ShieldCheck, AlertCircle, RefreshCw, Activity,
} from 'lucide-react';

const PLANS = [
  { id: 'basic', name: 'Basic', price: 29, blurb: 'Gym access, locker room, 1 group class/week.', icon: <Dumbbell size={22} /> },
  { id: 'pro', name: 'Pro', price: 49, blurb: 'Unlimited classes, sauna, 1 PT session/month.', icon: <Flame size={22} /> },
  { id: 'elite', name: 'Elite', price: 79, blurb: 'Everything in Pro + 4 PT sessions/month, nutrition plan.', icon: <Rocket size={22} /> },
];

const STEPS = ['Plan', 'Details', 'Review'];

function EnrollFlow() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [planId, setPlanId] = useState(searchParams.get('plan') || 'basic');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = PLANS.find((p) => p.id === planId) || PLANS[0];

  const validateDetails = () => {
    if (!name.trim() || !email.trim()) {
      setError('Please fill in your name and email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const next = () => {
    setError('');
    if (step === 1 && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = async () => {
    setError('');
    if (!validateDetails()) {
      setStep(1);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/apps/pulsepilot/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, customer: { name, email, phone } }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Subscription failed');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="pp-sub">
      <div className="pp-sub__head">
        <Link href="/apps/pulsepilot" className="pp-backlink">
          <ArrowLeft size={16} /> Back to PulsePilot
        </Link>
        <h1 className="pp-display">Become a member</h1>
        <p>
          Three quick steps. Your membership activates the moment checkout
          completes — month-to-month, cancel anytime.
        </p>
        <div className="pp-progress" aria-label={`Step ${step + 1} of 3: ${STEPS[step]}`}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`pp-progress__seg${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`}
              title={s}
            />
          ))}
        </div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--pp-red)', margin: '10px 0 0' }}>
          Step {step + 1} of 3 — {STEPS[step]}
        </p>
      </div>

      <div className="pp-sub__grid">
        <div className="pp-glass pp-panel">
          {error && (
            <div className="pp-error" role="alert" aria-live="assertive">
              <AlertCircle size={19} style={{ flex: 'none', marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {step === 0 && (
            <>
              <h2>Choose your plan</h2>
              <p className="pp-panel__sub">Billed monthly. No contracts, no joining fees.</p>
              <div className="pp-pickgrid">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`pp-pick${planId === p.id ? ' is-selected' : ''}`}
                    onClick={() => setPlanId(p.id)}
                    aria-pressed={planId === p.id}
                  >
                    <span className="pp-pick__icon">{p.icon}</span>
                    <span className="pp-pick__body">
                      <strong>{p.name}</strong>
                      <span>{p.blurb}</span>
                    </span>
                    <span className="pp-pick__price">${p.price}<span style={{ fontSize: 13, fontWeight: 600 }}>/mo</span></span>
                    <span className="pp-pick__radio"><Check size={14} strokeWidth={3.5} /></span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Your details</h2>
              <p className="pp-panel__sub">Where should we send your membership confirmation?</p>
              <div className="pp-field__row">
                <div className="pp-field">
                  <label htmlFor="pp-name">Full name *</label>
                  <input id="pp-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jordan Ellis" />
                </div>
                <div className="pp-field">
                  <label htmlFor="pp-email">Email address *</label>
                  <input id="pp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
                </div>
              </div>
              <div className="pp-field">
                <label htmlFor="pp-phone">Phone <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input id="pp-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="(555) 123-4567" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Review & subscribe</h2>
              <p className="pp-panel__sub">One last look before secure checkout.</p>
              <div className="pp-reviewrow">
                <div className="pp-glass pp-reviewcard">
                  <p className="pp-k">Membership</p>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{plan.name} — ${plan.price}/month</p>
                  <p style={{ marginTop: 6, fontSize: 14, color: 'var(--pp-muted)' }}>{plan.blurb}</p>
                </div>
                <div className="pp-glass pp-reviewcard">
                  <p className="pp-k">Member</p>
                  <p style={{ fontSize: 15 }}>{name || '—'} · {email || '—'}{phone ? ` · ${phone}` : ''}</p>
                </div>
                <div className="pp-glass pp-reviewcard">
                  <p className="pp-k">Billing</p>
                  <p style={{ fontSize: 15, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <RefreshCw size={15} style={{ color: 'var(--pp-red)' }} />
                    Recurring ${plan.price}/month · cancel anytime
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="pp-actions">
            {step > 0 && (
              <button type="button" className="pp-backlink" onClick={back}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 2 ? (
              <button type="button" className="pp-btn" onClick={next}>
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button type="button" className="pp-btn" onClick={handleCheckout} disabled={loading}>
                {loading ? (
                  <><span className="pp-spinner" /> Processing…</>
                ) : (
                  <>{`Subscribe $${plan.price}/mo`} <ArrowRight size={17} /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="pp-glass pp-summary" aria-label="Membership summary">
          <h3>Your membership</h3>
          <div className="pp-summary__line"><span>{plan.name} plan</span><span>${plan.price}/mo</span></div>
          <div className="pp-summary__line"><span>Joining fee</span><span>$0</span></div>
          <div className="pp-summary__total">
            <span style={{ fontSize: 14, color: 'var(--pp-muted)' }}>Due today</span>
            <strong>${plan.price}</strong>
          </div>
          <div className="pp-summary__note">
            <span>Recurring monthly billing. Cancel anytime — you keep access through the end of the billing period.</span>
          </div>
          <div className="pp-secure">
            <Lock size={15} /> <span>Secure checkout via Stripe · <strong>Test mode</strong> — no real charge</span>
          </div>
          <div className="pp-secure">
            <ShieldCheck size={15} /> <span>No contracts · no cancellation fees</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EnrollLoading() {
  return (
    <div className="pp-sub" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--pp-muted)' }}>
        <span className="pp-spinner" style={{ borderColor: 'rgba(220,38,38,.25)', borderTopColor: 'var(--pp-red)' }} />
        Loading enrollment…
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <>
      <div style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, padding: '14px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/apps/pulsepilot" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--pp-ink)', fontWeight: 800, fontSize: 18 }}>
            <span className="pp-brand__mark" style={{ width: 34, height: 34 }}><Activity size={17} strokeWidth={2.6} /></span>
            PulsePilot
          </Link>
          <span className="pp-testmode" style={{ color: '#92600a', borderColor: 'rgba(146,96,10,.35)', background: 'rgba(254,243,199,.6)' }}>Test mode</span>
        </div>
      </div>
      <Suspense fallback={<EnrollLoading />}>
        <EnrollFlow />
      </Suspense>
    </>
  );
}
