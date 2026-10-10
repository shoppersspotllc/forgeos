/**
 * SwiftNest — flagship landing.
 * Same-day local courier. Dispatch card · zone marquee · route-stop pricing ·
 * tracking timeline · zones · FAQ.
 */
import Link from 'next/link';
import {
  Package, ArrowRight, Check, ShieldCheck, Zap, MapPin, Navigation,
  Timer, ChevronDown, BadgeCheck, Clock, PenLine, CalendarClock, Truck,
} from 'lucide-react';
import NavBar from './components/NavBar';
import HeroScene from './components/HeroScene';
import Reveal from './components/Reveal';
import Tilt from './components/Tilt';

export const metadata = {
  title: 'SwiftNest — Same-Day Local Courier',
  description:
    'Same-day local courier and delivery. Transparent draft pricing, online booking, live dispatch — pickup and dropoff in hours, not days.',
};

const PACKAGES = [
  {
    id: 'small',
    name: 'Small Parcel',
    price: 12,
    blurb: 'Up to 5 lbs — documents, small boxes, food orders.',
    features: ['Pickup within the hour', 'Real-time dispatch', 'Photo proof of delivery', 'Up to 5 lbs'],
  },
  {
    id: 'medium',
    name: 'Medium Package',
    price: 19,
    blurb: 'Up to 20 lbs — standard boxes, multiple items.',
    features: ['Everything in Small', 'Up to 20 lbs', 'Priority dispatch queue', 'SMS status updates'],
    hot: true,
  },
  {
    id: 'large',
    name: 'Large / Bulky',
    price: 29,
    blurb: 'Up to 50 lbs — large boxes, bulky items.',
    features: ['Everything in Medium', 'Up to 50 lbs', 'Two-person carry option', 'Scheduled windows'],
  },
];

const ADDONS = [
  { icon: <Zap size={22} />, name: 'Express 2-Hour', price: 8, note: 'There in two hours or less' },
  { icon: <ShieldCheck size={22} />, name: 'Fragile Handling', price: 5, note: 'White-glove care' },
  { icon: <PenLine size={22} />, name: 'Signature Required', price: 3, note: 'Proof in hand' },
  { icon: <CalendarClock size={22} />, name: 'Scheduled Window', price: 4, note: 'Your time, exact' },
];

const ZONES = [
  'Downtown', 'Northside', 'Riverside', 'West End', 'University District',
  'Airport Corridor', 'South Congress', 'East Side', 'Medical District', 'Suburban Ring',
];

const FAQS = [
  {
    q: 'How fast is same-day, really?',
    a: 'Standard bookings are picked up within the hour and delivered the same day. Add Express 2-Hour at booking and your courier is dispatched immediately with a two-hour delivery commitment.',
  },
  {
    q: 'Is the pricing final?',
    a: 'Prices shown are transparent draft pricing — you always see the full breakdown before paying anything. Your final quote is confirmed before any payment is taken, and the amount charged always matches the confirmed quote.',
  },
  {
    q: 'How does booking work?',
    a: 'Choose a package size, add any extras, enter pickup and dropoff addresses, and check out securely. Payment is processed in test mode while we finalize launch — you will never be charged a live payment without explicit confirmation.',
  },
  {
    q: 'What can you carry?',
    a: 'Documents, parcels, food orders, retail goods, and bulky items up to 50 lbs. Fragile Handling covers delicate items; anything hazardous or illegal is never accepted.',
  },
  {
    q: 'Do you serve my neighborhood?',
    a: 'We are expanding zone by zone. Enter your pickup and dropoff addresses at booking — availability for your route is confirmed instantly before you pay.',
  },
];

