/**
 * PulsePilot membership success — shown after Stripe Checkout completes.
 * NOTE: This page confirms the redirect, not the subscription.
 * Subscription confirmation comes via webhook.
 */
import Link from 'next/link';
import { Suspense } from 'react';
import { Check, ArrowLeft, Activity, CalendarCheck, CreditCard } from 'lucide-react';
import SessionRef from '../components/SessionRef';

export const metadata = {
  title: 'Welcome to PulsePilot',
};

export default function SuccessPage() {
  return (
    <div className="pp-success">
      <div className="pp-glass pp-success__card">
        <div className="pp-checkring" aria-hidden="true">
          <Check size={44} strokeWidth={3} />
        </div>
        <h1 className="pp-display">You&apos;re in.</h1>
        <p className="pp-success__sub">
          Welcome to PulsePilot — your membership is active. Your first step:
          book your movement assessment and meet your coach.
        </p>
        <Suspense fallback={null}>
          <SessionRef />
        </Suspense>

        <div className="pp-next">
          <h3>What happens next?</h3>
          <ol>
            <li>
              <span><strong>Save your reference</strong> above — it is your proof of membership and payment.</span>
            </li>
            <li>
              <span><strong>Book your assessment</strong> — your first coaching session maps your movement, baselines, and goals.</span>
            </li>
            <li>
              <span><strong>Get your program</strong> — your coach builds your training plan around your schedule.</span>
            </li>
            <li>
              <span><strong>Train & track</strong> — log every session in the app and watch your baselines move.</span>
            </li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/apps/pulsepilot" className="pp-btn pp-btn--sm">
            <Activity size={16} /> Back to PulsePilot
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap', fontSize: 13, color: 'var(--pp-muted)' }}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <CreditCard size={14} /> Test mode — no real subscription activated
          </span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <CalendarCheck size={14} /> Cancel anytime, month-to-month
          </span>
        </div>

        <p style={{ marginTop: 20, fontSize: 12.5, color: 'var(--pp-muted)', lineHeight: 1.6 }}>
          This confirmation reflects your checkout redirect — final subscription
          confirmation arrives via our secure webhook. <Link href="/apps/pulsepilot" style={{ color: 'var(--pp-red)' }}><ArrowLeft size={12} style={{ verticalAlign: -1 }} /> Home</Link>
        </p>
      </div>
    </div>
  );
}
