'use client';

import DotAvatar from './DotAvatar';
import type { Thread } from './types';

interface Props {
  threads: Thread[];
  activeThreadId: string | null;
  activeDot: string;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteThread: (id: string) => void;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function previewOf(t: Thread): string {
  const last = [...t.messages].reverse().find((m) => m.role !== 'system');
  if (!last) return 'New conversation';
  const text = last.content.slice(0, 80);
  return (last.role === 'user' ? 'You: ' : '') + text;
}

export default function ThreadSidebar({ threads, activeThreadId, activeDot, onSelectThread, onNewThread, onDeleteThread }: Props) {
  const dotThreads = threads.filter((t) => t.dotName === activeDot).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onNewThread}
        className="m-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-lg">+</span> New chat
      </button>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {dotThreads.length === 0 && (
          <div className="text-center text-white/30 text-sm py-8">
            No conversations yet.<br />Start one above.
          </div>
        )}
        {dotThreads.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelectThread(t.id)}
            className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
              t.id === activeThreadId
                ? 'bg-white/12 border border-white/15'
                : 'hover:bg-white/6 border border-transparent'
            }`}
          >
            <div className="flex items-start gap-2">
              <DotAvatar dotName={t.dotName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{t.title}</div>
                <div className="text-xs text-white/40 truncate mt-0.5">{previewOf(t)}</div>
                <div className="text-[10px] text-white/25 mt-1">{timeAgo(t.updatedAt)} · {t.messages.length} msgs</div>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteThread(t.id); }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 text-sm transition-opacity"
              title="Delete thread"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
