/**
 * TurnoverPro — Move-out cleaning & rental turnover
 * Young Money Five-App Revenue Initiative — App #1
 *
 * Independent app with its own identity, booking flow, and Stripe integration.
 * Route: /apps/turnoverpro
 */

import Link from 'next/link';

export const metadata = {
  title: 'TurnoverPro — Move-Out Cleaning & Rental Turnover',
  description:
    'Professional move-out cleaning for renters, landlords, and property managers. Book online, upfront pricing, satisfaction guaranteed.',
};

const packages = [
  {
    id: 'studio',
    name: 'Studio / 1-Bed',
    price: 149,
    description: 'Perfect for studios and one-bedroom apartments up to 750 sq ft.',
    features: [
      'Full kitchen deep clean',
      'Bathroom sanitization',
      'All floors vacuumed & mopped',
      'Dusting all surfaces',
      'Trash removal',
    ],
  },
  {
    id: 'standard',
    name: '2-Bed Standard',
    price: 249,
    description: 'Our most popular — thorough turnover for 2-bedroom units up to 1,200 sq ft.',
    features: [
      'Everything in Studio',
      'Inside cabinets & drawers',
      'Baseboards & door frames',
      'Light fixtures & ceiling fans',
      'Patio/balcony sweep',
    ],
    popular: true,
  },
  {
    id: 'deep',
    name: '3-Bed+ Deep Clean',
    price: 399,
    description: 'Maximum detail for larger homes — 1,200+ sq ft, 3+ bedrooms.',
    features: [
      'Everything in Standard',
      'Inside refrigerator',
      'Inside oven',
      'Window interiors',
      'Garage sweep-out',
    ],
  },
];

const addons = [
  { id: 'fridge', name: 'Inside Refrigerator', price: 25 },
  { id: 'oven', name: 'Inside Oven', price: 25 },
  { id: 'windows', name: 'Interior Windows', price: 35 },
  { id: 'laundry', name: 'Laundry Room Detail', price: 20 },
  { id: 'pet', name: 'Pet Hair Treatment', price: 30 },
];

export default function TurnoverProHome() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a', lineHeight: 1.6 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#fff', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 3, opacity: 0.9, margin: '0 0 16px' }}>
          Young Money · TurnoverPro
        </p>
        <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>
          Move-Out Cleaning,<br />Done Right.
        </h1>
        <p style={{ fontSize: 19, opacity: 0.92, maxWidth: 560, margin: '0 auto 32px' }}>
          Professional rental turnover cleaning with upfront pricing.
          Book in 2 minutes. Get your deposit back.
        </p>
        <Link
          href="/apps/turnoverpro/book"
          style={{ display: 'inline-block', background: '#fff', color: '#0f766e', padding: '16px 40px', borderRadius: 10, fontWeight: 700, fontSize: 18, textDecoration: 'none' }}
        >
          Book Your Cleaning →
        </Link>
        <p style={{ fontSize: 14, opacity: 0.8, marginTop: 16 }}>
          Starting at $149 · No hidden fees · Satisfaction guaranteed
        </p>
      </div>

      {/* Packages */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
          Simple, Upfront Pricing
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 40 }}>
          Pick your package. Add extras. Book your date. That's it.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                border: pkg.popular ? '2px solid #14b8a6' : '1px solid #e5e5e5',
                borderRadius: 12,
                padding: 28,
                position: 'relative',
                background: '#fff',
              }}
            >
              {pkg.popular && (
                <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#14b8a6', color: '#fff', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  MOST POPULAR
                </span>
              )}
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>{pkg.name}</h3>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#0f766e', margin: '8px 0' }}>
                ${pkg.price}
              </p>
              <p style={{ color: '#666', fontSize: 15, marginBottom: 16 }}>{pkg.description}</p>
              <ul style={{ paddingLeft: 20, margin: '0 0 24px', fontSize: 15 }}>
                {pkg.features.map((f) => (
                  <li key={f} style={{ marginBottom: 6 }}>{f}</li>
                ))}
              </ul>
              <Link
                href={`/apps/turnoverpro/book?package=${pkg.id}`}
                style={{ display: 'block', textAlign: 'center', background: pkg.popular ? '#14b8a6' : '#f0fdfa', color: pkg.popular ? '#fff' : '#0f766e', padding: '12px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', border: pkg.popular ? 'none' : '1px solid #14b8a6' }}
              >
                Select {pkg.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Add-ons */}
        <h3 style={{ fontSize: 24, fontWeight: 700, textAlign: 'center', margin: '48px 0 16px' }}>
          Popular Add-Ons
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {addons.map((a) => (
            <span key={a.id} style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 20, padding: '8px 20px', fontSize: 15 }}>
              {a.name} <strong>+${a.price}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: '#f8fafc', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 40 }}>
            How It Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {[
              { n: '1', t: 'Book Online', d: 'Pick your package, choose add-ons, select your date. Takes 2 minutes.' },
              { n: '2', t: 'We Clean', d: 'Our vetted team arrives with all supplies. You don\'t need to be there.' },
              { n: '3', t: 'Get Your Deposit', d: 'Walk through with your landlord with confidence. 200% satisfaction guarantee.' },
            ].map((s) => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#14b8a6', color: '#fff', fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{s.t}</h3>
                <p style={{ color: '#666' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>
          Ready for a Spotless Move-Out?
        </h2>
        <Link
          href="/apps/turnoverpro/book"
          style={{ display: 'inline-block', background: '#0f766e', color: '#fff', padding: '16px 48px', borderRadius: 10, fontWeight: 700, fontSize: 18, textDecoration: 'none' }}
        >
          Book Now →
        </Link>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e5e5', padding: '32px 24px', textAlign: 'center', color: '#888', fontSize: 14 }}>
        <p>© 2026 TurnoverPro · A Young Money Business · Shopper's Spot LLC</p>
        <p>Questions? Email hello@turnoverpro.co</p>
      </footer>
    </div>
  );
}

export { packages, addons };
