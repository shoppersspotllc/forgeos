'use client';

/**
 * FreshTurn flagship booking flow.
 * Step 1: Package → Step 2: Add-ons → Step 3: Details → Step 4: Review & pay.
 * Logic preserved from the original flow: same validation, same
 * /api/apps/freshturn/checkout contract, prices computed server-side.
 */
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check, ArrowRight, ArrowLeft, Sparkles, ShieldCheck, Lock,
  CalendarCheck, AlertCircle,
} from 'lucide-react';

const PACKAGES = [
  { id: 'studio', name: 'Studio / 1-Bed', price: 149, blurb: 'Up to 750 sq ft' },
  { id: 'standard', name: '2-Bed Standard', price: 249, blurb: 'Up to 1,200 sq ft · Most booked' },
  { id: 'deep', name: '3-Bed+ Deep Clean', price: 399, blurb: '1,200+ sq ft' },
];

const ADDONS = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 25 },
  { id: 'oven', name: 'Inside Oven', price: 25 },
  { id: 'windows', name: 'Interior Windows', price: 35 },
  { id: 'laundry', name: 'Laundry Room Detail', price: 20 },
  { id: 'pet', name: 'Pet Hair Treatment', price: 30 },
];

const STEPS = ['Package', 'Add-ons', 'Details', 'Review'];

