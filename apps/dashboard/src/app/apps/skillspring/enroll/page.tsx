'use client';

/**
 * SkillSpring flagship enrollment — 3 steps (Course → Details → Review).
 * Sticky summary, one-time pricing clarity, TEST MODE badges,
 * graceful handling when Stripe is not configured.
 * Sends only courseId + customer — prices are server-side.
 */
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, ArrowLeft, ArrowRight, AlertCircle, Lock,
  ShieldCheck, Check,
} from 'lucide-react';
import { COURSES, getCourse } from '../courses';

const STEPS = ['Course', 'Details', 'Review'];

function EnrollFlow() {
  const searchParams = useSearchParams();
  const [courseId, setCourseId] = useState(searchParams.get('course') || 'negotiation');
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const course = getCourse(courseId);

  const validateDetails = () => {
    if (!name.trim() || !email.trim()) {
      setError('Please fill in your name and email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const next = () => {
    setError('');
    if (step === 1 && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnroll = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/apps/skillspring/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, customer: { name, email } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enrollment failed');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
    setLoading(false);
  };

  const summary = (
    <div className="ss-glass ss-summary" aria-label="Enrollment summary">
      <h3>Your enrollment</h3>
      <div className="ss-summary__row"><span>Course</span><span>{course.name}</span></div>
      <div className="ss-summary__row"><span>Level</span><span>{course.level}</span></div>
      <div className="ss-summary__row"><span>Format</span><span>{course.format}</span></div>
      <div className="ss-summary__total">
        <span style={{ fontSize: 14, color: 'var(--ss-muted)' }}>Due today</span>
        <strong>${course.price}</strong>
      </div>
      <p className="ss-summary__note">
        One-time payment — no subscription, no recurring charges. Price
        confirmed server-side at checkout.
      </p>
      <div className="ss-secure">
        <ShieldCheck size={15} /> <span>Secure checkout via Stripe · <strong>Test mode</strong> — no real charge</span>
      </div>
    </div>
  );

  return (
    <div className="ss-enroll">
      {/* top bar */}
      <div style={{ position: 'fixed', inset: '0 0 auto 0', zIndex: 50, padding: '14px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/apps/skillspring" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ss-ink)', fontWeight: 800, fontSize: 18 }}>
            <span className="ss-brand__mark" style={{ width: 34, height: 34 }}><GraduationCap size={17} strokeWidth={2.4} /></span>
            SkillSpring
          </Link>
          <span className="ss-testmode" style={{ color: '#92600a', borderColor: 'rgba(146,96,10,.35)', background: 'rgba(254,243,199,.6)' }}>Test mode</span>
        </div>
      </div>

      <div className="ss-enroll__head">
        <Link href="/apps/skillspring" className="ss-backlink">
          <ArrowLeft size={16} /> Back to SkillSpring
        </Link>
        <h1 className="ss-display">Enroll in a course</h1>
        <p>
          Three quick steps. <span className="ss-demo">Sample courses</span> —
          enrollment is a Stripe test transaction only; no real course access is granted.
        </p>
      </div>

      <div className="ss-stepsbar" aria-label={`Step ${step + 1} of 3: ${STEPS[step]}`}>
        {STEPS.map((s, i) => (
          <div key={s} className="ss-stepsbar__seg" aria-hidden={i !== step}>
            <i style={{ width: i < step ? '100%' : i === step ? '55%' : '0%' }} />
          </div>
        ))}
        <span className="ss-stepsbar__label">Step {step + 1} of 3 — {STEPS[step]}</span>
      </div>

      <div className="ss-enroll__grid">
        <div className="ss-glass ss-panel">
          {error && (
            <div className="ss-error" role="alert" aria-live="assertive">
              <AlertCircle size={17} style={{ flex: 'none', marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {step === 0 && (
            <>
              <h2>Choose your course</h2>
              <p>One-time purchase · lifetime access · prices confirmed at checkout.</p>
              {COURSES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`ss-opt${courseId === c.id ? ' is-active' : ''}`}
                  onClick={() => setCourseId(c.id)}
                  aria-pressed={courseId === c.id}
                >
                  <span className="ss-opt__radio" aria-hidden="true" />
                  <span className="ss-opt__body">
                    <strong>{c.name}</strong>
                    <span>{c.level} · {c.modules} modules · {c.duration} · {c.cat}</span>
                  </span>
                  <span className="ss-opt__price">${c.price}</span>
                </button>
              ))}
              <div className="ss-actions">
                <button type="button" className="ss-btn" style={{ flex: 1 }} onClick={next}>
                  Continue <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Your details</h2>
              <p>We&apos;ll send your enrollment confirmation here.</p>
              <div className="ss-field">
                <label htmlFor="ss-name">Full name *</label>
                <input id="ss-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jordan Ellis" />
              </div>
              <div className="ss-field">
                <label htmlFor="ss-email">Email *</label>
                <input id="ss-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
              </div>
              <div className="ss-actions">
                <button type="button" className="ss-backlink" style={{ padding: '16px 8px' }} onClick={back}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" className="ss-btn" style={{ flex: 1 }} onClick={next}>
                  Review enrollment <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Review & enroll</h2>
              <p>One last look before secure checkout.</p>
              <div className="ss-review">
                <div className="ss-review__block">
                  <h4>Course</h4>
                  <p><strong>{course.name}</strong> — ${course.price} one-time</p>
                  <p style={{ fontSize: 13.5, color: 'var(--ss-muted)', marginTop: 4 }}>
                    {course.level} · {course.format} · {course.duration} · lifetime access
                  </p>
                </div>
                <div className="ss-review__block">
                  <h4>Student</h4>
                  <p>{name} · {email}</p>
                </div>
                <div className="ss-review__block">
                  <h4>Billing</h4>
                  <p>One-time ${course.price} · no subscription · no recurring charges</p>
                </div>
              </div>
              <div className="ss-actions">
                <button type="button" className="ss-backlink" style={{ padding: '16px 8px' }} onClick={back}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" className="ss-btn" style={{ flex: 1 }} onClick={handleEnroll} disabled={loading}>
                  {loading ? (
                    <><span className="ss-spinner" /> Processing…</>
                  ) : (
                    <><Lock size={16} /> {`Enroll — $${course.price}`}</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        {summary}
      </div>
    </div>
  );
}

export default function EnrollPage() {
  return (
    <Suspense fallback={<div className="ss-enroll"><div className="ss-enroll__head"><h1 className="ss-display">Enroll</h1></div></div>}>
      <EnrollFlow />
    </Suspense>
  );
}
