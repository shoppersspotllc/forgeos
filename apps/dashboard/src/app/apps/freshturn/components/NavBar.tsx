'use client';

/** Sticky glass nav — transparent over the hero, frosted after scrolling. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`ft-nav${scrolled ? ' ft-nav--scrolled' : ''}`} aria-label="FreshTurn">
      <div className="ft-nav__inner">
        <Link href="/apps/freshturn" className="ft-brand" aria-label="FreshTurn home">
          <span className="ft-brand__mark">
            <Sparkles size={19} strokeWidth={2.4} />
          </span>
          FreshTurn
        </Link>
        <div className="ft-nav__links">
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#how">How it works</a>
          <Link href="/apps/freshturn/book" className="ft-btn ft-btn--sm ft-nav__cta">
            Book now <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
