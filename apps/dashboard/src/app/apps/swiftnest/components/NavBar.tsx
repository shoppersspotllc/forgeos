'use client';

/** Sticky glass nav — transparent over the hero, frosted after scrolling. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`sn-nav${scrolled ? ' sn-nav--scrolled' : ''}`} aria-label="SwiftNest">
      <div className="sn-nav__inner">
        <Link href="/apps/swiftnest" className="sn-brand" aria-label="SwiftNest home">
          <span className="sn-brand__mark">
            <Package size={19} strokeWidth={2.4} />
          </span>
          SwiftNest
        </Link>
        <div className="sn-nav__links">
          <a href="#pricing">Pricing</a>
          <a href="#tracking">How it works</a>
          <a href="#zones">Zones</a>
          <Link href="/apps/swiftnest/book" className="sn-btn sn-btn--sm sn-nav__cta">
            Book a courier <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
