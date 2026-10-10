'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const PLANS = [
  { id: 'basic', name: 'Basic', price: 29, description: 'Gym access, locker room, 1 group class/week.' },
  { id: 'pro', name: 'Pro', price: 49, description: 'Unlimited classes, sauna, 1 PT session/month.' },
  { id: 'elite', name: 'Elite', price: 79, description: 'Everything in Pro + 4 PT sessions/month, nutrition plan.' },
];

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const [planId, setPlanId] = useState(searchParams.get('plan') || 'basic');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plan = PLANS.find((p) => p.id === planId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/apps/fitroutine/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, customer: { name, email, phone } }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
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
      <h1>Subscribe</h1>

      <h3>Choose Plan</h3>
      {PLANS.map((p) => (
        <label key={p.id} style={{ display: 'block', padding: 12, border: planId === p.id ? '2px solid #0070f3' : '1px solid #ddd', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
          <input type="radio" name="plan" checked={planId === p.id} onChange={() => setPlanId(p.id)} style={{ marginRight: 8 }} />
          {p.name} — <strong>${p.price}/mo</strong>
          <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{p.description}</div>
        </label>
      ))}

      <h3>Your Details</h3>
      <form onSubmit={handleSubmit}>
        <input style={inputStyle} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={inputStyle} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div style={{ fontSize: 14, color: '#666', margin: '16px 0', padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
          Recurring subscription: ${plan?.price}/month. Cancel anytime.
        </div>

        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: 16, fontSize: 18,
            background: loading ? '#ccc' : '#0070f3', color: 'white',
            border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : `Subscribe $${plan?.price}/mo`}
        </button>
      </form>

      <p style={{ fontSize: 14, color: '#888', marginTop: 16 }}>
        Test mode: use card 4242 4242 4242 4242. No real membership activated.
      </p>
    </div>
  );
}