export default function SwiftNestHome() {
  return (
    <>
      <NavBar />

      {/* ============ CINEMATIC HERO ============ */}
      <header className="sn-hero">
        <div
          className="sn-hero__bg"
          style={{ backgroundImage: "url('/apps/swiftnest/hero.jpg')" }}
          role="img"
          aria-label="Courier handing a parcel to a customer at a sunlit doorstep"
        />
        <div className="sn-hero__scrim" />
        <HeroScene />
        <div className="sn-hero__content">
          <div>
            <Reveal immediate>
              <span className="sn-eyebrow" style={{ color: '#fed7aa' }}>
                Same-day local courier
              </span>
            </Reveal>
            <Reveal immediate delay={120}>
              <h1 className="sn-display">
                Delivered today.
                <br />
                <span className="sn-accent">At the speed of now.</span>
              </h1>
            </Reveal>
            <Reveal immediate delay={240}>
              <p className="sn-hero__sub">
                SwiftNest is the premium local courier for parcels, documents, and
                goods — upfront draft pricing, booking in two minutes, and a
                courier dispatched to your door in under an hour.
              </p>
            </Reveal>
            <Reveal immediate delay={360}>
              <div className="sn-hero__ctas">
                <Link href="/apps/swiftnest/book" className="sn-btn">
                  Book a courier <ArrowRight size={18} />
                </Link>
                <a href="#pricing" className="sn-btn sn-btn--ghost">
                  See draft pricing
                </a>
              </div>
            </Reveal>
            <Reveal immediate delay={480}>
              <div className="sn-hero__proof">
                <span className="sn-chip"><Timer size={15} /> Pickup within the hour</span>
                <span className="sn-chip"><BadgeCheck size={15} /> Photo proof of delivery</span>
                <span className="sn-chip"><ShieldCheck size={15} /> Fragile-handling option</span>
              </div>
            </Reveal>
          </div>

          <Reveal immediate delay={300}>
            <Tilt max={6}>
              <div className="sn-glass sn-dispatch">
                <div className="sn-dispatch__head">
                  <h3>Live dispatch</h3>
                  <span className="sn-live"><span className="sn-live__dot" /> Live</span>
                </div>
                <div className="sn-route" aria-label="Example route from pickup to dropoff">
                  <div className="sn-route__row">
                    <div className="sn-route__pins">
                      <span className="sn-route__pin sn-route__pin--a"><MapPin size={17} /></span>
                      <span className="sn-route__line" aria-hidden="true" />
                      <span className="sn-route__pin sn-route__pin--b"><Navigation size={16} /></span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="sn-route__meta">
                        <small>Pickup</small>
                        <strong>Downtown — in 35 min</strong>
                      </div>
                      <div className="sn-route__meta" style={{ paddingBottom: 0 }}>
                        <small>Dropoff</small>
                        <strong>Riverside — by 4:20 PM</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sn-dispatch__eta">
                  <span style={{ fontSize: 13.5, color: 'var(--sn-muted)' }}>Medium Package<br /><strong style={{ fontSize: 13.5 }}>+ Express 2-Hour</strong></span>
                  <strong>$27</strong>
                </div>
                <Link
                  href="/apps/swiftnest/book?package=medium"
                  className="sn-btn sn-btn--dark"
                  style={{ width: '100%', marginTop: 16 }}
                >
                  Dispatch my package <ArrowRight size={17} />
                </Link>
                <p style={{ fontSize: 12.5, color: 'var(--sn-muted)', textAlign: 'center', margin: '12px 0 0' }}>
                  Draft pricing — confirmed before any payment.
                </p>
              </div>
            </Tilt>
          </Reveal>
        </div>
        <div className="sn-scrollcue" aria-hidden="true">
          <span>Scroll</span>
          <span className="sn-scrollcue__line" />
        </div>
      </header>

      {/* ============ ZONE MARQUEE ============ */}
      <div className="sn-marquee" aria-label="Service zones">
        <div className="sn-marquee__track">
          {[...ZONES, ...ZONES].map((z, i) => (
            <span key={i} className="sn-marquee__item">
              <MapPin size={16} /> {z} <span className="sn-marquee__dot">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ============ ROUTE-STOP PRICING ============ */}
      <section id="pricing" className="sn-section">
        <div className="sn-wrap">
          <Reveal>
            <div className="sn-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="sn-eyebrow" style={{ justifyContent: 'center' }}>Pricing</span>
              <h2 className="sn-display">Three stops. Zero surprises.</h2>
              <p>
                Every price is a <strong>draft</strong> — transparent now, confirmed
                with you before any payment is ever taken.
              </p>
            </div>
          </Reveal>
          <div className="sn-routeline">
            <div className="sn-stops">
              {PACKAGES.map((p, i) => (
                <Reveal key={p.id} delay={i * 120}>
                  <Tilt max={5}>
                    <article
                      className={`sn-glass sn-stop${p.hot ? ' sn-stop--hot' : ''}`}
                      aria-label={`${p.name} package, $${p.price}`}
                    >
                      <div className="sn-stop__n">{i + 1}</div>
                      <h3>{p.name}</h3>
                      <p className="sn-stop__desc">{p.blurb}</p>
                      <div className="sn-stop__price">
                        <strong>${p.price}</strong>
                        <span>flat · <span className="sn-draft" style={{ marginLeft: 4 }}>Draft</span></span>
                      </div>
                      <ul className="sn-stop__feats">
                        {p.features.map((f) => (
                          <li key={f} className="sn-stop__feat">
                            <Check size={17} strokeWidth={3} /> {f}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/apps/swiftnest/book?package=${p.id}`}
                        className={`sn-btn sn-btn--sm${p.hot ? '' : ' sn-btn--dark'}`}
                        style={{ width: '100%' }}
                      >
                        Choose {p.name.split(' ')[0]} <ArrowRight size={15} />
                      </Link>
                    </article>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={150}>
            <p style={{ textAlign: 'center', marginTop: 30, fontSize: 13.5, color: 'var(--sn-muted)' }}>
              Draft pricing shown transparently while we finalize launch — your final
              quote is confirmed before any payment.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ ADD-ONS ============ */}
      <section className="sn-section" style={{ paddingTop: 0 }}>
        <div className="sn-wrap">
          <Reveal>
            <div className="sn-section__head">
              <span className="sn-eyebrow">Add-ons</span>
              <h2 className="sn-display">Boost any delivery.</h2>
              <p>Layer extras onto any package at booking. Same draft-pricing promise.</p>
            </div>
          </Reveal>
          <div className="sn-addons">
            {ADDONS.map((a, i) => (
              <Reveal key={a.name} delay={i * 80}>
                <div className="sn-glass sn-addon">
                  <div className="sn-addon__icon">{a.icon}</div>
                  <h4>{a.name}</h4>
                  <p>{a.note}</p>
                  <p style={{ marginTop: 8 }}><strong>+${a.price}</strong></p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRACKING TIMELINE ============ */}
      <section id="tracking" className="sn-band sn-section">
        <div className="sn-wrap" style={{ position: 'relative' }}>
          <Reveal>
            <div className="sn-section__head">
              <span className="sn-eyebrow" style={{ color: '#fed7aa' }}>How it works</span>
              <h2 className="sn-display" style={{ color: '#fff' }}>Track it like a parcel. Because it is one.</h2>
              <p style={{ color: 'rgba(247,241,232,.7)' }}>
                From booking to doorstep in four milestones — with status updates
                at every step.
              </p>
            </div>
          </Reveal>
          <div className="sn-track">
            {[
              { icon: <Package size={19} />, t: 'Book in two minutes', d: 'Choose a package size, add extras, enter pickup and dropoff addresses.', time: '0:00' },
              { icon: <Truck size={19} />, t: 'Courier dispatched', d: 'The nearest vetted courier accepts your job and heads to pickup.', time: '~0:35' },
              { icon: <Navigation size={19} />, t: 'On the way', d: 'Live status updates as your package moves across the city.', time: '~1:10' },
              { icon: <BadgeCheck size={19} />, t: 'Delivered & confirmed', d: 'Photo proof of delivery the moment it lands. Signature if requested.', time: '~1:45' },
            ].map((m, i) => (
              <Reveal key={m.t} delay={i * 100}>
                <div className="sn-milestone">
                  <div className="sn-milestone__dot">{m.icon}</div>
                  <div className="sn-milestone__body">
                    <h3>{m.t}</h3>
                    <p>{m.d}</p>
                  </div>
                  <span className="sn-milestone__time">{m.time}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ZONES ============ */}
      <section id="zones" className="sn-section">
        <div className="sn-wrap">
          <div className="sn-split">
            <Reveal>
              <div className="sn-split__img">
                <img
                  src="/apps/swiftnest/detail.jpg"
                  alt="Hands passing a parcel sealed with orange tape in warm sunlight"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <div>
              <Reveal delay={100}>
                <span className="sn-eyebrow">Service zones</span>
                <h2 className="sn-display" style={{ fontSize: 'clamp(30px, 3.8vw, 48px)', margin: '18px 0 14px' }}>
                  Your corner of the city, covered.
                </h2>
                <p style={{ color: 'var(--sn-muted)', fontSize: 16.5, lineHeight: 1.7, margin: '0 0 6px' }}>
                  We run dense, zone-by-zone routes so couriers are always minutes
                  away — never across town. Zones expand weekly; your addresses
                  are confirmed instantly at booking.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <div className="sn-zones">
                  {ZONES.map((z) => (
                    <span key={z} className="sn-zone">
                      <MapPin size={14} /> {z}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="sn-section" style={{ paddingTop: 0 }}>
        <div className="sn-wrap">
          <Reveal>
            <div className="sn-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="sn-eyebrow" style={{ justifyContent: 'center' }}>Questions</span>
              <h2 className="sn-display">Everything, answered.</h2>
            </div>
          </Reveal>
          <div className="sn-faq">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details>
                  <summary>
                    {f.q}
                    <ChevronDown size={19} />
                  </summary>
                  <p className="sn-a">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="sn-section" style={{ paddingTop: 0 }}>
        <div className="sn-wrap">
          <Reveal>
            <div className="sn-cta">
              <h2 className="sn-display">Your package can&apos;t wait.<br />Neither should you.</h2>
              <p>
                Book in two minutes. See transparent draft pricing now, and get a
                courier to your door within the hour.
              </p>
              <Link href="/apps/swiftnest/book" className="sn-btn" style={{ fontSize: 17, padding: '18px 38px' }}>
                Book a courier <ArrowRight size={19} />
              </Link>
              <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,.55)' }}>
                <Clock size={13} style={{ verticalAlign: -2 }} /> Average pickup time: under 60 minutes in active zones
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="sn-footer">
        <div className="sn-footer__inner">
          <Link href="/apps/swiftnest" className="sn-brand" style={{ color: '#fff', fontSize: 17 }}>
            <span className="sn-brand__mark"><Package size={17} strokeWidth={2.4} /></span>
            SwiftNest
          </Link>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <Link href="/apps/swiftnest/book">Book</Link>
            <a href="#pricing">Pricing</a>
            <a href="#zones">Zones</a>
          </div>
          <span className="sn-testmode">Test mode · No live payments</span>
        </div>
        <div className="sn-footer__inner" style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 12.5 }}>
          <span>© 2026 SwiftNest. Same-day local courier.</span>
          <span>Prices shown are draft — confirmed before any payment. No real deliveries in test mode.</span>
        </div>
      </footer>
    </>
  );
}
