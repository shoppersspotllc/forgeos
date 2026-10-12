'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { useTheme } from './ThemeProvider';

// ---------- GlassPanel: 3D depth card with layered glass ----------
export function GlassPanel({
  children, className = '', hover = true, glow, padding = 'p-6',
}: {
  children: ReactNode; className?: string; hover?: boolean; glow?: string; padding?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 ${hover ? 'hover:-translate-y-1 hover:scale-[1.01]' : ''} ${padding} ${className}`}
      style={{
        background: 'linear-gradient(135deg, var(--surface), color-mix(in srgb, var(--surface) 60%, transparent))',
        border: '1px solid var(--border)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)${glow ? `, 0 0 32px ${glow}22` : ''}`,
      }}
    >
      {/* Top highlight for 3D depth */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }} />
      {children}
    </div>
  );
}

// ---------- GlowButton ----------
export function GlowButton({
  children, onClick, variant = 'primary', className = '',
}: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; className?: string;
}) {
  if (variant === 'ghost') {
    return (
      <button onClick={onClick}
        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
        {children}
      </button>
    );
  }
  return (
    <button onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 ${className}`}
      style={{
        background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
        boxShadow: '0 8px 24px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}>
      {children}
    </button>
  );
}

// ---------- Animated counter ----------
export function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setDisplay(Math.round(value * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

// ---------- StatCard with animated number ----------
export function StatCard({ label, value, suffix, icon, gradient, trend }: {
  label: string; value: number; suffix?: string; icon: ReactNode; gradient: string; trend?: string;
}) {
  return (
    <GlassPanel className="group">
      <div className="flex items-start justify-between mb-4">
        <div className="h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
             style={{ background: gradient, boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
          {icon}
        </div>
        {trend && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
        <AnimatedNumber value={value} />{suffix && <span className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>{suffix}</span>}
      </p>
      <p className="text-xs mt-1 uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </GlassPanel>
  );
}

// ---------- SectionHeader: eyebrow + title + description ----------
export function SectionHeader({ eyebrow, title, description, accent }: {
  eyebrow: string; title: string; description?: string; accent?: string;
}) {
  return (
    <div className="mb-8 animate-[fadeUp_0.6s_cubic-bezier(0.22,1,0.36,1)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-2"
         style={{ color: accent || 'var(--accent)' }}>{eyebrow}</p>
      <h1 className="font-extrabold tracking-tight" style={{
        color: 'var(--text)',
        fontSize: 'clamp(1.875rem, 4vw, 3rem)',
        lineHeight: 1.1, letterSpacing: '-0.025em',
      }}>{title}</h1>
      {description && (
        <p className="mt-2 text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      )}
    </div>
  );
}

// ---------- BotAvatar: identity avatar with gradient + emoji ----------
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#8b5cf6,#22d3ee)', 'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#06b6d4)', 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#f43f5e,#fb923c)', 'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#eab308,#22c55e)', 'linear-gradient(135deg,#a855f7,#ec4899)',
];

export function BotAvatar({ name, emoji, size = 48, status = 'online' }: {
  name: string; emoji: string; size?: number; status?: 'online' | 'busy' | 'offline' | 'unknown';
}) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradient = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
  const statusColor = status === 'online' ? 'var(--success)' : status === 'busy' ? 'var(--warning)' : 'var(--text-muted)';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3"
           style={{
             background: gradient,
             fontSize: size * 0.45,
             boxShadow: `0 ${size / 6}px ${size / 2.5}px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)`,
           }}>
        {emoji}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 animate-pulse"
            style={{
              width: size * 0.28, height: size * 0.28,
              background: statusColor, borderColor: 'var(--bg)',
              boxShadow: `0 0 8px ${statusColor}`,
            }} />
    </div>
  );
}

// ---------- StatusPill ----------
export function StatusPill({ status }: { status: 'online' | 'available' | 'offline' | 'setup' | 'busy' | 'unknown' }) {
  const map = {
    online: { bg: 'var(--success)', label: 'Online' },
    available: { bg: 'var(--success)', label: 'Available' },
    offline: { bg: 'var(--text-muted)', label: 'Offline' },
    setup: { bg: 'var(--warning)', label: 'Setup required' },
    busy: { bg: 'var(--warning)', label: 'Busy' },
    unknown: { bg: 'var(--text-muted)', label: 'Unknown' },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'color-mix(in srgb, var(--surface) 80%, transparent)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: s.bg, boxShadow: `0 0 6px ${s.bg}` }} />
      {s.label}
    </span>
  );
}

// ---------- CinematicBackground: per-platform atmosphere ----------
export function CinematicBackground({ identityId }: { identityId: string }) {
  const { theme } = useTheme();
  // Dynamic import to avoid circular deps
  const [identity, setIdentity] = useState<any>(null);
  useEffect(() => {
    import('@/lib/design-system').then(m => setIdentity(m.PLATFORM_IDENTITIES[identityId] || m.PLATFORM_IDENTITIES.dashboard));
  }, [identityId]);

  if (!identity) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Platform gradient wash */}
      <div className="absolute inset-0 opacity-100 transition-opacity duration-1000"
           style={{ background: `radial-gradient(1200px 600px at 20% -10%, ${identity.gradient[0]}18, transparent 60%), radial-gradient(1000px 500px at 90% 10%, ${identity.gradient[2]}12, transparent 60%)` }} />
      {/* Animated mesh orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[100px] animate-[float_12s_ease-in-out_infinite]"
           style={{ background: identity.gradient[0], opacity: 0.12 }} />
      <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full blur-[120px] animate-[float_16s_ease-in-out_infinite_reverse]"
           style={{ background: identity.gradient[1], opacity: 0.1 }} />
      <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full blur-[100px] animate-[float_14s_ease-in-out_infinite]"
           style={{ background: identity.gradient[2], opacity: 0.08 }} />
    </div>
  );
}

// ---------- FadeUp wrapper for staggered entrance ----------
export function FadeUp({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`animate-[fadeUp_0.7s_cubic-bezier(0.22,1,0.36,1)_both] ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
