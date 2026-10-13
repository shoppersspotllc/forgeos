'use client';

import { DOT_DEFS, type DotStatus } from '@/lib/mydots/dots';

interface Props {
  dotName: string;
  status?: DotStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-2xl',
  lg: 'w-16 h-16 text-3xl',
};

const STATUS_RING: Record<DotStatus, string> = {
  idle: 'ring-2 ring-white/10',
  thinking: 'ring-2 ring-amber-400/70 animate-pulse',
  working: 'ring-2 ring-emerald-400/70 animate-pulse',
  error: 'ring-2 ring-red-500/70',
  streaming: 'ring-2 ring-sky-400/80 animate-pulse',
};

const STATUS_DOT: Record<DotStatus, string> = {
  idle: 'bg-white/30',
  thinking: 'bg-amber-400 animate-ping',
  working: 'bg-emerald-400 animate-ping',
  error: 'bg-red-500',
  streaming: 'bg-sky-400 animate-ping',
};

export default function DotAvatar({ dotName, status = 'idle', size = 'md', showLabel = false }: Props) {
  const def = DOT_DEFS[dotName];
  if (!def) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${SIZE_MAP[size]} rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/15 to-white/5 backdrop-blur ${STATUS_RING[status]} transition-all duration-300`}
          title={`${def.name} — ${def.role}`}
        >
          <span className={status === 'thinking' || status === 'working' || status === 'streaming' ? 'animate-bounce' : ''}>
            {def.avatar}
          </span>
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${STATUS_DOT[status]}`} />
      </div>
      {showLabel && (
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{def.name}</div>
          <div className="text-xs text-white/50 truncate">{def.role}</div>
        </div>
      )}
    </div>
  );
}
