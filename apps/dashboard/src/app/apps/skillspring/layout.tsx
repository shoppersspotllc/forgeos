/**
 * SkillSpring — flagship layout.
 * Scopes the SkillSpring design system (fonts + skillspring.css) to /apps/skillspring/*
 * without affecting the rest of the dashboard.
 */
import './skillspring.css';
import { Newsreader, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import JsGuard from './components/JsGuard';

const display = Newsreader({
  subsets: ['latin'],
  variable: '--ss-display',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600', '700'],
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--ss-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function SkillSpringLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`ss-scope ${display.variable} ${sans.variable}`}>
      <JsGuard />
      {children}
    </div>
  );
}
