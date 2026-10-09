/**
 * Soulmate Sketch review article — Experiment #1
 *
 * Honest, value-first content. No guaranteed claims. Clear affiliate disclosure.
 * CTA links route through /api/affiliate/go for click tracking.
 */

import Link from 'next/link';
import { isAffiliateLive } from '@/lib/affiliate/config';
import CtaButton from './CtaButton';

export const metadata = {
  title: 'Soulmate Sketch Review: What It Is & Is It Worth It? (2026)',
  description:
    'An honest review of the Soulmate Sketch psychic drawing service — what you get, what it costs, and who it is really for.',
  openGraph: {
    title: 'Soulmate Sketch Review: What It Is & Is It Worth It? (2026)',
    description:
      'An honest review of the Soulmate Sketch psychic drawing service — what you get, what it costs, and who it is really for.',
    url: 'https://guides.shoppersspotllc.com/guides/soulmate-sketch',
    siteName: 'Young Money Guides',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soulmate Sketch Review: What It Is & Is It Worth It? (2026)',
    description:
      'An honest review of the Soulmate Sketch psychic drawing service — what you get, what it costs, and who it is really for.',
  },
};

const ctaStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#10b981',
  color: '#fff',
  padding: '14px 32px',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 17,
  margin: '16px 0',
};

const h2Style: React.CSSProperties = { fontSize: 24, marginTop: 36 };
const pStyle: React.CSSProperties = { color: '#333', margin: '12px 0' };

