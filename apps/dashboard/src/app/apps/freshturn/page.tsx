/**
 * FreshTurn — flagship landing.
 * Cinematic hero · services · draft pricing · add-ons · how it works · FAQ.
 */
import Link from 'next/link';
import {
  Sparkles, ArrowRight, Check, ShieldCheck, CalendarCheck, Home, Building2,
  KeyRound, CreditCard, ChevronDown, Leaf, Clock, BadgeCheck, Star,
} from 'lucide-react';
import NavBar from './components/NavBar';
import HeroScene from './components/HeroScene';
import Reveal from './components/Reveal';
import Tilt from './components/Tilt';

export const metadata = {
  title: 'FreshTurn — Move-Out Cleaning & Rental Turnover',
  description:
    'Professional move-out cleaning for renters, landlords, and property managers. Transparent draft pricing, online booking, satisfaction guaranteed.',
};

const PACKAGES = [
  {
    id: 'studio',
    name: 'Studio / 1-Bed',
    price: 149,
    blurb: 'Studios and one-bedrooms up to 750 sq ft.',
    features: [
      'Full kitchen deep clean',
      'Bathroom sanitization',
      'All floors vacuumed & mopped',
      'Dusting all surfaces',
      'Trash removal',
    ],
  },
  {
    id: 'standard',
    name: '2-Bed Standard',
    price: 249,
    blurb: 'Our most booked — 2-bedrooms up to 1,200 sq ft.',
    features: [
      'Everything in Studio',
      'Inside cabinets & drawers',
      'Baseboards & door frames',
      'Light fixtures & ceiling fans',
      'Patio / balcony sweep',
    ],
    popular: true,
  },
  {
    id: 'deep',
    name: '3-Bed+ Deep Clean',
    price: 399,
    blurb: 'Maximum detail for larger homes, 1,200+ sq ft.',
    features: [
      'Everything in Standard',
      'Inside refrigerator',
      'Inside oven',
      'Window interiors',
      'Garage sweep-out',
    ],
  },
];

const ADDONS = [
  { icon: <Sparkles size={22} />, name: 'Inside Refrigerator', price: 25, note: 'Shelves, drawers, seals' },
  { icon: <Star size={22} />, name: 'Inside Oven', price: 25, note: 'Racks, glass, interior' },
  { icon: <Home size={22} />, name: 'Interior Windows', price: 35, note: 'Glass, sills, tracks' },
  { icon: <Leaf size={22} />, name: 'Laundry Room Detail', price: 20, note: 'Machines, lint, floors' },
  { icon: <ShieldCheck size={22} />, name: 'Pet Hair Treatment', price: 30, note: 'Upholstery-grade removal' },
];

const FAQS = [
  {
    q: 'Is the pricing final?',
    a: 'The prices shown are transparent draft pricing — you always see the full breakdown before paying anything. Your final quote is confirmed with you personally before any payment is taken, and the amount charged always matches the confirmed quote.',
  },
  {
    q: 'How does booking work?',
    a: 'Choose a package, add any extras, pick your date, and check out securely. Payment is processed in test mode while we finalize launch — you will never be charged a live payment without explicit confirmation.',
  },
  {
    q: 'Do I need to be there during the cleaning?',
    a: 'No. Most customers hand over a key or entry code. Our team arrives with all supplies and equipment, and you receive photo confirmation when the job is done.',
  },
  {
    q: 'What if my landlord is not satisfied?',
    a: 'Every turnover follows a deposit-focused checklist. If anything on the checklist is missed, we return within 48 hours to make it right — free.',
  },
  {
    q: 'Which areas do you serve?',
    a: 'We are onboarding neighborhood by neighborhood. Enter your property address at booking and we will confirm availability for your date instantly.',
  },
];

