'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const density = theme.atmosphere?.particleDensity ?? 1;
    if (density <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const count = Math.floor(150 * density);
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.01 + Math.random() * 0.03,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(s => {
        s.y += s.speed;
        s.twinkle += s.twinkleSpeed;
        if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
        const alpha = 0.25 + Math.sin(s.twinkle) * 0.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = theme.effects.starColor;
        ctx.globalAlpha = Math.max(0.05, alpha);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [theme]);

  const density = theme.atmosphere?.particleDensity ?? 1;
  if (density <= 0) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-70" />;
}

export function GlowOrbs() {
  const { theme } = useTheme();
  const spread = theme.atmosphere?.glowSpread ?? 1;
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-1000">
      {theme.effects.orbColors.map((color, i) => (
        <div
          key={`${theme.id}-${i}`}
          className="absolute rounded-full animate-[float_14s_ease-in-out_infinite]"
          style={{
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            opacity: 0.14 * theme.effects.glowIntensity,
            width: `${(320 + i * 160) * spread}px`,
            height: `${(320 + i * 160) * spread}px`,
            left: `${12 + i * 28}%`,
            top: `${8 + i * 22}%`,
            filter: `blur(${60 * spread}px)`,
            animationDelay: `${i * 2.5}s`,
            animationDuration: `${12 + i * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

export function Atmosphere() {
  const { theme } = useTheme();
  const atm = theme.atmosphere;
  if (!atm) return null;
  return (
    <>
      {/* Ambient top/bottom lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
           style={{ background: `linear-gradient(180deg, ${atm.ambientTop} 0%, transparent 30%, transparent 70%, ${atm.ambientBottom} 100%)` }} />
      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[1] transition-all duration-1000"
           style={{ background: atm.vignette }} />
    </>
  );
}
