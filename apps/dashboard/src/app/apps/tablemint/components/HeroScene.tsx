'use client';

/**
 * TableMint HeroScene — cinematic depth layer in brand hues.
 * Drifting mint orbs + floating golden motes, with mouse parallax.
 * DPR capped at 1.5, pauses offscreen, static frame for reduced-motion.
 */
import { useEffect, useRef } from 'react';

type Orb = {
  x: number; y: number; r: number;
  hue: number; sat: number; light: number; alpha: number;
  vx: number; vy: number; depth: number; phase: number;
};
type Mote = {
  x: number; y: number; r: number; vy: number; vx: number;
  alpha: number; depth: number; tw: number; hue: number;
};

export default function HeroScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0;
    let running = true;
    let mx = 0.5, my = 0.5;
    let tmx = 0.5, tmy = 0.5;

    const ORB_COLORS: Array<[number, number, number]> = [
      [160, 70, 45],   // mint
      [145, 60, 55],   // fresh green
      [42, 80, 62],    // warm gold accent
      [175, 65, 50],   // deep mint
    ];

    let orbs: Orb[] = [];
    let motes: Mote[] = [];

    const seed = () => {
      const n = Math.min(6, Math.max(3, Math.floor(w / 360)));
      orbs = Array.from({ length: n }, (_, i) => {
        const c = ORB_COLORS[i % ORB_COLORS.length];
        return {
          x: Math.random() * w, y: Math.random() * h,
          r: (0.15 + Math.random() * 0.2) * Math.max(w, h) * 0.5,
          hue: c[0], sat: c[1], light: c[2],
          alpha: 0.14 + Math.random() * 0.12,
          vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.16,
          depth: 0.35 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
        };
      });
      const mn = Math.min(40, Math.max(16, Math.floor(w / 38)));
      motes = Array.from({ length: mn }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.8 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.14, vy: -0.06 - Math.random() * 0.22,
        alpha: 0.1 + Math.random() * 0.26,
        depth: 0.3 + Math.random() * 0.7,
        tw: Math.random() * Math.PI * 2,
        hue: 40 + Math.random() * 130,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      tmx += (mx - tmx) * 0.045;
      tmy += (my - tmy) * 0.045;
      const px = (tmx - 0.5) * 2, py = (tmy - 0.5) * 2;

      for (const o of orbs) {
        o.x += o.vx * o.depth; o.y += o.vy * o.depth;
        if (o.x < -o.r) o.x = w + o.r; if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r; if (o.y > h + o.r) o.y = -o.r;
        const breathe = 0.92 + 0.08 * Math.sin(t / 2600 + o.phase);
        const ox = o.x + px * 46 * o.depth;
        const oy = o.y + py * 34 * o.depth;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r * breathe);
        g.addColorStop(0, `hsla(${o.hue}, ${o.sat}%, ${o.light}%, ${o.alpha})`);
        g.addColorStop(0.55, `hsla(${o.hue}, ${o.sat}%, ${o.light}%, ${o.alpha * 0.45})`);
        g.addColorStop(1, `hsla(${o.hue}, ${o.sat}%, ${o.light}%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, o.r * breathe, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const m of motes) {
        m.x += m.vx * m.depth; m.y += m.vy * m.depth;
        if (m.y < -6) { m.y = h + 6; m.x = Math.random() * w; }
        if (m.x < -6) m.x = w + 6; if (m.x > w + 6) m.x = -6;
        const tw = 0.55 + 0.45 * Math.sin(t / 900 + m.tw);
        ctx.fillStyle = `hsla(${m.hue}, 70%, 72%, ${(m.alpha * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x + px * 22 * m.depth, m.y + py * 16 * m.depth, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = (e.clientX - rect.left) / Math.max(rect.width, 1);
      my = (e.clientY - rect.top) / Math.max(rect.height, 1);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries[0]?.isIntersecting ?? true;
        if (vis && !running && !reduced) {
          running = true;
          raf = requestAnimationFrame(loop);
        } else if (!vis && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.02 }
    );

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    io.observe(canvas);

    if (reduced) {
      draw(1200);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="tm-hero__canvas" aria-hidden="true" />;
}
