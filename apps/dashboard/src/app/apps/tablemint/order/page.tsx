'use client';

/**
 * TableMint flagship order page — mobile-first storefront.
 * Menu browsing, category filter, persistent cart, pickup/delivery,
 * checkout form, graceful payment errors.
 * Sends only item IDs + quantities — prices are server-side.
 */
import { useState } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed, ArrowLeft, Plus, Minus, Bike, Store,
  Lock, ShieldCheck, AlertCircle, ShoppingBag, X,
} from 'lucide-react';

const MENU = [
  { id: 'burger', name: 'Classic Burger', price: 1299, cat: 'Mains', desc: 'Beef patty, lettuce, tomato, house sauce.' },
  { id: 'pizza', name: 'Margherita Pizza', price: 1499, cat: 'Mains', desc: 'Fresh mozzarella, basil, tomato sauce.' },
  { id: 'pasta', name: 'Pasta Alfredo', price: 1399, cat: 'Mains', desc: 'Fettuccine, creamy alfredo, parmesan.' },
  { id: 'salad', name: 'Caesar Salad', price: 999, cat: 'Sides', desc: 'Romaine, parmesan, croutons, caesar dressing.' },
  { id: 'wings', name: 'Buffalo Wings (8)', price: 1199, cat: 'Sides', desc: 'Crispy wings, buffalo sauce, ranch.' },
  { id: 'soda', name: 'Fountain Drink', price: 299, cat: 'Drinks', desc: 'Coke, Sprite, or Dr Pepper.' },
];

