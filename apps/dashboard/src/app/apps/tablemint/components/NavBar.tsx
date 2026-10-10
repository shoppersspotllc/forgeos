'use client';

/** Sticky glass nav — transparent over the hero, frosted after scrolling. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`tm-nav${scrolled ? ' tm-nav--scrolled' : ''}`} aria-label="TableMint">
      <div className="tm-nav__inner">
        <Link href="/apps/tablemint" className="tm-brand" aria-label="TableMint home">
          <span className="tm-brand__mark">
            <UtensilsCrossed size={19} strokeWidth={2.4} />
          </span>
          TableMint
        </Link>
        <div className="tm-nav__links">
          <a href="#menu">Menu</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
          <Link href="/apps/tablemint/order" className="tm-btn tm-btn--sm tm-nav__cta">
            Order now <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
