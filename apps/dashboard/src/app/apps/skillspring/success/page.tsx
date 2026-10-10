/**
 * SkillSpring enrollment success — shown after Stripe Checkout completes.
 * NOTE: This page confirms the redirect, not the payment.
 * Payment confirmation comes via webhook.
 */
import Link from 'next/link';
import { Suspense } from 'react';
import { Check, ArrowLeft, GraduationCap, CreditCard, Clock } from 'lucide-react';
import SessionRef from '../components/SessionRef';

export const metadata = {
  title: 'Enrolled — SkillSpring',
};

export default function SuccessPage() {
  return (
    <div className="ss-success">
      <div className="ss-glass ss-success__card">
        <div className="ss-checkring" aria-hidden="true">
          <Check size={44} strokeWidth={3} />
        </div>
        <h1 className="ss-display">You&apos;re enrolled!</h1>
        <p className="ss-success__sub">
          Your test checkout completed. In a live SkillSpring, your course
          library would be unlocked and a welcome email on its way.
        </p>
        <Suspense fallback={null}>
          <SessionRef />
        </Suspense>

        <div className="ss-next">
          <h3>What happens next?</h3>
          <ol>
            <li>
              <span><strong>Save your reference</strong> above — it is your proof of enrollment and payment.</span>
            </li>
            <li>
              <span><strong>Check your inbox</strong> — in a live SkillSpring, your welcome email and course link would arrive here.</span>
            </li>
            <li>
              <span><strong>Start module one</strong> — the sample course would open at the first lesson preview.</span>
            </li>
            <li>
              <span><strong>Learn at your pace</strong> — lifetime access means the material is there whenever you are.</span>
            </li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/apps/skillspring/enroll" className="ss-btn ss-btn--sm">
            <GraduationCap size={16} /> Enroll in another
          </Link>
          <Link href="/apps/skillspring" className="ss-backlink" style={{ padding: '11px 8px' }}>
            <ArrowLeft size={16} /> Back to SkillSpring
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap', fontSize: 13, color: 'var(--ss-muted)' }}>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <CreditCard size={14} /> Test mode — no real enrollment
          </span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Clock size={14} /> Demo learning platform
          </span>
        </div>

        <p style={{ marginTop: 20, fontSize: 12.5, color: 'var(--ss-muted)', lineHeight: 1.6 }}>
          This confirmation reflects your checkout redirect — final payment
          confirmation arrives via our secure webhook. Sample courses only:
          no instructors are named and no outcomes are promised.
        </p>
      </div>
    </div>
  );
}
