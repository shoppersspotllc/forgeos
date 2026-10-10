/**
 * TableMint — flagship layout.
 * Scopes the TableMint design system (fonts + tablemint.css) to /apps/tablemint/*
 * without affecting the rest of the dashboard.
 */
import './tablemint.css';
import { Playfair_Display, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import JsGuard from './components/JsGuard';

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--tm-display',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--tm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function TableMintLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`tm-scope ${display.variable} ${sans.variable}`}>
      <JsGuard />
      {children}
    </div>
  );
}
