/**
 * TableMint — flagship landing.
 * Cinematic food hero · demo menu with categories · how it works ·
 * detail split · FAQ. Sample menu clearly labeled as demo.
 */
import Link from 'next/link';
import {
  UtensilsCrossed, ArrowRight, Check, Clock, Bike, Store,
  ChevronDown, ShieldCheck, Leaf, Sparkles,
} from 'lucide-react';
import NavBar from './components/NavBar';
import HeroScene from './components/HeroScene';
import Reveal from './components/Reveal';
import Tilt from './components/Tilt';

export const metadata = {
  title: 'TableMint — Order Direct',
  description:
    'Premium direct restaurant ordering. Browse the demo menu, build your order, and check out in minutes. Test mode — no real orders.',
};

const MENU = [
  { id: 'burger', name: 'Classic Burger', price: 12.99, cat: 'Mains', desc: 'Beef patty, lettuce, tomato, house sauce.' },
  { id: 'pizza', name: 'Margherita Pizza', price: 14.99, cat: 'Mains', desc: 'Fresh mozzarella, basil, tomato sauce.' },
  { id: 'pasta', name: 'Pasta Alfredo', price: 13.99, cat: 'Mains', desc: 'Fettuccine, creamy alfredo, parmesan.' },
  { id: 'salad', name: 'Caesar Salad', price: 9.99, cat: 'Sides', desc: 'Romaine, parmesan, croutons, caesar dressing.' },
  { id: 'wings', name: 'Buffalo Wings (8)', price: 11.99, cat: 'Sides', desc: 'Crispy wings, buffalo sauce, ranch.' },
  { id: 'soda', name: 'Fountain Drink', price: 2.99, cat: 'Drinks', desc: 'Coke, Sprite, or Dr Pepper.' },
];

const CATS = ['All', 'Mains', 'Sides', 'Drinks'];

const FAQS = [
  {
    q: 'Is this a real restaurant?',
    a: 'No. TableMint is a demonstration storefront — the menu, prices, and kitchen are sample content for showcasing the ordering experience. No real food is prepared and no real orders are placed.',
  },
  {
    q: 'How does ordering work?',
    a: 'Browse the demo menu, add items to your cart, choose pickup or delivery, and check out securely. In test mode, checkout uses Stripe test cards only and no real payment can occur.',
  },
  {
    q: 'Are the prices real?',
    a: 'Prices are server-controlled and always calculated on our side — what you see is what the kitchen would charge. But this is a demo menu: no real restaurant stands behind these items or prices.',
  },
  {
    q: 'Pickup or delivery?',
    a: 'Both are supported in the demo flow. Pickup is free; delivery adds a $2.99 fee, calculated server-side at checkout.',
  },
];

