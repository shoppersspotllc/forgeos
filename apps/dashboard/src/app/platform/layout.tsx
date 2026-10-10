import Link from 'next/link';
import type { ReactNode } from 'react';

const NAV = [
  { href: '/platform', label: 'Overview' },
  { href: '/platform/leads', label: 'Lead Rescue' },
  { href: '/platform/approvals', label: 'Approvals' },
  { href: '/platform/briefing', label: 'Daily Briefing' },
  { href: '/platform/activity', label: 'Activity' },
];

export const metadata = {
  title: 'Young Money Platform — TEST',
  description: 'AI business growth platform scaffold. TEST/demo data only.',
};

/** Workspace shell for the Young Money AI Business Growth Platform (scaffold). */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  // B2 fix (CSS only): clip any horizontal overflow from decorative content and
  // let the header/nav wrap on narrow viewports instead of overflowing 390px.
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', overflowX: 'clip' }}>
      <div
        style={{
          background: 'rgba(245,158,11,0.12)',
          borderBottom: '1px solid rgba(245,158,11,0.35)',
          color: '#fbbf24',
          fontSize: 13,
          padding: '8px 20px',
          textAlign: 'center',
        }}
      >
        TEST ENVIRONMENT — demo data only. No real customers, no real messages sent. Sends are simulated.
      </div>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 28px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Young Money Growth Platform</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            AI business operations for home-service shops · scaffold v0.1
          </div>
        </div>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: '100%' }}>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--text-secondary)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 20px 60px' }}>{children}</main>
    </div>
  );
}
