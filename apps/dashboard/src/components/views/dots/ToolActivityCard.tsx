'use client';

import { useState } from 'react';
import type { ToolCall } from './types';

const STATUS_STYLE: Record<ToolCall['status'], { icon: string; color: string; label: string }> = {
  running: { icon: '⏳', color: 'text-amber-300 border-amber-400/30 bg-amber-400/5', label: 'Running' },
  success: { icon: '✓', color: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/5', label: 'Completed' },
  error: { icon: '✕', color: 'text-red-300 border-red-400/30 bg-red-400/5', label: 'Failed' },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + '…';
}

export default function ToolActivityCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_STYLE[tool.status];

  return (
    <div className={`rounded-xl border ${st.color} overflow-hidden my-2`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-sm">{st.icon}</span>
        <span className="font-mono text-xs font-semibold flex-1 truncate">{tool.name}</span>
        <span className="text-[10px] opacity-60">{st.label}</span>
        <span className="text-[10px] opacity-60 font-mono">{formatDuration(tool.durationMs)}</span>
        <span className={`text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 text-xs">
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1">Input</div>
            <pre className="bg-black/40 rounded-lg p-2 font-mono text-white/70 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
              {truncate(tool.input, 2000)}
            </pre>
          </div>
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1">Output</div>
            <pre className="bg-black/40 rounded-lg p-2 font-mono text-white/70 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
              {tool.output ? truncate(tool.output, 4000) : '(no output)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
