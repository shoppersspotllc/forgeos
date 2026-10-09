/**
 * Guides layout — Young Money Guides
 *
 * Supports Google Search Console verification via GSC_VERIFICATION_CODE
 * environment variable. Set it in Vercel to the content value from
 * Google Search Console (HTML tag method).
 */

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const verificationCode = process.env.GSC_VERIFICATION_CODE;
  return {
    ...(verificationCode
      ? { verification: { google: verificationCode } }
      : {}),
  };
}

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
