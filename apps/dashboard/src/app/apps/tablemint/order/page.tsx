'use client';

/**
 * TableMint Order Page
 * Menu browsing, cart, checkout.
 * Sends only item IDs + quantities — prices are server-side.
 */

import { useState } from 'react';

const MENU = [
  { id: 'burger', name: 'Classic Burger', price: 1299, description: 'Beef patty, lettuce, tomato, house sauce' },
  { id: 'pizza', name: 'Margherita Pizza', price: 1499, description: 'Fresh mozzarella, basil, tomato sauce' },
  { id: 'salad', name: 'Caesar Salad', price: 999, description: 'Romaine, parmesan, croutons, caesar dressing' },
  { id: 'pasta', name: 'Pasta Alfredo', price: 1399, description: 'Fettuccine, creamy alfredo, parmesan' },
  { id: 'wings', name: 'Buffalo Wings (8)', price: 1199, description: 'Crispy wings, buffalo sauce, ranch' },
  { id: 'soda', name: 'Fountain Drink', price: 299, description: 'Coke, Sprite, or Dr Pepper' },
];

export default function OrderPage() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addItem = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeItem = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id] <= 1) delete next[id];
      else next[id]--;
      return next;
    });
  };

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ ...MENU.find((m) => m.id === id)!, qty }))
    .filter((i) => i.id);

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = orderType === 'delivery' ? 299 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (cartItems.length === 0) {
      setError('Your cart is empty.');
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
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: 12, borderRadius: 8,
    border: '1px solid #ddd', fontSize: 16, marginBottom: 12,
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <h1>Menu</h1>

      <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
        {MENU.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{item.name}</strong>
              <div style={{ fontSize: 14, color: '#666' }}>{item.description}</div>
              <div style={{ fontWeight: 'bold', marginTop: 4 }}>${(item.price / 100).toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {cart[item.id] > 0 && (
                <>
                  <button onClick={() => removeItem(item.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}>−</button>
                  <span style={{ minWidth: 24, textAlign: 'center' }}>{cart[item.id]}</span>
                </>
              )}
              <button onClick={() => addItem(item.id)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#059669', color: 'white', cursor: 'pointer' }}>+</button>
            </div>
          </div>
        ))}
      </div>

      {cartItems.length > 0 && (
        <div style={{ borderTop: '2px solid #eee', paddingTop: 16 }}>
          <h2>Your Order</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ marginRight: 16 }}>
              <input type="radio" checked={orderType === 'pickup'} onChange={() => setOrderType('pickup')} style={{ marginRight: 6 }} />
              Pickup (free)
            </label>
            <label>
              <input type="radio" checked={orderType === 'delivery'} onChange={() => setOrderType('delivery')} style={{ marginRight: 6 }} />
              Delivery (+$2.99)
            </label>
          </div>

          {cartItems.map((i) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>{i.name} × {i.qty}</span>
              <span>${((i.price * i.qty) / 100).toFixed(2)}</span>
            </div>
          ))}
          {deliveryFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>Delivery fee</span>
              <span>${(deliveryFee / 100).toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 'bold', fontSize: 18, borderTop: '1px solid #eee' }}>
            <span>Total</span>
            <span>${(total / 100).toFixed(2)}</span>
          </div>

          <form onSubmit={handleCheckout} style={{ marginTop: 16 }}>
            <input style={inputStyle} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} required />
            <input style={inputStyle} placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input style={inputStyle} placeholder="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            {orderType === 'delivery' && (
              <input style={inputStyle} placeholder="Delivery address *" value={address} onChange={(e) => setAddress(e.target.value)} required />
            )}

            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: 16, fontSize: 18,
                background: loading ? '#ccc' : '#059669', color: 'white',
                border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Processing...' : `Pay $${(total / 100).toFixed(2)}`}
            </button>
          </form>
        </div>
      )}

      <p style={{ fontSize: 14, color: '#888', marginTop: 24 }}>
        Test mode: use card 4242 4242 4242 4242. No real orders placed.
      </p>
    </div>
  );
}