const CATS = ['All', 'Mains', 'Sides', 'Drinks'];
const DELIVERY_FEE = 299;

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function OrderPage() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState('All');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const addItem = (id: string) => setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const removeItem = (id: string) =>
    setCart((p) => {
      const next = { ...p };
      if ((next[id] || 0) <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ ...MENU.find((m) => m.id === id)!, qty }))
    .filter((i) => i.id);
  const itemCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const visible = cat === 'All' ? MENU : MENU.filter((m) => m.cat === cat);

  const handleCheckout = async () => {
    setError('');
    if (cartItems.length === 0) {
      setError('Your cart is empty — add something delicious first.');
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in your name, email, and phone.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/apps/tablemint/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
          orderType,
          customer: { name, email, phone, address: orderType === 'delivery' ? address : undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');
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

  const cartPanel = (
    <div className={`tm-glass tm-cart${cartOpen ? '' : ' is-hidden-mobile'}`} aria-label="Your cart">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>Your order</h3>
        <button
          className="tm-cart__close"
          onClick={() => setCartOpen(false)}
          aria-label="Close cart"
        >
          <X size={18} />
        </button>
      </div>

      {cartItems.length === 0 ? (
        <p className="tm-cart__empty">
          Your cart is empty. Add something from the menu — your total updates
          live, and final pricing is always confirmed server-side.
        </p>
      ) : (
        <>
          <div className="tm-cart__lines">
            {cartItems.map((i) => (
              <div key={i.id} className="tm-cart__line">
                <span className="tm-name">{i.name}</span>
                <span className="tm-cart__mini">
                  <button onClick={() => removeItem(i.id)} aria-label={`Remove one ${i.name}`}>−</button>
                  <span className="tm-qty">×{i.qty}</span>
                  <button onClick={() => addItem(i.id)} aria-label={`Add one ${i.name}`}>+</button>
                </span>
                <span className="tm-amt">{fmt(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          <div className="tm-type" role="radiogroup" aria-label="Order type">
            <button
              type="button"
              role="radio"
              aria-checked={orderType === 'pickup'}
              className={orderType === 'pickup' ? 'is-active' : ''}
              onClick={() => setOrderType('pickup')}
            >
              <Store size={15} style={{ verticalAlign: -2 }} /> Pickup · Free
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={orderType === 'delivery'}
              className={orderType === 'delivery' ? 'is-active' : ''}
              onClick={() => setOrderType('delivery')}
            >
              <Bike size={15} style={{ verticalAlign: -2 }} /> Delivery · $2.99
            </button>
          </div>

          <div className="tm-cart__lines" style={{ marginTop: 0 }}>
            <div className="tm-cart__line"><span className="tm-name">Subtotal</span><span className="tm-amt">{fmt(subtotal)}</span></div>
            {deliveryFee > 0 && (
              <div className="tm-cart__line"><span className="tm-name">Delivery fee</span><span className="tm-amt">{fmt(deliveryFee)}</span></div>
            )}
          </div>
          <div className="tm-cart__total">
            <span style={{ fontSize: 14, color: 'var(--tm-muted)' }}>Total</span>
            <strong>{fmt(total)}</strong>
          </div>

          <div className="tm-checkout">
            <h4>Checkout</h4>
            {error && (
              <div className="tm-error" role="alert" aria-live="assertive">
                <AlertCircle size={17} style={{ flex: 'none', marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}
            <div className="tm-field">
              <label htmlFor="tm-name">Full name *</label>
              <input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jordan Ellis" />
            </div>
            <div className="tm-field">
              <label htmlFor="tm-email">Email *</label>
              <input id="tm-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
            </div>
            <div className="tm-field">
              <label htmlFor="tm-phone">Phone *</label>
              <input id="tm-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="(555) 123-4567" />
            </div>
            {orderType === 'delivery' && (
              <div className="tm-field">
                <label htmlFor="tm-address">Delivery address *</label>
                <input id="tm-address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" placeholder="123 Main St, Austin, TX" />
              </div>
            )}
            <button type="button" className="tm-btn" style={{ width: '100%' }} onClick={handleCheckout} disabled={loading}>
              {loading ? (
                <><span className="tm-spinner" /> Processing…</>
              ) : (
                <><Lock size={16} /> {`Pay ${fmt(total)}`}</>
              )}
            </button>
            <div className="tm-secure">
              <ShieldCheck size={15} /> <span>Secure checkout via Stripe · <strong>Test mode</strong> — no real charge</span>
            </div>
          </div>
        </>
      )}
      <p className="tm-cart__note">
        Demo storefront — no real orders are placed. Totals are computed
        server-side at checkout and cannot be altered from this page.
      </p>
    </div>
  );

  return (
    <div className="tm-order">
      {/* top bar */}
      <div style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, padding: '14px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/apps/tablemint" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--tm-ink)', fontWeight: 800, fontSize: 18 }}>
            <span className="tm-brand__mark" style={{ width: 34, height: 34 }}><UtensilsCrossed size={17} strokeWidth={2.4} /></span>
            TableMint
          </Link>
          <span className="tm-testmode" style={{ color: '#92600a', borderColor: 'rgba(146,96,10,.35)', background: 'rgba(254,243,199,.6)' }}>Test mode</span>
        </div>
      </div>

      <div className="tm-order__head">
        <Link href="/apps/tablemint" className="tm-backlink" style={{ paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back to TableMint
        </Link>
        <h1 className="tm-display">The menu</h1>
        <p>
          <span className="tm-demo">Demo menu</span>{' '}
          Sample items for demonstration. Add to your cart — checkout is a
          Stripe test transaction only.
        </p>
      </div>

      <div className="tm-order__grid">
        <div>
          <div className="tm-cats" role="tablist" aria-label="Menu categories">
            {CATS.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={cat === c}
                className={`tm-cat${cat === c ? ' is-active' : ''}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="tm-menu tm-menu--order">
            {visible.map((m) => {
              const qty = cart[m.id] || 0;
              return (
                <article key={m.id} className="tm-glass tm-dish" aria-label={`${m.name}, ${fmt(m.price)}`}>
                  <div className="tm-dish__cat">{m.cat}</div>
                  <h3>{m.name}</h3>
                  <p>{m.desc}</p>
                  <div className="tm-dish__foot">
                    <span className="tm-dish__price">{fmt(m.price)}</span>
                    <span className="tm-stepper" role="group" aria-label={`Quantity of ${m.name}`}>
                      {qty > 0 && (
                        <>
                          <button onClick={() => removeItem(m.id)} aria-label={`Remove one ${m.name}`}>
                            <Minus size={15} />
                          </button>
                          <span className="tm-stepper__n" aria-live="polite">{qty}</span>
                        </>
                      )}
                      <button className="tm-add" onClick={() => addItem(m.id)} aria-label={`Add ${m.name} to cart`}>
                        <Plus size={16} />
                      </button>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        {cartPanel}
      </div>

      {/* mobile cart FAB */}
      {itemCount > 0 && !cartOpen && (
        <button className="tm-cartfab" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${itemCount} items, ${fmt(total)}`}>
          <ShoppingBag size={18} />
          <span className="tm-cartfab__count">{itemCount}</span>
          {fmt(total)}
        </button>
      )}
    </div>
  );
}
