/**
 * SwiftNest Landing Page
 * Same-day local courier service.
 */

import Link from 'next/link';

const PACKAGES = [
  {
    id: 'small',
    name: 'Small Parcel',
    price: 12,
    description: 'Up to 5 lbs. Documents, small boxes, food orders.',
  },
  {
    id: 'medium',
    name: 'Medium Package',
    price: 19,
    description: 'Up to 20 lbs. Standard boxes, multiple items.',
  },
  {
    id: 'large',
    name: 'Large / Bulky',
    price: 29,
    description: 'Up to 50 lbs. Large boxes, bulky items.',
  },
];

export default function SwiftNestPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>SwiftNest</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
        Same-day local courier. Pick up and deliver in hours, not days.
      </p>

      <div style={{ display: 'grid', gap: 16, marginBottom: 32 }}>
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
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
              <h3 style={{ margin: '0 0 8px 0' }}>{pkg.name}</h3>
              <p style={{ margin: 0, color: '#666' }}>{pkg.description}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>${pkg.price}</div>
              <Link
                href={`/apps/swiftnest/book?package=${pkg.id}`}
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '10px 24px',
                  background: '#ea580c',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 24 }}>
        <h3>How it works</h3>
        <ol style={{ color: '#555' }}>
          <li>Choose your package size and add-ons</li>
          <li>Enter pickup and dropoff addresses</li>
          <li>Pay securely with Stripe (test mode)</li>
          <li>Your courier is dispatched</li>
        </ol>
        <p style={{ fontSize: 14, color: '#888', marginTop: 16 }}>
          Test mode: no real deliveries are performed. Payments use Stripe test cards only.
        </p>
      </div>
    </div>
  );
}