function BookingFlow() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [pkg, setPkg] = useState(searchParams.get('package') || 'standard');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pkgData = PACKAGES.find((p) => p.id === pkg) || PACKAGES[1];
  const chosenAddons = ADDONS.filter((a) => selectedAddons.includes(a.id));
  const addonsTotal = chosenAddons.reduce((s, a) => s + a.price, 0);
  const total = pkgData.price + addonsTotal;

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const validateDetails = () => {
    if (!name.trim() || !email.trim() || !address.trim() || !date) {
      setError('Please fill in your name, email, address, and preferred date.');
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
    if (step === 2 && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, 3));
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
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/apps/freshturn/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg,
          addons: selectedAddons,
          customer: { name, email, phone, address, date, notes },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Checkout failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="ft-book">
      <div className="ft-book__head">
        <Link href="/apps/freshturn" className="ft-backlink">
          <ArrowLeft size={16} /> Back to FreshTurn
        </Link>
        <h1 className="ft-display">Book your cleaning</h1>
        <p>
          Four quick steps. Transparent draft pricing throughout — your final
          quote is confirmed before any payment.
        </p>
        <div className="ft-progress" aria-label={`Step ${step + 1} of 4: ${STEPS[step]}`}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`ft-progress__seg${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`}
              title={s}
            />
          ))}
        </div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ft-green-deep)', margin: '10px 0 0' }}>
          Step {step + 1} of 4 — {STEPS[step]}
        </p>
      </div>

      <div className="ft-book__grid">
        <div className="ft-glass ft-panel">
          {error && (
            <div className="ft-error" role="alert" aria-live="assertive">
              <AlertCircle size={19} style={{ flex: 'none', marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {step === 0 && (
            <>
              <h2>Choose your package</h2>
              <p className="ft-panel__sub">Every package includes all supplies and our deposit-focused checklist.</p>
              <div className="ft-pickgrid">
                {PACKAGES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`ft-pick${pkg === p.id ? ' is-selected' : ''}`}
                    onClick={() => setPkg(p.id)}
                    aria-pressed={pkg === p.id}
                  >
                    <span className="ft-pick__radio"><Check size={14} strokeWidth={3.5} /></span>
                    <span className="ft-pick__body">
                      <strong>{p.name}</strong>
                      <span>{p.blurb}</span>
                    </span>
                    <span className="ft-pick__price">${p.price}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Add extras <span style={{ fontWeight: 400, fontSize: 17, color: 'var(--ft-muted)' }}>(optional)</span></h2>
              <p className="ft-panel__sub">Detail work layered onto your {pkgData.name.toLowerCase()} clean.</p>
              <div className="ft-pickgrid">
                {ADDONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`ft-addonpick${selectedAddons.includes(a.id) ? ' is-selected' : ''}`}
                    onClick={() => toggleAddon(a.id)}
                    aria-pressed={selectedAddons.includes(a.id)}
                  >
                    <span className="ft-addonpick__box"><Check size={14} strokeWidth={3.5} /></span>
                    <span className="ft-addonpick__name">{a.name}</span>
                    <span className="ft-addonpick__price">+${a.price}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Your details</h2>
              <p className="ft-panel__sub">Where and when — we confirm your date within 48 hours.</p>
              <div className="ft-field__row">
                <div className="ft-field">
                  <label htmlFor="ft-name">Full name *</label>
                  <input id="ft-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jordan Ellis" />
                </div>
                <div className="ft-field">
                  <label htmlFor="ft-email">Email address *</label>
                  <input id="ft-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
                </div>
              </div>
              <div className="ft-field__row">
                <div className="ft-field">
                  <label htmlFor="ft-phone">Phone <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="ft-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="(555) 123-4567" />
                </div>
                <div className="ft-field">
                  <label htmlFor="ft-date">Preferred cleaning date *</label>
                  <input id="ft-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div className="ft-field">
                <label htmlFor="ft-address">Property address *</label>
                <input id="ft-address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" placeholder="123 Main St, Apt 4B, Austin, TX" />
              </div>
              <div className="ft-field">
                <label htmlFor="ft-notes">Special instructions <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <textarea id="ft-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate codes, parking, areas of concern..." />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Review & pay</h2>
              <p className="ft-panel__sub">One last look before secure checkout.</p>
              <div style={{ display: 'grid', gap: 14, marginBottom: 8 }}>
                <div className="ft-glass" style={{ padding: 20 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ft-muted)' }}>Package</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{pkgData.name} — ${pkgData.price}</p>
                  {chosenAddons.length > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ft-muted)' }}>
                      + {chosenAddons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="ft-glass" style={{ padding: 20 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ft-muted)' }}>Schedule</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <CalendarCheck size={17} style={{ color: 'var(--ft-green-deep)' }} /> {date || '—'}
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ft-muted)' }}>{address || '—'}</p>
                </div>
                <div className="ft-glass" style={{ padding: 20 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ft-muted)' }}>Contact</p>
                  <p style={{ margin: 0, fontSize: 15 }}>{name || '—'} · {email || '—'}{phone ? ` · ${phone}` : ''}</p>
                </div>
              </div>
            </>
          )}

          <div className="ft-actions">
            {step > 0 && (
              <button type="button" className="ft-backlink" onClick={back}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <button type="button" className="ft-btn" onClick={next}>
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button type="button" className="ft-btn" onClick={handleCheckout} disabled={loading}>
                {loading ? (
                  <><span className="ft-spinner" /> Processing…</>
                ) : (
                  <>{`Pay $${total} & book`} <ArrowRight size={17} /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="ft-glass ft-summary" aria-label="Booking summary">
          <h3>Your booking</h3>
          <div className="ft-summary__line"><span>{pkgData.name}</span><span>${pkgData.price}</span></div>
          {chosenAddons.map((a) => (
            <div key={a.id} className="ft-summary__line"><span>{a.name}</span><span>+${a.price}</span></div>
          ))}
          {chosenAddons.length === 0 && (
            <div className="ft-summary__line"><span style={{ color: 'var(--ft-muted)', fontWeight: 400 }}>No add-ons selected</span><span>—</span></div>
          )}
          <div className="ft-summary__total">
            <span style={{ fontSize: 14, color: 'var(--ft-muted)' }}>Estimated total</span>
            <strong>${total}</strong>
          </div>
          <div className="ft-summary__note">
            <span className="ft-draft">Draft pricing</span>
            <span>Shown transparently while we finalize launch. Your final quote is confirmed with you before any payment is taken.</span>
          </div>
          <div className="ft-secure">
            <Lock size={15} /> <span>Secure checkout via Stripe · <strong>Test mode</strong> — no real charge</span>
          </div>
          <div className="ft-secure">
            <ShieldCheck size={15} /> <span>Free re-clean within 48 hours if anything is missed</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BookLoading() {
  return (
    <div className="ft-book" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--ft-muted)' }}>
        <span className="ft-spinner" style={{ borderColor: 'rgba(22,163,74,.25)', borderTopColor: 'var(--ft-green)' }} />
        Loading booking…
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <>
      <div style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, padding: '14px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/apps/freshturn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ft-ink)', fontWeight: 800, fontSize: 18 }}>
            <span className="ft-brand__mark" style={{ width: 34, height: 34 }}><Sparkles size={17} strokeWidth={2.4} /></span>
            FreshTurn
          </Link>
          <span className="ft-testmode" style={{ color: '#92600a', borderColor: 'rgba(146,96,10,.35)', background: 'rgba(254,243,199,.6)' }}>Test mode</span>
        </div>
      </div>
      <Suspense fallback={<BookLoading />}>
        <BookingFlow />
      </Suspense>
    </>
  );
}
