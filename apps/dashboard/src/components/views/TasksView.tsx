'use client';

import { useState } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, StatusPill, CinematicBackground,
} from '@/components/design-system';
import { Send, Loader2, ChevronDown, ChevronRight, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface TraceEntry {
  stage: string;
  detail: string;
}

interface TaskResponse {
  status: string;
  dot: string | null;
  result?: unknown;
  trace?: TraceEntry[];
  error?: string;
}

const EXAMPLE_TASKS = [
  'what can you do',
  'check ForgeOS AI health',
  'list capabilities',
];

function TraceViewer({ trace }: { trace: TraceEntry[] }) {
  const [open, setOpen] = useState(false);
  if (!trace || trace.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium"
        style={{ color: 'var(--text-secondary)', background: 'var(--surface)' }}
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Execution Trace ({trace.length} steps)
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2 max-h-64 overflow-y-auto" style={{ background: 'var(--bg)' }}>
          {trace.map((t, i) => (
            <div key={i} className="text-xs font-mono rounded-lg px-3 py-2" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent)' }}>[{t.stage}]</span>{' '}
              <span style={{ color: 'var(--text-muted)' }}>{t.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultDisplay({ response }: { response: TaskResponse }) {
  const { dot, status, result, error } = response;
  const isSuccess = status === 'complete' && dot;
  const isRejection = !dot;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3 mb-3">
        {isSuccess ? (
          <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--success)' }} />
        ) : (
          <XCircle className="h-5 w-5" style={{ color: isRejection ? 'var(--warning)' : 'var(--error)' }} />
        )}
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {isSuccess ? `Routed to ${dot}` : isRejection ? 'Honestly rejected' : 'Failed'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {isSuccess
              ? 'AI routing via ForgeOS AI (ollama/llama3.2:1b)'
              : isRejection
                ? 'Task is out of domain for available Dots — no fabrication'
                : error || 'Execution failed'}
          </div>
        </div>
        {dot && (
          <div className="flex items-center gap-2">
            <StatusPill status="online" />
            <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'var(--surface)', color: 'var(--accent)' }}>
              {dot}
            </span>
          </div>
        )}
      </div>

      {result !== undefined && result !== null && (
        <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Result
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs" style={{ color: 'var(--text)' }}>
            {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {response.trace && <TraceViewer trace={response.trace} />}
    </div>
  );
}

export function TasksView() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TaskResponse | null>(null);
  const [history, setHistory] = useState<{ task: string; response: TaskResponse }[]>([]);

  const submit = async (taskText?: string) => {
    const task = (taskText ?? input).trim();
    if (!task || loading) return;
    setInput('');
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const data: TaskResponse = await res.json();
      setResponse(data);
      setHistory(h => [{ task, response: data }, ...h].slice(0, 10));
    } catch (e: any) {
      setResponse({ status: 'failed', dot: null, error: e.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="tasks" />
      <div className="relative p-8 max-w-4xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="AI Agent Platform"
            title="ForgeOS Tasks"
            description="Assign tasks to AI Dots — real AI routing via ForgeOS AI (ollama/llama3.2:1b)"
            accent="#8b5cf6"
          />
        </FadeUp>

        <FadeUp delay={0.1}>
          <GlassPanel className="p-6">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Describe a task, e.g. 'what can you do' or 'check ForgeOS AI health'..."
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
                disabled={loading}
              />
              <button
                onClick={() => submit()}
                disabled={loading || !input.trim()}
                className="rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                  color: 'white',
                  boxShadow: '0 4px 16px var(--accent-glow)',
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {loading ? 'Routing...' : 'Submit'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Try:</span>
              {EXAMPLE_TASKS.map(ex => (
                <button
                  key={ex}
                  onClick={() => submit(ex)}
                  disabled={loading}
                  className="text-xs rounded-full px-3 py-1.5 transition-all hover:scale-105 disabled:opacity-50"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>

            {loading && (
              <div className="mt-6 flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--accent)' }} />
                Consulting ForgeOS AI gateway — real model routing in progress...
              </div>
            )}

            {response && !loading && <ResultDisplay response={response} />}
          </GlassPanel>
        </FadeUp>

        {history.length > 0 && (
          <FadeUp delay={0.2}>
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                Recent Tasks
              </h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3 flex items-center justify-between text-sm"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <span className="truncate" style={{ color: 'var(--text)' }}>{h.task}</span>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {h.response.dot ? (
                        <>
                          <StatusPill status="online" />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{h.response.dot}</span>
                        </>
                      ) : (
                        <StatusPill status="offline" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
