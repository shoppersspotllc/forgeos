/**
 * TableMint order success — shown after Stripe Checkout completes.
 * NOTE: This page confirms the redirect, not the payment.
 * Payment confirmation comes via webhook.
 */
import Link from 'next/link';
import { Suspense } from 'react';
import { Check, ArrowLeft, UtensilsCrossed, Clock, CreditCard } from 'lucide-react';
import SessionRef from '../components/SessionRef';

export const metadata = {
  title: 'Order Confirmed — TableMint',
};

export default function SuccessPage() {
  return (
    <div className="tm-success">
      <div className="tm-glass tm-success__card">
        <div className="tm-checkring" aria-hidden="true">
          <Check size={44} strokeWidth={3} />
        </div>
        <h1 className="tm-display">Order confirmed!</h1>
        <p className="tm-success__sub">
          Thank you — your test checkout completed. In a live storefront, the
          kitchen would have your ticket and you&apos;d get a confirmation
          email shortly.
        </p>
        <Suspense fallback={null}>
          <SessionRef />
        </Suspense>

        <div className="tm-next">
          <h3>What happens next?</h3>
          <ol>
            <li>
              <span><strong>Save your reference</strong> above — it is your proof of order and payment.</span>
            </li>
            <li>
              <span><strong>The kitchen confirms</strong> — in a live storefront, your order would be confirmed and prepared fresh.</span>
            </li>
            <li>
              <span><strong>Pickup or delivery</strong> — you&apos;d be notified the moment it&apos;s ready or on its way.</span>
            </li>
            <li>
              <span><strong>Enjoy.</strong> Questions about your order? Reply to your confirmation email.</span>
            </li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/apps/tablemint/order" className="tm-btn tm-btn--sm">
            <UtensilsCrossed size={16} /> Order again
          </Link>
          <Link href="/apps/tablemint" className="tm-backlink" style={{ padding: '11px 8px' }}>
            <ArrowLeft size={16} /> Back to TableMint
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap', fontSize: 13, color: 'var(--tm-muted)' }}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <CreditCard size={14} /> Test mode — no real order placed
          </span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Clock size={14} /> Demo storefront
          </span>
        </div>

        <p style={{ marginTop: 20, fontSize: 12.5, color: 'var(--tm-muted)', lineHeight: 1.6 }}>
          This confirmation reflects your checkout redirect — final payment
          confirmation arrives via our secure webhook.
        </p>
      </div>
    </div>
  );
}
