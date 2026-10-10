/**
 * SwiftNest — flagship layout.
 * Scopes the SwiftNest design system (fonts + swiftnest.css) to /apps/swiftnest/*
 * without affecting the rest of the dashboard.
 */
import './swiftnest.css';
import { Sora, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import JsGuard from './components/JsGuard';

const display = Sora({
  subsets: ['latin'],
  variable: '--sn-display',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--sn-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function SwiftNestLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`sn-scope ${display.variable} ${sans.variable}`}>
      <JsGuard />
      {children}
    </div>
  );
}
