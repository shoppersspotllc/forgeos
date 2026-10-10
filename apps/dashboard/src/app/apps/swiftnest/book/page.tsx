'use client';

/**
 * SwiftNest flagship booking flow.
 * Step 1: Package → Step 2: Add-ons → Step 3: Route details → Step 4: Review & pay.
 * Same /api/apps/swiftnest/checkout contract as the original flow;
 * prices computed server-side.
 */
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check, ArrowRight, ArrowLeft, Package, Box, Truck,
  ShieldCheck, Lock, MapPin, Navigation, AlertCircle, Zap,
} from 'lucide-react';

const PACKAGES = [
  { id: 'small', name: 'Small Parcel', price: 12, blurb: 'Up to 5 lbs · documents, food, small boxes', icon: <Package size={22} /> },
  { id: 'medium', name: 'Medium Package', price: 19, blurb: 'Up to 20 lbs · standard boxes, multi-item', icon: <Box size={22} /> },
  { id: 'large', name: 'Large / Bulky', price: 29, blurb: 'Up to 50 lbs · large boxes, bulky goods', icon: <Truck size={22} /> },
];

const ADDONS = [
  { id: 'express', name: 'Express 2-Hour Delivery', price: 8 },
  { id: 'fragile', name: 'Fragile Handling', price: 5 },
  { id: 'signature', name: 'Signature Required', price: 3 },
  { id: 'scheduled', name: 'Scheduled Time Window', price: 4 },
];

const STEPS = ['Package', 'Add-ons', 'Route', 'Review'];

