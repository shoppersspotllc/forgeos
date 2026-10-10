/**
 * FreshTurn Booking Success Page
 * Shown after Stripe Checkout completes.
 */

import Link from 'next/link';

export const metadata = {
  title: 'Booking Confirmed — FreshTurn',
};

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center', color: '#1a1a1a' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 40 }}>
        ✓
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
        Booking Confirmed!
      </h1>
      <p style={{ color: '#666', fontSize: 17, marginBottom: 8 }}>
        Thank you! Your move-out cleaning is booked.
      </p>
      <p style={{ color: '#666', fontSize: 15, marginBottom: 32 }}>
        Your payment was successful. Save this page for your records.
        Our team will contact you 24 hours before your cleaning date.
      </p>

      {searchParams.session_id && (
        <p style={{ fontSize: 13, color: '#999', marginBottom: 32 }}>
          Reference: {searchParams.session_id.substring(0, 20)}...
        </p>
      )}

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 20, textAlign: 'left', marginBottom: 32 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 12px' }}>What happens next?</h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: '#444' }}>
          <li style={{ marginBottom: 8 }}>Your booking reference is shown above — save it for your records</li>
          <li style={{ marginBottom: 8 }}>Our team confirms your date 48 hours before</li>
          <li style={{ marginBottom: 8 }}>We arrive with all supplies — you don't need to be there</li>
          <li>Walk through with your landlord and get your deposit back</li>
        </ol>
      </div>

      <Link
        href="/apps/freshturn"
        style={{ display: 'inline-block', color: '#15803d', fontWeight: 600, textDecoration: 'none' }}
      >
        ← Back to FreshTurn
      </Link>
    </div>
  );
}
