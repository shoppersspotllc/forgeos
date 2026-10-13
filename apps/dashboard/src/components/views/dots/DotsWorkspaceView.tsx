'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DotAvatar from './DotAvatar';
import ThreadSidebar from './ThreadSidebar';
import ToolActivityCard from './ToolActivityCard';
import { DOTS, type DotStatus } from '@/lib/mydots/dots';
import {
  type Thread, type ChatMessage, type ToolCall,
  loadThreads, saveThreads, migrateV1Threads, STORAGE_KEY,
} from './types';

interface SSEEvent {
  type: 'meta' | 'token' | 'tool' | 'done' | 'error';
  [key: string]: unknown;
}

function newThread(dotName: string): Thread {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    dotName,
    title: 'New conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function titleFrom(text: string): string {
  const t = text.trim().slice(0, 42);
  return t || 'New conversation';
}

export default function DotsWorkspaceView() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeDot, setActiveDot] = useState('Scout');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [dotStatuses, setDotStatuses] = useState<Record<string, DotStatus>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load threads (v2, with v1 migration) on mount
  useEffect(() => {
    let loaded = loadThreads();
    if (loaded.length === 0) {
      const migrated = migrateV1Threads();
      if (migrated.length > 0) {
        loaded = migrated;
        saveThreads(loaded);
        try { localStorage.removeItem('forgeos-dots-threads-v1'); } catch { /* noop */ }
      }
    }
    setThreads(loaded);
    const first = loaded.find((t) => t.dotName === 'Scout') ?? loaded[0];
    if (first) {
      setActiveThreadId(first.id);
      setActiveDot(first.dotName);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (threads.length > 0) saveThreads(threads);
  }, [threads]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, activeThreadId, isStreaming]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  const setStatus = useCallback((dot: string, s: DotStatus) => {
    setDotStatuses((prev) => ({ ...prev, [dot]: s }));
  }, []);

  const ensureThread = useCallback((dotName: string): string => {
    const existing = threads.find((t) => t.id === activeThreadId && t.dotName === dotName);
    if (existing) return existing.id;
    const dotThreads = threads.filter((t) => t.dotName === dotName);
    if (dotThreads.length > 0) {
      const latest = [...dotThreads].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveThreadId(latest.id);
      return latest.id;
    }
    const nt = newThread(dotName);
    setThreads((prev) => [nt, ...prev]);
    setActiveThreadId(nt.id);
    return nt.id;
  }, [threads, activeThreadId]);

  const handleSelectDot = (dotName: string) => {
    if (isStreaming) return;
    setActiveDot(dotName);
    const dotThreads = threads.filter((t) => t.dotName === dotName).sort((a, b) => b.updatedAt - a.updatedAt);
    setActiveThreadId(dotThreads[0]?.id ?? null);
  };

  const handleNewThread = () => {
    if (isStreaming) return;
    const nt = newThread(activeDot);
    setThreads((prev) => [nt, ...prev]);
    setActiveThreadId(nt.id);
  };

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (activeThreadId === id) setActiveThreadId(null);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const threadId = activeThreadId ?? ensureThread(activeDot);
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };

    setThreads((prev) => prev.map((t) => {
      if (t.id !== threadId) return t;
      const msgs = [...t.messages, userMsg];
      return {
        ...t,
        messages: msgs,
        title: t.messages.length === 0 ? titleFrom(text) : t.title,
        updatedAt: Date.now(),
      };
    }));
    setInput('');
    setIsStreaming(true);
    setStatus(activeDot, 'thinking');

    const controller = new AbortController();
    abortRef.current = controller;

    // Placeholder assistant message for streaming
    const asstId = crypto.randomUUID();
    const asstMsg: ChatMessage = { role: 'assistant', content: '', toolCalls: [], timestamp: Date.now() };
    setThreads((prev) => prev.map((t) =>
      t.id === threadId ? { ...t, messages: [...t.messages, { ...asstMsg }] } : t
    ));

    try {
      const thread = threads.find((t) => t.id === threadId);
      const history = [...(thread?.messages ?? []), userMsg]
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/my-dots/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dotName: activeDot, messages: history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let streamed = false;

      const updateAsst = (fn: (m: ChatMessage) => ChatMessage) => {
        setThreads((prev) => prev.map((t) => {
          if (t.id !== threadId) return t;
          return {
            ...t,
            messages: t.messages.map((m) =>
              m.timestamp === asstMsg.timestamp && m.role === 'assistant' ? fn(m) : m
            ),
            updatedAt: Date.now(),
          };
        }));
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(trimmed.slice(5).trim()) as SSEEvent;
            if (evt.type === 'token') {
              if (!streamed) { streamed = true; setStatus(activeDot, 'streaming'); }
              const chunk = String(evt.text ?? '');
              updateAsst((m) => ({ ...m, content: m.content + chunk }));
            } else if (evt.type === 'tool') {
              setStatus(activeDot, 'working');
              const tc: ToolCall = {
                id: String(evt.id ?? crypto.randomUUID()),
                name: String(evt.name ?? 'tool'),
                input: String(evt.input ?? ''),
                output: String(evt.output ?? ''),
                durationMs: Number(evt.durationMs ?? 0),
                status: evt.status === 'error' ? 'error' : 'success',
              };
              updateAsst((m) => ({ ...m, toolCalls: [...(m.toolCalls ?? []), tc] }));
            } else if (evt.type === 'error') {
              updateAsst((m) => ({
                ...m,
                content: m.content || `⚠️ ${String(evt.message ?? 'Something went wrong')}`,
              }));
            }
          } catch { /* skip malformed SSE line */ }
        }
      }

      // If nothing streamed, mark error state
      setThreads((prev) => prev.map((t) => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          messages: t.messages.map((m) => {
            if (m.timestamp === asstMsg.timestamp && m.role === 'assistant' && !m.content && !(m.toolCalls?.length)) {
              return { ...m, content: '⚠️ No response received. Please try again.' };
            }
            return m;
          }),
        };
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setThreads((prev) => prev.map((t) => {
        if (t.id !== threadId) return t;
        return {
          ...t,
          messages: t.messages.map((m) =>
            m.timestamp === asstMsg.timestamp && m.role === 'assistant'
              ? { ...m, content: `⚠️ Could not reach ${activeDot}: ${msg}` }
              : m
          ),
        };
      }));
      setStatus(activeDot, 'error');
      setTimeout(() => setStatus(activeDot, 'idle'), 4000);
    } finally {
      setIsStreaming(false);
      setStatus(activeDot, 'idle');
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const activeDef = DOTS.find((d) => d.name === activeDot);

  return (
    <div className="flex h-full bg-black/40 rounded-2xl overflow-hidden border border-white/10">
      {/* ── Dot rail ── */}
      <div className="w-16 shrink-0 border-r border-white/10 bg-black/30 flex flex-col items-center py-3 gap-2 overflow-y-auto">
        {DOTS.map((d) => (
          <button
            key={d.name}
            onClick={() => handleSelectDot(d.name)}
            disabled={isStreaming}
            className={`relative transition-transform hover:scale-105 ${activeDot === d.name ? '' : 'opacity-50 hover:opacity-90'} ${isStreaming ? 'cursor-not-allowed' : ''}`}
            title={`${d.name} — ${d.role}`}
          >
            <DotAvatar dotName={d.name} status={dotStatuses[d.name] ?? (activeDot === d.name && isStreaming ? 'thinking' : 'idle')} size="md" />
          </button>
        ))}
      </div>

      {/* ── Thread sidebar ── */}
      {sidebarOpen && (
        <div className="w-64 shrink-0 border-r border-white/10 bg-black/20 hidden md:block">
          <ThreadSidebar
            threads={threads}
            activeThreadId={activeThreadId}
            activeDot={activeDot}
            onSelectThread={setActiveThreadId}
            onNewThread={handleNewThread}
            onDeleteThread={handleDeleteThread}
          />
        </div>
      )}

      {/* ── Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/40 hover:text-white text-lg md:hidden"
          >
            ☰
          </button>
          {activeDef && (
            <DotAvatar dotName={activeDot} status={dotStatuses[activeDot] ?? 'idle'} size="sm" showLabel />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-white/40 truncate">{activeDef?.specialty}</div>
          </div>
          <div className="text-[10px] px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
            ForgeOS AI
          </div>
          {isStreaming && (
            <button
              onClick={handleStop}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
            >
              Stop
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {!activeThread || activeThread.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <DotAvatar dotName={activeDot} size="lg" status="idle" />
              <h3 className="text-xl font-semibold text-white mt-4">{activeDef?.name}</h3>
              <p className="text-sm text-white/40 mt-1">{activeDef?.role}</p>
              <p className="text-xs text-white/30 mt-3 max-w-xs">
                Ask anything — {activeDef?.name} researches, analyzes, and executes tools through ForgeOS AI.
              </p>
            </div>
          ) : (
            activeThread.messages.map((m, i) => (
              <div key={`${m.timestamp}-${i}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === 'user'
                    ? 'bg-violet-600/30 border border-violet-400/20 text-white'
                    : 'bg-white/6 border border-white/10 text-white/90'
                }`}>
                  {m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mb-2">
                      {m.toolCalls.map((tc) => (
                        <ToolActivityCard key={tc.id} tool={tc} />
                      ))}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {m.content}
                    {isStreaming && m.role === 'assistant' && i === activeThread.messages.length - 1 && (
                      <span className="inline-block w-2 h-4 ml-1 bg-sky-400 animate-pulse" />
                    )}
                  </div>
                  <div className="text-[10px] text-white/25 mt-1.5">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Message ${activeDot}…`}
              disabled={isStreaming}
              className="flex-1 bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="px-5 py-3 rounded-xl bg-violet-600/40 border border-violet-400/30 text-white text-sm font-medium hover:bg-violet-600/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isStreaming ? '…' : 'Send'}
            </button>
          </div>
          <div className="text-[10px] text-white/25 mt-2 text-center">
            All inference via ForgeOS AI · Tools execute server-side with per-Dot permissions
          </div>
        </div>
      </div>
    </div>
  );
}
