'use client';

/**
 * FreshTurn Booking Flow
 * Step 1: Select package → Step 2: Add-ons → Step 3: Details & date → Step 4: Stripe Checkout
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const PACKAGES = [
  { id: 'studio', name: 'Studio / 1-Bed', price: 149 },
  { id: 'standard', name: '2-Bed Standard', price: 249 },
  { id: 'deep', name: '3-Bed+ Deep Clean', price: 399 },
];

const ADDONS = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 25 },
  { id: 'oven', name: 'Inside Oven', price: 25 },
  { id: 'windows', name: 'Interior Windows', price: 35 },
  { id: 'laundry', name: 'Laundry Room Detail', price: 20 },
  { id: 'pet', name: 'Pet Hair Treatment', price: 30 },
];

function BookingFlow() {
  const searchParams = useSearchParams();
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
  const addonsTotal = ADDONS.filter((a) => selectedAddons.includes(a.id)).reduce((s, a) => s + a.price, 0);
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

  const handleCheckout = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !address.trim() || !date) {
      setError('Please fill in your name, email, address, and preferred date.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 16, marginBottom: 12, boxSizing: 'border-box',
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: '48px 24px', color: '#1a1a1a' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Book Your Cleaning</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Secure checkout via Stripe. No payment due until booking is confirmed.</p>

      {/* Package selection */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Choose Your Package</h2>
      <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
        {PACKAGES.map((p) => (
          <label
            key={p.id}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: pkg === p.id ? '2px solid #22c55e' : '1px solid #e5e5e5',
              borderRadius: 10, padding: '16px 20px', cursor: 'pointer',
              background: pkg === p.id ? '#f0fdf4' : '#fff',
            }}
          >
            <span>
              <input type="radio" name="pkg" checked={pkg === p.id} onChange={() => setPkg(p.id)} style={{ marginRight: 12 }} />
              <strong>{p.name}</strong>
            </span>
            <strong style={{ color: '#15803d', fontSize: 20 }}>${p.price}</strong>
          </label>
        ))}
      </div>

      {/* Add-ons */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. Add Extras (Optional)</h2>
      <div style={{ display: 'grid', gap: 8, marginBottom: 32 }}>
        {ADDONS.map((a) => (
          <label
            key={a.id}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: '1px solid #e5e5e5', borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
              background: selectedAddons.includes(a.id) ? '#f0fdf4' : '#fff',
            }}
          >
            <span>
              <input type="checkbox" checked={selectedAddons.includes(a.id)} onChange={() => toggleAddon(a.id)} style={{ marginRight: 12 }} />
              {a.name}
            </span>
            <span style={{ color: '#15803d', fontWeight: 600 }}>+${a.price}</span>
          </label>
        ))}
      </div>

      {/* Details */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. Your Details</h2>
      <input style={inputStyle} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} />
      <input style={inputStyle} placeholder="Email address *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={inputStyle} placeholder="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input style={inputStyle} placeholder="Property address *" value={address} onChange={(e) => setAddress(e.target.value)} />
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>Preferred cleaning date *</label>
      <input style={inputStyle} type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
      <textarea
        style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
        placeholder="Any special instructions? (gate codes, parking, areas of concern...)"
        value={notes} onChange={(e) => setNotes(e.target.value)}
      />

      {/* Total */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 20, margin: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>{pkgData.name}</span><span>${pkgData.price}</span>
        </div>
        {ADDONS.filter((a) => selectedAddons.includes(a.id)).map((a) => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#666' }}>
            <span>{a.name}</span><span>+${a.price}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bbf7d0', paddingTop: 12, fontSize: 20, fontWeight: 800 }}>
          <span>Total</span><span style={{ color: '#15803d' }}>${total}</span>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          width: '100%', background: loading ? '#bbf7d0' : '#15803d', color: '#fff',
          padding: '16px', borderRadius: 10, fontWeight: 700, fontSize: 18,
          border: 'none', cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Processing...' : `Pay $${total} & Book →`}
      </button>
      <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: 12 }}>
        🔒 Secure payment via Stripe · Test mode — no real charge
      </p>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>}>
      <BookingFlow />
    </Suspense>
  );
}
