'use client';

/**
 * FreshTurn Tilt — pointer-driven 3D tilt for cards.
 * Subtle (±7deg), eased, disabled for touch / reduced-motion.
 */
import { useRef, type ReactNode, type PointerEvent } from 'react';

export default function Tilt({
  children,
  className = '',
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  };

  return (
    <div className={`ft-tilt ${className}`}>
      <div
        ref={ref}
        className="ft-tilt__inner"
        onPointerMove={onMove}
        onMouseLeave={onLeave}
      >
        {children}
      </div>
    </div>
  );
}
