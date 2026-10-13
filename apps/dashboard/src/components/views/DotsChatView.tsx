'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Plus, ChevronLeft, Zap } from 'lucide-react';
import { DOTS, DOT_MAP } from '@/lib/mydots/dots';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tools?: { capability: string; operation: string; success: boolean }[];
}

interface Thread {
  id: string;
  dotName: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}


const STORAGE_KEY = 'forgeos-dots-threads-v1';

function loadThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveThreads(threads: Thread[]) {
  try {
    // Keep last 20 threads
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads.slice(0, 20)));
  } catch {
    /* storage full — ignore */
  }
}

export function DotsChatView({ onBack }: { onBack?: () => void }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dotName, setDotName] = useState('Scout');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load threads on mount
  useEffect(() => {
    setThreads(loadThreads());
  }, []);

  // Persist threads
  useEffect(() => {
    if (threads.length > 0) saveThreads(threads);
  }, [threads]);

  // Scroll to bottom on new messages
  const active = threads.find((t) => t.id === activeId);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length]);

  const newThread = useCallback(
    (dot: string) => {
      const t: Thread = {
        id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        dotName: dot,
        title: `New ${dot} chat`,
        messages: [],
        updatedAt: Date.now(),
      };
      setThreads((prev) => [t, ...prev]);
      setActiveId(t.id);
      setDotName(dot);
    },
    [],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    let tid = activeId;
    let thread = threads.find((t) => t.id === tid);
    if (!thread) {
      tid = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      thread = {
        id: tid,
        dotName,
        title: text.slice(0, 40) || `New ${dotName} chat`,
        messages: [],
        updatedAt: Date.now(),
      };
      setThreads((prev) => [thread!, ...prev]);
      setActiveId(tid);
    }

    const userMsg: Message = { role: 'user', content: text };
    const history = [...(thread?.messages || []), userMsg];

    // Optimistic update with user message + empty assistant placeholder
    setThreads((prev) =>
      prev.map((t) =>
        t.id === tid
          ? {
              ...t,
              title: t.messages.length === 0 ? text.slice(0, 40) : t.title,
              messages: [...history, { role: 'assistant', content: '' }],
              updatedAt: Date.now(),
            }
          : t,
      ),
    );
    setInput('');
    setStreaming(true);
    setStatus(`${dotName} is thinking…`);

    try {
      const res = await fetch('/api/my-dots/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dotName: thread?.dotName || dotName,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';
      const toolEvents: Message['tools'] = [];

      const applyAssistant = (content: string, tools?: Message['tools']) => {
        setThreads((prev) =>
          prev.map((t) => {
            if (t.id !== tid) return t;
            const msgs = [...t.messages];
            msgs[msgs.length - 1] = { role: 'assistant', content, tools };
            return { ...t, messages: msgs, updatedAt: Date.now() };
          }),
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(line.slice(5));
            if (evt.type === 'token') {
              acc += evt.text;
              applyAssistant(acc, toolEvents.length ? [...toolEvents] : undefined);
            } else if (evt.type === 'tool') {
              toolEvents.push({
                capability: evt.capability,
                operation: evt.operation,
                success: evt.success,
              });
              setStatus(
                evt.success
                  ? `${dotName} used ${evt.capability}…`
                  : `${dotName} tool ${evt.success ? '' : 'failed'}…`,
              );
            } else if (evt.type === 'error') {
              acc = `⚠️ ${evt.error}`;
              applyAssistant(acc);
            } else if (evt.type === 'done') {
              setStatus('');
            }
          } catch {
            /* partial JSON — ignore */
          }
        }
      }
      // Final apply in case stream ended without done
      if (acc) applyAssistant(acc, toolEvents.length ? [...toolEvents] : undefined);
    } catch (e: any) {
      const errMsg = `⚠️ Could not reach ${dotName}: ${e?.message || 'network error'}`;
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== tid) return t;
          const msgs = [...t.messages];
          msgs[msgs.length - 1] = { role: 'assistant', content: errMsg };
          return { ...t, messages: msgs };
        }),
      );
    } finally {
      setStreaming(false);
      setStatus('');
    }
  }, [input, streaming, activeId, threads, dotName]);

  const dotThreads = threads.filter((t) => t.dotName === dotName);

  return (
    <div className="flex h-full">
      {/* Sidebar: Dots + threads */}
      <div className="w-64 shrink-0 border-r border-white/10 flex flex-col">
        <div className="p-3 flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-white/10"
              title="Back to My Dots"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <span className="font-semibold text-sm">Native Dots</span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
            ForgeOS AI
          </span>
        </div>

        {/* Dot selector */}
        <div className="px-3 pb-2 grid grid-cols-4 gap-1.5">
          {DOTS.map((d) => (
            <button
              key={d.name}
              onClick={() => {
                setDotName(d.name);
                const existing = threads.find(
                  (t) => t.dotName === d.name && t.messages.length > 0,
                );
                if (existing) setActiveId(existing.id);
                else newThread(d.name);
              }}
              title={d.name}
              className={`p-2 rounded-xl text-xl transition ${
                dotName === d.name
                  ? 'bg-violet-500/30 ring-1 ring-violet-400/50'
                  : 'hover:bg-white/10'
              }`}
            >
              {d.emoji}
            </button>
          ))}
        </div>
        <div className="px-3 pb-2 text-xs text-white/50">
          {dotName} — {DOT_MAP[dotName]?.role}
        </div>

        <button
          onClick={() => newThread(dotName)}
          className="mx-3 mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs"
        >
          <Plus size={14} /> New chat
        </button>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {dotThreads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate ${
                t.id === activeId ? 'bg-violet-500/25' : 'hover:bg-white/5'
              }`}
            >
              {t.title}
            </button>
          ))}
          {dotThreads.length === 0 && (
            <div className="px-3 py-4 text-xs text-white/30">
              No chats yet — start one below.
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!active || active.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-3">{DOT_MAP[dotName]?.emoji || '🤖'}</div>
              <div className="font-semibold">{dotName}</div>
              <div className="text-sm text-white/50 max-w-xs mt-1">
                {DOT_MAP[dotName]?.specialty}. Ask anything — threads save
                automatically in this browser.
              </div>
            </div>
          ) : (
            active.messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'ml-auto bg-violet-500/30 rounded-br-md'
                    : 'bg-white/8 rounded-bl-md'
                }`}
              >
                {m.tools && m.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {m.tools.map((t, j) => (
                      <span
                        key={j}
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                          t.success
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        <Zap size={10} />
                        {t.capability}
                      </span>
                    ))}
                  </div>
                )}
                {m.content || (streaming && i === active.messages.length - 1 ? '▍' : '')}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {status && (
          <div className="px-4 py-1 text-xs text-white/40 flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            {status}
          </div>
        )}

        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Ask ${dotName} anything…`}
            disabled={streaming}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-sm outline-none focus:border-violet-400/50 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            className="p-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-40 transition"
            title="Send"
          >
            {streaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
