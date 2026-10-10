'use client';

/**
 * FreshTurn Reveal — scroll-triggered entrance.
 * Adds .is-visible when the element enters the viewport.
 * With prefers-reduced-motion the CSS forces the visible state instantly.
 */
import { useEffect, useRef, type ReactNode } from 'react';

export default function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
  /** Above-the-fold content: animate on mount instead of waiting for scroll. */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (immediate) {
      // Mount-triggered entrance (stagger preserved via --ft-delay).
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => el.classList.add('is-visible'))
      );
      return () => cancelAnimationFrame(raf);
    }
    // Safety net: never leave content stuck invisible if IO is delayed.
    const fallback = window.setTimeout(() => el.classList.add('is-visible'), 1800);
    if (!('IntersectionObserver' in window)) return () => window.clearTimeout(fallback);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            window.clearTimeout(fallback);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
    };
  }, [immediate]);

  return (
    <Tag
      ref={ref as never}
      className={`ft-reveal ${className}`}
      style={{ ['--ft-delay' as never]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
