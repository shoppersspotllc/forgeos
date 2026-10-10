/**
 * FreshTurn booking success — shown after Stripe Checkout completes.
 * Next.js 16: searchParams is a Promise in page props.
 */
import Link from 'next/link';
import { Suspense } from 'react';
import { Check, ArrowLeft, CalendarCheck, KeyRound, Camera } from 'lucide-react';
import SessionRef from '../components/SessionRef';

export const metadata = {
  title: 'Booking Confirmed — FreshTurn',
};

export default function SuccessPage() {

  return (
    <div className="ft-success">
      <div className="ft-glass ft-success__card">
        <div className="ft-checkring" aria-hidden="true">
          <Check size={44} strokeWidth={3} />
        </div>
        <h1 className="ft-display">Booking confirmed!</h1>
        <p className="ft-success__sub">
          Thank you — your move-out cleaning is booked. Our team will contact
          you 24 hours before your cleaning date.
        </p>
        <Suspense fallback={null}>
          <SessionRef />
        </Suspense>

        <div className="ft-next">
          <h3>What happens next?</h3>
          <ol>
            <li>
              <span><strong>Save your reference</strong> above — it is your proof of booking and payment.</span>
            </li>
            <li>
              <span><strong>We confirm your date</strong> within 48 hours with an arrival window.</span>
            </li>
            <li>
              <span><strong>We arrive with everything</strong> — all supplies included, you do not need to be there.</span>
            </li>
            <li>
              <span><strong>Photo confirmation</strong> when the job is done — walk through with your landlord and get your deposit back.</span>
            </li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/apps/freshturn/book" className="ft-btn ft-btn--sm">
            <CalendarCheck size={16} /> Book another cleaning
          </Link>
          <Link href="/apps/freshturn" className="ft-backlink" style={{ padding: '11px 8px' }}>
            <ArrowLeft size={16} /> Back to FreshTurn
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap', fontSize: 13, color: 'var(--ft-muted)' }}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <KeyRound size={14} /> Key handoff arranged at confirmation
          </span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Camera size={14} /> Photo proof on completion
          </span>
        </div>
      </div>
    </div>
  );
}
