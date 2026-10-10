/**
 * PulsePilot — flagship layout.
 * Scopes the PulsePilot design system (fonts + pulsepilot.css) to /apps/pulsepilot/*
 * without affecting the rest of the dashboard.
 */
import './pulsepilot.css';
import { Archivo, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import JsGuard from './components/JsGuard';

const display = Archivo({
  subsets: ['latin'],
  variable: '--pp-display',
  display: 'swap',
  weight: ['600', '700', '800', '900'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--pp-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function PulsePilotLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`pp-scope ${display.variable} ${sans.variable}`}>
      <JsGuard />
      {children}
    </div>
  );
}
