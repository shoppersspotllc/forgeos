/**
 * DirectDish Landing Page
 * Direct restaurant ordering — restaurants keep more.
 */

import Link from 'next/link';

export default function DirectDishPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>DirectDish</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
        Order direct. Restaurants keep more. No middleman markup.
      </p>

      <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 32, marginBottom: 32, textAlign: 'center' }}>
        <h2>How it works</h2>
        <ol style={{ color: '#555', textAlign: 'left', maxWidth: 500, margin: '0 auto' }}>
          <li>Browse the menu below</li>
          <li>Add items to your order</li>
          <li>Enter pickup or delivery details</li>
          <li>Pay securely with Stripe (test mode)</li>
          <li>The restaurant confirms your order</li>
        </ol>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link
          href="/apps/directdish/order"
          style={{
            display: 'inline-block',
            padding: '14px 40px',
            background: '#0070f3',
            color: 'white',
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 18,
          }}
        >
          Start Order
        </Link>
      </div>

      <p style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>
        Test mode: no real orders are placed. Payments use Stripe test cards only.
      </p>
    </div>
  );
}