export default function FreshTurnHome() {
  return (
    <>
      <NavBar />

      {/* ============ CINEMATIC HERO ============ */}
      <header className="ft-hero">
        <div
          className="ft-hero__bg"
          style={{ backgroundImage: "url('/apps/freshturn/hero.jpg')" }}
          role="img"
          aria-label="Sunlit, freshly cleaned modern apartment living room"
        />
        <div className="ft-hero__scrim" />
        <HeroScene />
        <div className="ft-hero__content">
          <div>
            <Reveal immediate>
              <span className="ft-eyebrow" style={{ color: '#bbf7d0' }}>
                Move-out cleaning · Rental turnover
              </span>
            </Reveal>
            <Reveal immediate delay={120}>
              <h1 className="ft-display">
                Move out spotless.
                <br />
                <span className="ft-accent">Get your deposit back.</span>
              </h1>
            </Reveal>
            <Reveal immediate delay={240}>
              <p className="ft-hero__sub">
                FreshTurn is the premium turnover clean for renters, landlords, and
                property managers — upfront draft pricing, online booking in two
                minutes, and a deposit-focused checklist on every job.
              </p>
            </Reveal>
            <Reveal immediate delay={360}>
              <div className="ft-hero__ctas">
                <Link href="/apps/freshturn/book" className="ft-btn">
                  Book your cleaning <ArrowRight size={18} />
                </Link>
                <a href="#pricing" className="ft-btn ft-btn--ghost">
                  See draft pricing
                </a>
              </div>
            </Reveal>
            <Reveal immediate delay={480}>
              <div className="ft-hero__proof">
                <span className="ft-chip"><BadgeCheck size={15} /> Deposit-focused checklist</span>
                <span className="ft-chip"><Clock size={15} /> 48-hour confirmation</span>
                <span className="ft-chip"><ShieldCheck size={15} /> Re-clean guarantee</span>
              </div>
            </Reveal>
          </div>

          <Reveal immediate delay={300} className="ft-hero__cardwrap">
            <Tilt max={6}>
              <div className="ft-glass ft-hero__card">
                <span className="ft-draft">Draft pricing</span>
                <h3 style={{ marginTop: 12 }}>2-Bed Standard</h3>
                <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--ft-muted)' }}>
                  Our most booked turnover package
                </p>
                <div className="ft-row"><span>Deep clean · up to 1,200 sq ft</span><span className="ft-price">$249</span></div>
                <div className="ft-row"><span>Inside refrigerator</span><span className="ft-price">+$25</span></div>
                <div className="ft-row"><span>Interior windows</span><span className="ft-price">+$35</span></div>
                <div className="ft-total">
                  <span style={{ fontSize: 14, color: 'var(--ft-muted)' }}>Estimated total</span>
                  <strong>$309</strong>
                </div>
                <Link
                  href="/apps/freshturn/book?package=standard"
                  className="ft-btn ft-btn--dark"
                  style={{ width: '100%', marginTop: 18 }}
                >
                  Start booking <ArrowRight size={17} />
                </Link>
                <p style={{ fontSize: 12.5, color: 'var(--ft-muted)', textAlign: 'center', margin: '12px 0 0' }}>
                  Final quote confirmed with you before any payment.
                </p>
              </div>
            </Tilt>
          </Reveal>
        </div>
        <div className="ft-scrollcue" aria-hidden="true">
          <span>Scroll</span>
          <span className="ft-scrollcue__line" />
        </div>
      </header>

      {/* ============ PROMISE BAND ============ */}
      <section className="ft-band ft-section" aria-label="Our promises">
        <div className="ft-wrap">
          <div className="ft-stats">
            {[
              { n: 'Upfront', l: 'Transparent draft pricing — the full breakdown before you pay a cent.' },
              { n: '48 hrs', l: 'Your date confirmed within 48 hours of booking. No chasing.' },
              { n: '100%', l: 'All supplies and equipment included. You provide nothing.' },
              { n: 'Free re-clean', l: 'Missed anything on the checklist? We return within 48 hours, free.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 100}>
                <div className="ft-stat">
                  <div className="ft-stat__num ft-display">{s.n}</div>
                  <div className="ft-stat__label">{s.l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section id="services" className="ft-section">
        <div className="ft-wrap">
          <Reveal>
            <div className="ft-section__head">
              <span className="ft-eyebrow">Services</span>
              <h2 className="ft-display">Two services. One standard: spotless.</h2>
              <p>
                Whether you are handing back keys or preparing a unit for the next
                tenant, every FreshTurn visit follows the same meticulous,
                deposit-focused process.
              </p>
            </div>
          </Reveal>
          <div className="ft-split">
            <Reveal>
              <div className="ft-split__img">
                <img
                  src="/apps/freshturn/detail.jpg"
                  alt="Sparkling clean kitchen counter with fresh eucalyptus in warm sunlight"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <div>
              <Reveal delay={100}>
                <div className="ft-glass" style={{ padding: 30, marginBottom: 18 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
                    <span className="ft-addon__icon"><Home size={22} /></span>
                    <h3 className="ft-display" style={{ margin: 0, fontSize: 22 }}>Move-Out Deep Clean</h3>
                  </div>
                  <p style={{ margin: 0, color: 'var(--ft-muted)', fontSize: 15, lineHeight: 1.7 }}>
                    For renters. A top-to-bottom reset designed around landlord
                    inspection checklists — kitchens, baths, appliances, floors,
                    and every surface a deposit depends on.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div className="ft-glass" style={{ padding: 30 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
                    <span className="ft-addon__icon"><Building2 size={22} /></span>
                    <h3 className="ft-display" style={{ margin: 0, fontSize: 22 }}>Rental Turnover</h3>
                  </div>
                  <p style={{ margin: 0, color: 'var(--ft-muted)', fontSize: 15, lineHeight: 1.7 }}>
                    For landlords and property managers. Between-tenant turnovers
                    on your schedule — photo confirmation on completion, invoicing
                    per unit, priority rebooking.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="ft-section" style={{ background: 'var(--ft-cream-2)' }}>
        <div className="ft-wrap">
          <Reveal>
            <div className="ft-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="ft-eyebrow" style={{ justifyContent: 'center' }}>Pricing</span>
              <h2 className="ft-display">Honest pricing, shown upfront.</h2>
              <p>
                Every price below is a <strong>draft</strong> — transparent now, and
                confirmed with you personally before any payment is ever taken.
              </p>
            </div>
          </Reveal>
          <div className="ft-plans">
            {PACKAGES.map((p, i) => (
              <Reveal key={p.id} delay={i * 120}>
                <Tilt max={5}>
                  <article
                    className={`ft-glass ft-plan${p.popular ? ' ft-plan--popular' : ''}`}
                    aria-label={`${p.name} package, $${p.price}`}
                  >
                    {p.popular && <span className="ft-plan__badge">Most booked</span>}
                    <h3>{p.name}</h3>
                    <p className="ft-plan__desc">{p.blurb}</p>
                    <div className="ft-plan__price">
                      <strong>${p.price}</strong>
                      <span>flat · <span className="ft-draft" style={{ marginLeft: 4 }}>Draft</span></span>
                    </div>
                    <ul className="ft-plan__feats">
                      {p.features.map((f) => (
                        <li key={f} className="ft-plan__feat">
                          <Check size={17} strokeWidth={3} /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/apps/freshturn/book?package=${p.id}`}
                      className={`ft-btn ft-btn--sm${p.popular ? '' : ' ft-btn--dark'}`}
                      style={{ width: '100%' }}
                    >
                      Choose {p.name.split(' ')[0]} <ArrowRight size={15} />
                    </Link>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </div>
          <Reveal delay={150}>
            <p style={{ textAlign: 'center', marginTop: 30, fontSize: 13.5, color: 'var(--ft-muted)' }}>
              Draft pricing is shown transparently while we finalize launch — your final
              quote is confirmed with you before any payment.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ ADD-ONS ============ */}
      <section className="ft-section" style={{ paddingTop: 0 }}>
        <div className="ft-wrap">
          <Reveal>
            <div className="ft-section__head">
              <span className="ft-eyebrow">Add-ons</span>
              <h2 className="ft-display">Detail work, à la carte.</h2>
              <p>Layer extras onto any package at booking. Same draft-pricing promise.</p>
            </div>
          </Reveal>
          <div className="ft-addons">
            {ADDONS.map((a, i) => (
              <Reveal key={a.name} delay={i * 80}>
                <div className="ft-glass ft-addon">
                  <div className="ft-addon__icon">{a.icon}</div>
                  <h4>{a.name}</h4>
                  <p>{a.note}</p>
                  <p style={{ marginTop: 8 }}><strong>+${a.price}</strong></p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="ft-band ft-section">
        <div className="ft-wrap" style={{ position: 'relative' }}>
          <Reveal>
            <div className="ft-section__head">
              <span className="ft-eyebrow" style={{ color: '#bbf7d0' }}>How it works</span>
              <h2 className="ft-display" style={{ color: '#fff' }}>Booked in minutes. Spotless in days.</h2>
              <p style={{ color: 'rgba(238,245,239,.7)' }}>
                A simple four-step journey from quote to keys — with a human
                confirming every detail before you pay.
              </p>
            </div>
          </Reveal>
          <div className="ft-steps">
            {[
              { icon: <Sparkles size={18} />, t: 'Pick your package', d: 'Choose the clean that matches your space. Draft price shown instantly.' },
              { icon: <CalendarCheck size={18} />, t: 'Choose date & details', d: 'Property address, preferred date, contact info — two minutes, tops.' },
              { icon: <CreditCard size={18} />, t: 'Confirm & pay securely', d: 'We confirm your final quote, then you check out securely online.' },
              { icon: <KeyRound size={18} />, t: 'We handle the rest', d: 'Supplies included. Photo confirmation when the job is done.' },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 100}>
                <div className="ft-glass--dark ft-step">
                  <div className="ft-step__n">{s.icon}</div>
                  <h3 style={{ color: '#fff' }}>{s.t}</h3>
                  <p style={{ color: 'rgba(238,245,239,.66)' }}>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="ft-section">
        <div className="ft-wrap">
          <Reveal>
            <div className="ft-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="ft-eyebrow" style={{ justifyContent: 'center' }}>Questions</span>
              <h2 className="ft-display">Everything, answered.</h2>
            </div>
          </Reveal>
          <div className="ft-faq">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details>
                  <summary>
                    {f.q}
                    <ChevronDown size={19} />
                  </summary>
                  <p className="ft-a">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="ft-section" style={{ paddingTop: 0 }}>
        <div className="ft-wrap">
          <Reveal>
            <div className="ft-cta">
              <h2 className="ft-display">Your deposit deserves a<br />fighting chance.</h2>
              <p>
                Book in two minutes. See transparent draft pricing now, confirm your
                final quote with a human, and pay securely online.
              </p>
              <Link href="/apps/freshturn/book" className="ft-btn" style={{ fontSize: 17, padding: '18px 38px' }}>
                Book your cleaning <ArrowRight size={19} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="ft-footer">
        <div className="ft-footer__inner">
          <Link href="/apps/freshturn" className="ft-brand" style={{ color: '#fff', fontSize: 17 }}>
            <span className="ft-brand__mark"><Sparkles size={17} strokeWidth={2.4} /></span>
            FreshTurn
          </Link>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <Link href="/apps/freshturn/book">Book</Link>
            <a href="#pricing">Pricing</a>
            <a href="#how">How it works</a>
          </div>
          <span className="ft-testmode">Test mode · No live payments</span>
        </div>
        <div className="ft-footer__inner" style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 12.5 }}>
          <span>© 2026 FreshTurn. Move-out cleaning & rental turnover.</span>
          <span>Prices shown are draft — confirmed before any payment.</span>
        </div>
      </footer>
    </>
  );
}
