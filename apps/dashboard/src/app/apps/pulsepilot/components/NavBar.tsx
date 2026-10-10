'use client';

/** Sticky glass nav — transparent over the hero, frosted after scrolling. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight } from 'lucide-react';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`pp-nav${scrolled ? ' pp-nav--scrolled' : ''}`} aria-label="PulsePilot">
      <div className="pp-nav__inner">
        <Link href="/apps/pulsepilot" className="pp-brand" aria-label="PulsePilot home">
          <span className="pp-brand__mark">
            <Activity size={19} strokeWidth={2.6} />
          </span>
          PulsePilot
        </Link>
        <div className="pp-nav__links">
          <a href="#plans">Plans</a>
          <a href="#training">Training</a>
          <a href="#coaching">Coaching</a>
          <Link href="/apps/pulsepilot/subscribe" className="pp-btn pp-btn--sm pp-nav__cta">
            Join now <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
