/**
 * SwiftNest delivery success — shown after Stripe Checkout completes.
 * NOTE: This page confirms the redirect, not the payment.
 * Payment confirmation comes via webhook.
 */
import Link from 'next/link';
import { Suspense } from 'react';
import { Check, ArrowLeft, Package, Truck, Camera, MapPin } from 'lucide-react';
import SessionRef from '../components/SessionRef';

export const metadata = {
  title: 'Delivery Booked — SwiftNest',
};

export default function SuccessPage() {
  return (
    <div className="sn-success">
      <div className="sn-glass sn-success__card">
        <div className="sn-checkring" aria-hidden="true">
          <Check size={44} strokeWidth={3} />
        </div>
        <h1 className="sn-display">Courier dispatched!</h1>
        <p className="sn-success__sub">
          Thank you — your delivery is booked. Your courier is being assigned
          now and you will receive status updates by email.
        </p>
        <Suspense fallback={null}>
          <SessionRef />
        </Suspense>

        <div className="sn-next">
          <h3>What happens next?</h3>
          <ol>
            <li>
              <span><strong>Save your reference</strong> above — it is your proof of booking and payment.</span>
            </li>
            <li>
              <span><strong>A courier is assigned</strong> within minutes and heads to your pickup address.</span>
            </li>
            <li>
              <span><strong>Status updates</strong> as your package moves — pickup, en route, delivered.</span>
            </li>
            <li>
              <span><strong>Photo proof of delivery</strong> the moment it lands at the dropoff.</span>
            </li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/apps/swiftnest/book" className="sn-btn sn-btn--sm">
            <Package size={16} /> Book another delivery
          </Link>
          <Link href="/apps/swiftnest" className="sn-backlink" style={{ padding: '11px 8px' }}>
            <ArrowLeft size={16} /> Back to SwiftNest
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap', fontSize: 13, color: 'var(--sn-muted)' }}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Truck size={14} /> Test mode — no real courier dispatched
          </span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Camera size={14} /> Photo proof on delivery
          </span>
        </div>

        <p style={{ marginTop: 20, fontSize: 12.5, color: 'var(--sn-muted)', lineHeight: 1.6 }}>
          <MapPin size={12} style={{ verticalAlign: -1 }} /> This confirmation reflects your
          checkout redirect — final payment confirmation arrives via our secure webhook.
        </p>
      </div>
    </div>
  );
}
