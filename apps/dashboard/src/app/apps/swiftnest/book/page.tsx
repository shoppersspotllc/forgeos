'use client';

/**
 * SwiftNest Booking Page
 * Select package, add-ons, enter pickup/dropoff details.
 * Sends only IDs to API — prices are server-side.
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const PACKAGES = [
  { id: 'small', name: 'Small Parcel (up to 5 lbs)', price: 12 },
  { id: 'medium', name: 'Medium Package (up to 20 lbs)', price: 19 },
  { id: 'large', name: 'Large / Bulky (up to 50 lbs)', price: 29 },
];

const ADDONS = [
  { id: 'express', name: 'Express 2-Hour Delivery', price: 8 },
  { id: 'fragile', name: 'Fragile Handling', price: 5 },
  { id: 'signature', name: 'Signature Required', price: 3 },
  { id: 'scheduled', name: 'Scheduled Time Window', price: 4 },
];

export default function BookPage() {
  const searchParams = useSearchParams();
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

  const pkgPrice = PACKAGES.find((p) => p.id === pkg)?.price || 0;
  const addonsPrice = selectedAddons.reduce(
    (sum, id) => sum + (ADDONS.find((a) => a.id === id)?.price || 0), 0
  );
  const total = pkgPrice + addonsPrice;

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <h1>Book a Delivery</h1>

      <h3>Package Size</h3>
      {PACKAGES.map((p) => (
        <label key={p.id} style={{ display: 'block', padding: 12, border: pkg === p.id ? '2px solid #ea580c' : '1px solid #ddd', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
          <input type="radio" name="pkg" checked={pkg === p.id} onChange={() => setPkg(p.id)} style={{ marginRight: 8 }} />
          {p.name} — <strong>${p.price}</strong>
        </label>
      ))}

      <h3>Add-ons</h3>
      {ADDONS.map((a) => (
        <label key={a.id} style={{ display: 'block', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={selectedAddons.includes(a.id)} onChange={() => toggleAddon(a.id)} style={{ marginRight: 8 }} />
          {a.name} — <strong>+${a.price}</strong>
        </label>
      ))}

      <h3>Delivery Details</h3>
      <form onSubmit={handleSubmit}>
        <input style={inputStyle} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={inputStyle} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input style={inputStyle} placeholder="Pickup address *" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} required />
        <input style={inputStyle} placeholder="Dropoff address *" value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} required />
        <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div style={{ fontSize: 20, margin: '16px 0' }}>
          Total: <strong>${total}</strong>
        </div>

        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: 16, fontSize: 18,
            background: loading ? '#ccc' : '#ea580c', color: 'white',
            border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : `Pay $${total} with Stripe`}
        </button>
      </form>

      <p style={{ fontSize: 14, color: '#888', marginTop: 16 }}>
        Test mode: use card 4242 4242 4242 4242. No real deliveries performed.
      </p>
    </div>
  );
}
