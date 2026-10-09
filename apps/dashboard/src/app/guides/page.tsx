/**
 * Guides index — served at guides.shoppersspotllc.com and /guides
 * Standalone layout (no dashboard chrome) for the public guides site.
 */

import Link from 'next/link';

export const metadata = {
  title: 'Young Money Guides — Honest Reviews & Research',
  description: 'Value-first guides and honest product research from Young Money.',
  openGraph: {
    title: 'Young Money Guides — Honest Reviews & Research',
    description: 'Value-first guides and honest product research from Young Money.',
    url: 'https://guides.shoppersspotllc.com/guides',
    siteName: 'Young Money Guides',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Young Money Guides — Honest Reviews & Research',
    description: 'Value-first guides and honest product research from Young Money.',
  },
};

export default function GuidesIndex() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 720, margin: '0 auto', padding: '48px 24px', color: '#1a1a1a', lineHeight: 1.7 }}>
      <header style={{ borderBottom: '2px solid #10b981', paddingBottom: 24, marginBottom: 32 }}>
        <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: '#10b981', fontWeight: 700, margin: 0 }}>
          Young Money Guides
        </p>
        <h1 style={{ fontSize: 36, margin: '8px 0', fontWeight: 800 }}>Honest Guides, Real Research</h1>
        <p style={{ color: '#555', margin: 0 }}>
          We research products and write up what we find — the good and the bad.
        </p>
      </header>

      <div style={{ background: '#f0fdf4', border: '1px solid #10b981', borderRadius: 8, padding: 16, marginBottom: 32, fontSize: 14 }}>
        <strong>Affiliate Disclosure:</strong> Some links on this site are affiliate links.
        If you buy through them, we may earn a commission at no extra cost to you.
        This helps us keep the guides free. We only write about products we've researched.
      </div>

      <h2 style={{ fontSize: 22 }}>Latest Guides</h2>

      <article style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
          Relationships · Research
        </p>
        <h3 style={{ fontSize: 24, margin: '0 0 12px' }}>
          <Link href="/guides/soulmate-sketch" style={{ color: '#1a1a1a', textDecoration: 'none' }}>
            Soulmate Sketch Review: What It Is, How It Works &amp; Is It Worth It?
          </Link>
        </h3>
        <p style={{ color: '#555', margin: '0 0 16px' }}>
          An honest look at the psychic soulmate drawing service — what you actually get,
          what it costs, and who it's really for. No hype.
        </p>
        <Link
          href="/guides/soulmate-sketch"
          style={{ display: 'inline-block', background: '#10b981', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
        >
          Read the Guide →
        </Link>
      </article>

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e5e5', fontSize: 13, color: '#888' }}>
        <p>© 2026 Young Money Guides · Shopper&apos;s Spot LLC</p>
        <p>
          Affiliate Disclosure: This site contains affiliate links. We may earn a commission
          on qualifying purchases at no extra cost to you.
        </p>
      </footer>
    </div>
  );
}