function BookingFlow() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [pkg, setPkg] = useState(searchParams.get('package') || 'small');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pkgData = PACKAGES.find((p) => p.id === pkg) || PACKAGES[0];
  const chosenAddons = ADDONS.filter((a) => selectedAddons.includes(a.id));
  const addonsTotal = chosenAddons.reduce((s, a) => s + a.price, 0);
  const total = pkgData.price + addonsTotal;

  // Couriers run same-day: min date = today
  const minDate = new Date().toISOString().split('T')[0];

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const validateDetails = () => {
    if (!name.trim() || !email.trim() || !pickupAddress.trim() || !dropoffAddress.trim() || !date) {
      setError('Please fill in your name, email, pickup address, dropoff address, and date.');
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
      const res = await fetch('/api/apps/swiftnest/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg,
          addons: selectedAddons,
          customer: { name, email, phone, pickupAddress, dropoffAddress, date, notes },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Booking failed');
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
    <div className="sn-book">
      <div className="sn-book__head">
        <Link href="/apps/swiftnest" className="sn-backlink">
          <ArrowLeft size={16} /> Back to SwiftNest
        </Link>
        <h1 className="sn-display">Book your courier</h1>
        <p>
          Four quick steps. Transparent draft pricing throughout — your final
          quote is confirmed before any payment.
        </p>
        <div className="sn-progress" aria-label={`Step ${step + 1} of 4: ${STEPS[step]}`}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`sn-progress__seg${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`}
              title={s}
            />
          ))}
        </div>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--sn-orange-deep)', margin: '10px 0 0' }}>
          Step {step + 1} of 4 — {STEPS[step]}
        </p>
      </div>

      <div className="sn-book__grid">
        <div className="sn-glass sn-panel">
          {error && (
            <div className="sn-error" role="alert" aria-live="assertive">
              <AlertCircle size={19} style={{ flex: 'none', marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {step === 0 && (
            <>
              <h2>Choose your package size</h2>
              <p className="sn-panel__sub">Priced by weight. Every delivery includes live dispatch and photo proof.</p>
              <div className="sn-pickgrid">
                {PACKAGES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`sn-pick${pkg === p.id ? ' is-selected' : ''}`}
                    onClick={() => setPkg(p.id)}
                    aria-pressed={pkg === p.id}
                  >
                    <span className="sn-pick__icon">{p.icon}</span>
                    <span className="sn-pick__body">
                      <strong>{p.name}</strong>
                      <span>{p.blurb}</span>
                    </span>
                    <span className="sn-pick__price">${p.price}</span>
                    <span className="sn-pick__radio"><Check size={14} strokeWidth={3.5} /></span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Add extras <span style={{ fontWeight: 400, fontSize: 17, color: 'var(--sn-muted)' }}>(optional)</span></h2>
              <p className="sn-panel__sub">Boost your {pkgData.name.toLowerCase()} delivery.</p>
              <div className="sn-pickgrid">
                {ADDONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`sn-addonpick${selectedAddons.includes(a.id) ? ' is-selected' : ''}`}
                    onClick={() => toggleAddon(a.id)}
                    aria-pressed={selectedAddons.includes(a.id)}
                  >
                    <span className="sn-addonpick__box"><Check size={14} strokeWidth={3.5} /></span>
                    <span className="sn-addonpick__name">{a.name}</span>
                    <span className="sn-addonpick__price">+${a.price}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Your route</h2>
              <p className="sn-panel__sub">Where should your courier go? Same-day pickup available.</p>
              <div className="sn-leg" aria-label="Pickup to dropoff">
                <div className="sn-leg__stop">
                  <small><MapPin size={11} style={{ verticalAlign: -1 }} /> Pickup</small>
                  <strong>{pickupAddress || 'Enter below'}</strong>
                </div>
                <div className="sn-leg__link" aria-hidden="true">
                  <Zap size={18} />
                  <span>SWIFT</span>
                </div>
                <div className="sn-leg__stop">
                  <small><Navigation size={11} style={{ verticalAlign: -1 }} /> Dropoff</small>
                  <strong>{dropoffAddress || 'Enter below'}</strong>
                </div>
              </div>
              <div className="sn-field__row">
                <div className="sn-field">
                  <label htmlFor="sn-name">Full name *</label>
                  <input id="sn-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jordan Ellis" />
                </div>
                <div className="sn-field">
                  <label htmlFor="sn-email">Email address *</label>
                  <input id="sn-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
                </div>
              </div>
              <div className="sn-field">
                <label htmlFor="sn-phone">Phone <span style={{ fontWeight: 400 }}>(optional — for courier updates)</span></label>
                <input id="sn-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="(555) 123-4567" />
              </div>
              <div className="sn-field">
                <label htmlFor="sn-pickup">Pickup address *</label>
                <input id="sn-pickup" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} autoComplete="street-address" placeholder="123 Main St, Austin, TX" />
              </div>
              <div className="sn-field">
                <label htmlFor="sn-dropoff">Dropoff address *</label>
                <input id="sn-dropoff" value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="456 Oak Ave, Austin, TX" />
              </div>
              <div className="sn-field__row">
                <div className="sn-field">
                  <label htmlFor="sn-date">Delivery date *</label>
                  <input id="sn-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="sn-field">
                  <label htmlFor="sn-notes">Notes <span style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="sn-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate codes, floor, recipient…" />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Review & pay</h2>
              <p className="sn-panel__sub">One last look before secure checkout.</p>
              <div style={{ display: 'grid', gap: 14, marginBottom: 8 }}>
                <div className="sn-glass" style={{ padding: 20 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--sn-muted)' }}>Package</p>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{pkgData.name} — ${pkgData.price}</p>
                  {chosenAddons.length > 0 && (
                    <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--sn-muted)' }}>
                      + {chosenAddons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="sn-glass" style={{ padding: 20 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--sn-muted)' }}>Route</p>
                  <p style={{ margin: 0, fontSize: 15, display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.6 }}>
                    <MapPin size={16} style={{ color: 'var(--sn-orange-deep)', flex: 'none', marginTop: 3 }} />
                    <span>{pickupAddress || '—'}</span>
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 15, display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.6 }}>
                    <Navigation size={16} style={{ color: 'var(--sn-orange-deep)', flex: 'none', marginTop: 3 }} />
                    <span>{dropoffAddress || '—'}</span>
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--sn-muted)' }}>Date: {date || '—'}</p>
                </div>
                <div className="sn-glass" style={{ padding: 20 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--sn-muted)' }}>Contact</p>
                  <p style={{ margin: 0, fontSize: 15 }}>{name || '—'} · {email || '—'}{phone ? ` · ${phone}` : ''}</p>
                </div>
              </div>
            </>
          )}

          <div className="sn-actions">
            {step > 0 && (
              <button type="button" className="sn-backlink" onClick={back}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 3 ? (
              <button type="button" className="sn-btn" onClick={next}>
                Continue <ArrowRight size={17} />
              </button>
            ) : (
              <button type="button" className="sn-btn" onClick={handleCheckout} disabled={loading}>
                {loading ? (
                  <><span className="sn-spinner" /> Processing…</>
                ) : (
                  <>{`Pay $${total} & dispatch`} <ArrowRight size={17} /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <aside className="sn-glass sn-summary" aria-label="Delivery summary">
          <h3>Your delivery</h3>
          <div className="sn-summary__line"><span>{pkgData.name}</span><span>${pkgData.price}</span></div>
          {chosenAddons.map((a) => (
            <div key={a.id} className="sn-summary__line"><span>{a.name}</span><span>+${a.price}</span></div>
          ))}
          {chosenAddons.length === 0 && (
            <div className="sn-summary__line"><span style={{ color: 'var(--sn-muted)', fontWeight: 400 }}>No add-ons selected</span><span>—</span></div>
          )}
          <div className="sn-summary__total">
            <span style={{ fontSize: 14, color: 'var(--sn-muted)' }}>Estimated total</span>
            <strong>${total}</strong>
          </div>
          <div className="sn-summary__note">
            <span className="sn-draft">Draft pricing</span>
            <span>Shown transparently while we finalize launch. Your final quote is confirmed before any payment is taken.</span>
          </div>
          <div className="sn-secure">
            <Lock size={15} /> <span>Secure checkout via Stripe · <strong>Test mode</strong> — no real charge</span>
          </div>
          <div className="sn-secure">
            <ShieldCheck size={15} /> <span>Photo proof of delivery on every job</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BookLoading() {
  return (
    <div className="sn-book" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--sn-muted)' }}>
        <span className="sn-spinner" style={{ borderColor: 'rgba(234,88,12,.25)', borderTopColor: 'var(--sn-orange)' }} />
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
          <Link href="/apps/swiftnest" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--sn-ink)', fontWeight: 800, fontSize: 18 }}>
            <span className="sn-brand__mark" style={{ width: 34, height: 34 }}><Package size={17} strokeWidth={2.4} /></span>
            SwiftNest
          </Link>
          <span className="sn-testmode" style={{ color: '#92600a', borderColor: 'rgba(146,96,10,.35)', background: 'rgba(254,243,199,.6)' }}>Test mode</span>
        </div>
      </div>
      <Suspense fallback={<BookLoading />}>
        <BookingFlow />
      </Suspense>
    </>
  );
}
