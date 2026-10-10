'use client';

/**
 * TableMint Reveal — scroll-triggered entrance (proven pattern).
 * - `immediate`: animate on mount (above-the-fold content)
 * - 1800ms safety fallback: content is never stuck invisible
 * - Hidden state only applies when JS runs (tm-js on <html>)
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
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (immediate) {
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => el.classList.add('is-visible'))
      );
      return () => cancelAnimationFrame(raf);
    }
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
      className={`tm-reveal ${className}`}
      style={{ ['--tm-delay' as never]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
