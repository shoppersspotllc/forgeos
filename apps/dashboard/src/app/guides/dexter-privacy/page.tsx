/**
 * Privacy Policy — Young Money Guides
 * Required for Pinterest developer app registration.
 */

import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Young Money Guides',
  description: 'Privacy policy for Young Money Guides and the Young Money Publisher Pinterest integration.',
};

export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 720, margin: '0 auto', padding: '48px 24px', color: '#1a1a1a', lineHeight: 1.75 }}>
      <Link href="/guides" style={{ fontSize: 14, color: '#10b981', textDecoration: 'none' }}>← All Guides</Link>
      <h1 style={{ fontSize: 32, margin: '24px 0 8px', fontWeight: 800 }}>Privacy Policy</h1>
      <p style={{ color: '#888', fontSize: 14 }}>Last updated: October 9, 2026</p>

      <p>
        Young Money Guides (&ldquo;we&rdquo;) is operated by Dexter (Shopper&apos;s Spot LLC).
        This policy describes how we handle information in connection with our website
        at guides.shoppersspotllc.com and our Pinterest integration (&ldquo;Young Money Publisher&rdquo;).
      </p>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Information We Collect</h2>
      <p>
        <strong>Website visitors:</strong> We do not require accounts and do not collect
        personal information from casual visitors. We record anonymized click counts on
        affiliate links to measure content performance. No cookies are used for tracking
        individuals.
      </p>
      <p>
        <strong>Pinterest integration:</strong> When you authorize our Pinterest app, we receive
        an OAuth access token that allows us to create pins and read board information on
        your behalf. We store this token securely and use it only to perform the publishing
        actions you request. We do not share your Pinterest data with third parties.
      </p>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>How We Use Information</h2>
      <ul>
        <li>To publish pins you authorize to your Pinterest boards.</li>
        <li>To measure aggregate content performance (click counts, no personal data).</li>
        <li>To comply with legal obligations.</li>
      </ul>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Affiliate Disclosure</h2>
      <p>
        Some links on our site are affiliate links. If you purchase through them, we may
        earn a commission at no extra cost to you. Clicking an affiliate link passes you
        to the merchant&apos;s site, which operates under its own privacy policy.
      </p>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Data Retention &amp; Deletion</h2>
      <p>
        Pinterest access tokens are deleted when you revoke the app&apos;s access in your
        Pinterest settings or when you request deletion. To request deletion of any data
        associated with you, contact us at the address below.
      </p>

      <h2 style={{ fontSize: 22, marginTop: 32 }}>Contact</h2>
      <p>
        Shopper&apos;s Spot LLC<br />
        For privacy questions regarding this site or the Pinterest integration,
        contact us via the ForgeOS dashboard at forgeos.shoppersspotllc.com.
      </p>

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #e5e5e5', fontSize: 13, color: '#888' }}>
        <p>© 2026 Young Money Guides · Shopper&apos;s Spot LLC</p>
      </footer>
    </div>
  );
}
