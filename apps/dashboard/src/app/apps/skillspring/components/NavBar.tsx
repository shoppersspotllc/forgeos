'use client';

/** Sticky glass nav — transparent over the hero, frosted after scrolling. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`ss-nav${scrolled ? ' ss-nav--scrolled' : ''}`} aria-label="SkillSpring">
      <div className="ss-nav__inner">
        <Link href="/apps/skillspring" className="ss-brand" aria-label="SkillSpring home">
          <span className="ss-brand__mark">
            <GraduationCap size={19} strokeWidth={2.4} />
          </span>
          SkillSpring
        </Link>
        <div className="ss-nav__links">
          <a href="#courses">Courses</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
          <Link href="/apps/skillspring/enroll" className="ss-btn ss-btn--sm ss-nav__cta">
            Enroll <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
