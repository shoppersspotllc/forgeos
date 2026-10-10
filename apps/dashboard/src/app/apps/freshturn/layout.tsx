/**
 * FreshTurn — flagship layout.
 * Scopes the FreshTurn design system (fonts + freshturn.css) to /apps/freshturn/*
 * without affecting the rest of the dashboard.
 */
import './freshturn.css';
import { Fraunces, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import JsGuard from './components/JsGuard';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--ft-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--ft-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function FreshTurnLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`ft-scope ${display.variable} ${sans.variable}`}>
      <JsGuard />
      {children}
    </div>
  );
}
