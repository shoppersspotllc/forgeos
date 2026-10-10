/**
 * FitRoutine Landing Page
 * Fitness memberships.
 */

import Link from 'next/link';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    description: 'Gym access, locker room, 1 group class/week.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    description: 'Unlimited classes, sauna, 1 PT session/month.',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 79,
    description: 'Everything in Pro + 4 PT sessions/month, nutrition plan.',
  },
];

export default function FitRoutinePage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>FitRoutine</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
        Your membership. Your momentum. No contracts, cancel anytime.
      </p>

      <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>{plan.name}</h3>
              <p style={{ margin: 0, color: '#666' }}>{plan.description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>${plan.price}<span style={{ fontSize: 14, fontWeight: 'normal' }}>/mo</span></div>
              <Link
                href={`/apps/fitroutine/subscribe?plan=${plan.id}`}
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '10px 24px',
                  background: '#0070f3',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Subscribe
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 24 }}>
        <h3>How it works</h3>
        <ol style={{ color: '#555' }}>
          <li>Choose your membership plan</li>
          <li>Enter your details</li>
          <li>Subscribe securely with Stripe (test mode)</li>
          <li>Start training — membership activates immediately</li>
        </ol>
        <p style={{ fontSize: 14, color: '#888', marginTop: 16 }}>
          Test mode: no real membership is activated. Payments use Stripe test cards only.
          Subscriptions are recurring — cancel anytime in test mode via Stripe dashboard.
        </p>
      </div>
    </div>
  );
}