export default function TableMintHome() {
  return (
    <>
      <NavBar />

      {/* ============ CINEMATIC HERO ============ */}
      <header className="tm-hero">
        <div
          className="tm-hero__bg"
          style={{ backgroundImage: "url('/apps/tablemint/hero.jpg')" }}
          role="img"
          aria-label="Elegant restaurant dish with fresh herbs in warm candlelight"
        />
        <div className="tm-hero__scrim" />
        <HeroScene />
        <div className="tm-hero__content">
          <div>
            <Reveal immediate>
              <span className="tm-eyebrow" style={{ color: '#a7f3d0' }}>
                Direct restaurant ordering
              </span>
            </Reveal>
            <Reveal immediate delay={120}>
              <h1 className="tm-display">
                Order direct.
                <br />
                <span className="tm-accent">Savor everything.</span>
              </h1>
            </Reveal>
            <Reveal immediate delay={240}>
              <p className="tm-hero__sub">
                TableMint is a premium direct-ordering storefront — browse the
                demo menu, build your order in seconds, and check out securely.
                No middleman markup, no fuss.
              </p>
            </Reveal>
            <Reveal immediate delay={360}>
              <div className="tm-hero__ctas">
                <Link href="/apps/tablemint/order" className="tm-btn">
                  Start your order <ArrowRight size={18} />
                </Link>
                <a href="#menu" className="tm-btn tm-btn--ghost">
                  Browse the menu
                </a>
              </div>
            </Reveal>
            <Reveal immediate delay={480}>
              <div className="tm-hero__proof">
                <span className="tm-chip"><Clock size={15} /> Ready in ~25 min</span>
                <span className="tm-chip"><Store size={15} /> Pickup & delivery</span>
                <span className="tm-chip"><Leaf size={15} /> Fresh, made to order</span>
              </div>
            </Reveal>
          </div>

          <Reveal immediate delay={300}>
            <Tilt max={6}>
              <div className="tm-glass tm-tonight">
                <div className="tm-tonight__head">
                  <h3>Tonight&apos;s order</h3>
                  <span className="tm-demo">Demo</span>
                </div>
                <div className="tm-tonight__rows">
                  <div className="tm-tonight__row"><span>Margherita Pizza × 1</span><span>$14.99</span></div>
                  <div className="tm-tonight__row"><span>Buffalo Wings (8) × 1</span><span>$11.99</span></div>
                  <div className="tm-tonight__row"><span>Fountain Drink × 2</span><span>$5.98</span></div>
                </div>
                <div className="tm-tonight__total">
                  <span style={{ fontSize: 14, color: 'var(--tm-muted)' }}>Subtotal</span>
                  <strong>$32.96</strong>
                </div>
                <Link
                  href="/apps/tablemint/order"
                  className="tm-btn tm-btn--dark"
                  style={{ width: '100%' }}
                >
                  Build my order <ArrowRight size={17} />
                </Link>
                <p style={{ fontSize: 12.5, color: 'var(--tm-muted)', textAlign: 'center', margin: '12px 0 0' }}>
                  Sample cart — prices calculated server-side at checkout.
                </p>
              </div>
            </Tilt>
          </Reveal>
        </div>
        <div className="tm-scrollcue" aria-hidden="true">
          <span>Scroll</span>
          <span className="tm-scrollcue__line" />
        </div>
      </header>

      {/* ============ MENU ============ */}
      <section id="menu" className="tm-section">
        <div className="tm-wrap">
          <Reveal>
            <div className="tm-section__head">
              <span className="tm-eyebrow">The menu</span>
              <h2 className="tm-display">Made fresh, priced fairly.</h2>
              <p>
                A short menu, done well. <span className="tm-demo">Demo menu</span> —
                sample items for demonstration; no real kitchen behind them.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="tm-cats" role="tablist" aria-label="Menu categories">
              {CATS.map((c, i) => (
                <a
                  key={c}
                  href="#menu"
                  className={`tm-cat${i === 0 ? ' is-active' : ''}`}
                  role="tab"
                  aria-selected={i === 0}
                >
                  {c}
                </a>
              ))}
            </div>
          </Reveal>
          <div className="tm-menu">
            {MENU.map((m, i) => (
              <Reveal key={m.id} delay={(i % 3) * 100}>
                <Tilt max={5}>
                  <article className="tm-glass tm-dish" aria-label={`${m.name}, $${m.price.toFixed(2)}`}>
                    <div className="tm-dish__cat">{m.cat}</div>
                    <h3>{m.name}</h3>
                    <p>{m.desc}</p>
                    <div className="tm-dish__foot">
                      <span className="tm-dish__price">${m.price.toFixed(2)}</span>
                      <Link
                        href="/apps/tablemint/order"
                        className="tm-btn tm-btn--sm"
                        aria-label={`Order ${m.name}`}
                      >
                        Order <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                </Tilt>
              </Reveal>
            ))}
          </div>
          <Reveal delay={120}>
            <p style={{ marginTop: 24, fontSize: 13.5, color: 'var(--tm-muted)', lineHeight: 1.7 }}>
              <Sparkles size={14} style={{ verticalAlign: -2, color: 'var(--tm-mint-deep)' }} />{' '}
              Demo menu — items, descriptions, and prices are sample content.
              Final totals are always computed server-side at checkout.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="tm-band tm-section">
        <div className="tm-wrap" style={{ position: 'relative' }}>
          <Reveal>
            <div className="tm-section__head">
              <span className="tm-eyebrow" style={{ color: '#a7f3d0' }}>How it works</span>
              <h2 className="tm-display" style={{ color: '#fff' }}>From craving to table.</h2>
              <p style={{ color: 'rgba(247,241,230,.7)' }}>
                Four steps between you and dinner. The whole flow takes about
                two minutes.
              </p>
            </div>
          </Reveal>
          <div className="tm-steps">
            {[
              { t: 'Browse the menu', d: 'Short, seasonal, and priced upfront — no surprises at checkout.' },
              { t: 'Build your cart', d: 'Add items with one tap. Your cart total updates live as you go.' },
              { t: 'Choose pickup or delivery', d: 'Pickup is free; delivery adds a $2.99 fee, set server-side.' },
              { t: 'Check out securely', d: 'Stripe test-mode checkout. In demo, no real order is placed.' },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 100}>
                <div className="tm-glass tm-glass--dark tm-step">
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DETAIL SPLIT ============ */}
      <section className="tm-section">
        <div className="tm-wrap">
          <div className="tm-split">
            <Reveal>
              <div className="tm-split__img">
                <img
                  src="/apps/tablemint/detail.jpg"
                  alt="Fresh basil, mint and citrus on warm ceramic in soft window light"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <div>
              <Reveal delay={100}>
                <span className="tm-eyebrow">Why TableMint</span>
                <h2 className="tm-display" style={{ fontSize: 'clamp(30px, 3.8vw, 48px)', margin: '18px 0 14px' }}>
                  Direct ordering, done right.
                </h2>
                <p style={{ color: 'var(--tm-muted)', fontSize: 16.5, lineHeight: 1.7, margin: 0 }}>
                  Built for restaurants that want their customers back — and for
                  diners who want dinner without the markup maze.
                </p>
              </Reveal>
              <Reveal delay={200}>
                <ul className="tm-checklist">
                  <li><ShieldCheck size={19} /> <span><strong>Honest totals.</strong> Prices and fees are computed server-side — the total you see is the total you pay.</span></li>
                  <li><Clock size={19} /> <span><strong>Fast by design.</strong> The demo flow goes from menu to checkout in about two minutes.</span></li>
                  <li><Bike size={19} /> <span><strong>Pickup & delivery.</strong> Free pickup, or $2.99 delivery — confirmed before you pay.</span></li>
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="tm-section" style={{ paddingTop: 0 }}>
        <div className="tm-wrap">
          <Reveal>
            <div className="tm-section__head" style={{ textAlign: 'center', marginInline: 'auto' }}>
              <span className="tm-eyebrow" style={{ justifyContent: 'center' }}>Questions</span>
              <h2 className="tm-display">Good to know.</h2>
            </div>
          </Reveal>
          <div className="tm-faq">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details>
                  <summary>
                    {f.q}
                    <ChevronDown size={19} />
                  </summary>
                  <p className="tm-a">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="tm-section" style={{ paddingTop: 0 }}>
        <div className="tm-wrap">
          <Reveal>
            <div className="tm-cta">
              <h2 className="tm-display">Dinner is two minutes away.</h2>
              <p>
                Browse the demo menu, build your cart, and check out securely.
                Test mode — no real orders, no real charges.
              </p>
              <Link href="/apps/tablemint/order" className="tm-btn" style={{ fontSize: 17, padding: '18px 40px' }}>
                Start your order <ArrowRight size={19} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="tm-footer">
        <div className="tm-footer__inner">
          <Link href="/apps/tablemint" className="tm-brand" style={{ color: '#fff', fontSize: 17 }}>
            <span className="tm-brand__mark"><UtensilsCrossed size={17} strokeWidth={2.4} /></span>
            TableMint
          </Link>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <Link href="/apps/tablemint/order">Order</Link>
            <a href="#menu">Menu</a>
            <a href="#faq">FAQ</a>
          </div>
          <span className="tm-testmode">Test mode · No live payments</span>
        </div>
        <div className="tm-footer__inner" style={{ marginTop: 26, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.08)', fontSize: 12.5 }}>
          <span>© 2026 TableMint. Demonstration storefront.</span>
          <span>Sample menu — no real restaurant, kitchen, or delivery operation.</span>
        </div>
      </footer>
    </>
  );
}
