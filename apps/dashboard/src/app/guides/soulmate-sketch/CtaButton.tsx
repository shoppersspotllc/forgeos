'use client';

/**
 * Source-aware CTA button for affiliate links.
 * Reads utm_source from the URL and maps it to a source-specific
 * ClickBank TID for attribution. Defaults to soulmate_article.
 */

import { useEffect, useState } from 'react';

const TID_MAP: Record<string, string> = {
  pinterest: 'soulmate_pinterest',
  medium: 'soulmate_medium',
  devto: 'soulmate_devto',
};

export default function CtaButton({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [tid, setTid] = useState('soulmate_article');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const src = (params.get('utm_source') || '').toLowerCase();
    setTid(TID_MAP[src] || 'soulmate_article');
  }, []);

  return (
    <a href={`/api/affiliate/go?tid=${tid}`} style={style}>
      {children}
    </a>
  );
}