export default function SoulmateSketchReview() {
  const live = isAffiliateLive();

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 720, margin: '0 auto', padding: '48px 24px', color: '#1a1a1a', lineHeight: 1.75 }}>
      <Link href="/guides" style={{ fontSize: 14, color: '#10b981', textDecoration: 'none' }}>← All Guides</Link>

      <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#10b981', fontWeight: 700, margin: '24px 0 0' }}>
        Relationships · Honest Review
      </p>
      <h1 style={{ fontSize: 34, margin: '8px 0 16px', fontWeight: 800, lineHeight: 1.25 }}>
        Soulmate Sketch Review: What It Is, How It Works &amp; Is It Worth It?
      </h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>
        Last updated: October 2026 · Research-based review · 6 min read
      </p>

      <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 8, padding: 16, marginBottom: 28, fontSize: 14 }}>
        <strong>Affiliate Disclosure:</strong> This article contains affiliate links.
        If you purchase through them, we may earn a commission at no extra cost to you.
        Our review is independent — here's exactly what we found.
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #10b981', borderRadius: 8, padding: 20, marginBottom: 28, textAlign: 'center' }}>
        <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Want the short version? Here&apos;s where to get it:</p>
        <CtaButton style={ctaStyle}>
          Check Soulmate Sketch on the Official Site →
        </CtaButton>
      </div>

      <h2 style={h2Style}>What Is Soulmate Sketch?</h2>
      <p style={pStyle}>
        Soulmate Sketch is a service where a self-described psychic artist creates a hand-drawn
        sketch of your supposed soulmate, based on a few details you provide (your name, birth
        date, and preferences). You receive a digital drawing along with a written description
        of this person&apos;s characteristics.
      </p>
      <p style={pStyle}>
        The concept sits at the intersection of entertainment, romance curiosity, and spiritual
        services. It&apos;s marketed primarily to people who are single and curious about love —
        not as a scientific service, but as a fun, thought-provoking experience.
      </p>

      <h2 style={h2Style}>How Does It Work?</h2>
      <ol style={pStyle}>
        <li><strong>You answer a few questions</strong> — name, date of birth, and what you&apos;re looking for in a partner.</li>
        <li><strong>The artist creates your sketch</strong> — delivered digitally; check the official site for current delivery times.</li>
        <li><strong>You receive the drawing + description</strong> — a portrait and a write-up of your soulmate&apos;s traits.</li>
      </ol>

      <h2 style={h2Style}>What Does It Cost?</h2>
      <p style={pStyle}>
        Pricing is typically a one-time payment under $50 for the basic sketch package.
        (Prices change — check the official page for current pricing.)
      </p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <CtaButton style={ctaStyle}>
          Check Current Price on the Official Site →
        </CtaButton>
        {!live && (
          <p style={{ fontSize: 12, color: '#999' }}>(Affiliate link — commission pending setup)</p>
        )}
      </div>

      <h2 style={h2Style}>Who Is It For?</h2>
      <p style={pStyle}><strong>You might enjoy it if:</strong></p>
      <ul style={pStyle}>
        <li>You&apos;re curious and open-minded about spiritual/entertainment services</li>
        <li>You want a fun, unique gift idea for a single friend</li>
        <li>You see it as entertainment, not a life decision tool</li>
      </ul>
      <p style={pStyle}><strong>Skip it if:</strong></p>
      <ul style={pStyle}>
        <li>You expect scientifically validated matchmaking (this isn&apos;t that)</li>
        <li>You&apos;re going through a vulnerable time and might make big decisions based on it</li>
        <li>You dislike anything in the psychic/spiritual space</li>
      </ul>

      <h2 style={h2Style}>Quick Pros &amp; Cons</h2>
      <div className="pros-cons-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
        <style>{`@media (max-width: 600px) { .pros-cons-grid { grid-template-columns: 1fr !important; } }`}</style>
        <div style={{ background: '#f0fdf4', border: '1px solid #10b981', borderRadius: 8, padding: 16 }}>
          <p style={{ fontWeight: 700, color: '#10b981', margin: '0 0 8px' }}>✓ Pros</p>
          <ul style={{ ...pStyle, margin: 0, paddingLeft: 20 }}>
            <li>Affordable one-time price (under $50)</li>
            <li>Fast digital delivery (times vary — check official site)</li>
            <li>Unique, personalized artwork</li>
            <li>Fun gift idea for singles</li>
            <li>No subscription or hidden fees</li>
          </ul>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 8, padding: 16 }}>
          <p style={{ fontWeight: 700, color: '#ef4444', margin: '0 0 8px' }}>✗ Cons</p>
          <ul style={{ ...pStyle, margin: 0, paddingLeft: 20 }}>
            <li>No scientific basis for accuracy</li>
            <li>Digital only (no physical print)</li>
            <li>Results are subjective by nature</li>
            <li>Not for skeptics of psychic services</li>
            <li>Refund terms vary — check before buying</li>
          </ul>
        </div>
      </div>

      <h2 style={h2Style}>The Honest Take</h2>
      <p style={pStyle}>
        Let&apos;s be straight: there&apos;s no scientific evidence that a psychic can draw your
        future partner. What you&apos;re buying is an experience — a conversation starter, a bit
        of fun, and for some people, a genuinely moving piece of art that makes them think
        about what they want in a relationship.
      </p>
      <p style={pStyle}>
        If you go in with that mindset, many buyers report enjoying it. If you&apos;re looking
        for a guaranteed path to love, no sketch will give you that — and anyone who claims
        otherwise isn&apos;t being honest with you.
      </p>

      <h2 style={h2Style}>Frequently Asked Questions</h2>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: '16px 0 4px' }}>Is Soulmate Sketch a scam?</p>
        <p style={pStyle}>
          No — you receive a real product (a digital sketch and written reading) for your payment.
          However, there is no scientific evidence behind the psychic claims. Treat it as
          entertainment, not a guaranteed prediction.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: '16px 0 4px' }}>How long does delivery take?</p>
        <p style={pStyle}>
          Delivery is digital (via email/download). The vendor advertises quick turnaround,
          but exact timing can vary — check the official site for current delivery estimates
          before ordering.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: '16px 0 4px' }}>What do I need to provide?</p>
        <p style={pStyle}>
          Your name, date of birth, and answers to a short questionnaire about your
          preferences. No photo is required.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: '16px 0 4px' }}>Is there a refund policy?</p>
        <p style={pStyle}>
          Refund terms are set by the vendor and may change. Always read the refund policy
          on the official checkout page before purchasing any digital product.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: '16px 0 4px' }}>Is this right for skeptics?</p>
        <p style={pStyle}>
          Probably not. If you don&apos;t enjoy psychic or spiritual entertainment, you won&apos;t
          get value from this. It&apos;s designed for the curious and open-minded.
        </p>
      </div>

      <h2 style={h2Style}>Bottom Line</h2>
      <p style={pStyle}>
        Soulmate Sketch is a novelty entertainment service with a romantic twist. It&apos;s
        affordable, fast, and fun for the right person. Just keep your expectations grounded:
        it&apos;s a sketch, not a prophecy.
      </p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <CtaButton style={ctaStyle}>
          Visit the Official Soulmate Sketch Site →
        </CtaButton>
      </div>

      <div style={{ background: '#f0fdf4', border: '1px solid #10b981', borderRadius: 8, padding: 16, marginTop: 32, fontSize: 14 }}>
        <strong>Affiliate Disclosure (reminder):</strong> The buttons above are affiliate links.
        We may earn a commission if you purchase — at no extra cost to you. Thanks for
        supporting our independent guides.
      </div>

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e5e5', fontSize: 13, color: '#888' }}>
        <p>© 2026 Young Money Guides · Shopper&apos;s Spot LLC</p>
        <p><Link href="/guides" style={{ color: '#10b981' }}>← Back to all guides</Link></p>
      </footer>
    </div>
  );
}
