'use client';

/**
 * PulsePilot PulseLine — signature animated heartbeat line.
 * A single ECG-style path with a traveling dash, glowing red.
 */
export default function PulseLine() {
  // 1600-wide heartbeat trace: flat, spike, flat, double-beat, flat
  const d =
    'M0 32 H380 L410 32 L430 8 L450 52 L470 32 H700 ' +
    'L730 32 L748 18 L766 44 L784 32 H1000 ' +
    'L1030 32 L1052 6 L1074 54 L1096 32 H1600';
  return (
    <svg
      className="pp-pulse"
      viewBox="0 0 1600 64"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pp-pulse-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f87171" />
          <stop offset="0.6" stopColor="#ef4444" />
          <stop offset="1" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      <path d={d} />
    </svg>
  );
}
