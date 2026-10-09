'use client';

import { useState, useEffect } from 'react';
import {
  GlassPanel, SectionHeader, GlowButton, StatusPill, FadeUp,
} from '@/components/design-system';
import { Play, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight, AlertTriangle, Target } from 'lucide-react';

interface WorkforceObjective {
  dotName: string;
  emoji: string;
  role: string;
  objective: string;
  keyResults: string[];
  taskTemplate: string;
  constraints: string[];
  priority: 'high' | 'medium';
  category: string;
}

interface ToolEvidence {
  capability: string;
  operation: string;
  success: boolean;
  denied?: boolean;
  error?: string;
  resultSummary?: string;
}

interface RunRecord {
  id: string;
  dotName: string;
  timestamp: number;
  status: 'success' | 'failed';
  toolsUsed: number;
  answer: string;
  evidence: ToolEvidence[];
  error?: string;
}

const STORAGE_KEY = 'forgeos-workforce-runs-v1';

function loadRuns(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRuns(runs: RunRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, 100)));
  } catch {
    /* storage full or unavailable */
  }
}

function DotCard({
  objective,
  lastRun,
  running,
  onRun,
}: {
  objective: WorkforceObjective;
  lastRun?: RunRecord;
  running: boolean;
  onRun: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <GlassPanel className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{objective.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{objective.dotName}</h3>
            <StatusPill status={objective.priority === 'high' ? 'warning' : 'info'}>
              {objective.priority === 'high' ? 'High priority' : 'Standard'}
            </StatusPill>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
              {objective.category}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{objective.role}</p>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--text)' }}>
          <Target className="h-3.5 w-3.5" /> Objective
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{objective.objective}</p>
      </div>

      <div className="mb-3">
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>KEY RESULTS</p>
        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          {objective.keyResults.map((kr, i) => (
            <li key={i} className="flex gap-1.5">
              <span style={{ color: 'var(--accent)' }}>•</span> {kr}
            </li>
          ))}
        </ul>
      </div>

      {objective.constraints.length > 0 && (
        <div className="mb-3 p-2 rounded-lg flex gap-2" style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)' }}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#ffb400' }} />
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {objective.constraints.map((c, i) => <p key={i}>{c}</p>)}
          </div>
        </div>
      )}

      {/* Last run status */}
      {lastRun && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-2 text-xs font-semibold p-2 rounded-lg"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}
          >
            {lastRun.status === 'success'
              ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
              : <XCircle className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />}
            Last run: {lastRun.status === 'success' ? 'Delivered' : 'Failed'}
            <span style={{ color: 'var(--text-muted)' }}>
              · {new Date(lastRun.timestamp).toLocaleString()}
              · {lastRun.toolsUsed} tool{lastRun.toolsUsed === 1 ? '' : 's'}
            </span>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 ml-auto" /> : <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
          </button>
          {expanded && (
            <div className="mt-2 p-3 rounded-lg text-xs space-y-2" style={{ background: 'var(--surface)' }}>
              {lastRun.error && (
                <p style={{ color: '#ef4444' }}>Error: {lastRun.error}</p>
              )}
              <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {lastRun.answer.substring(0, 800)}{lastRun.answer.length > 800 ? '...' : ''}
              </p>
              {lastRun.evidence.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowEvidence(!showEvidence)}
                    className="font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {showEvidence ? 'Hide' : 'Show'} tool evidence ({lastRun.evidence.length})
                  </button>
                  {showEvidence && (
                    <ul className="mt-1 space-y-1" style={{ color: 'var(--text-muted)' }}>
                      {lastRun.evidence.map((e, i) => (
                        <li key={i}>
                          {e.success ? '✅' : e.denied ? '🚫' : '❌'} {e.capability}/{e.operation}
                          {e.error && ` — ${e.error.substring(0, 100)}`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {lastRun.status === 'failed' && (
                <p className="font-semibold" style={{ color: '#ffb400' }}>
                  Next action: Re-run the task. If it fails again, check /api/my-dots/chat health and ForgeOS AI provider status.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <GlowButton onClick={onRun} disabled={running} className="w-full">
        {running ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Running...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Play className="h-4 w-4" /> Run Objective Task
          </span>
        )}
      </GlowButton>
    </GlassPanel>
  );
}

export function WorkforceView() {
  const [objectives, setObjectives] = useState<WorkforceObjective[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [runningDot, setRunningDot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRuns(loadRuns());
    fetch('/api/workforce/objectives')
      .then((r) => r.json())
      .then((d) => setObjectives(d.objectives || []))
      .catch(() => setObjectives([]))
      .finally(() => setLoading(false));
  }, []);

  const runTask = async (obj: WorkforceObjective) => {
    if (runningDot) return;
    setRunningDot(obj.dotName);
    const record: RunRecord = {
      id: `${Date.now()}-${obj.dotName}`,
      dotName: obj.dotName,
      timestamp: Date.now(),
      status: 'failed',
      toolsUsed: 0,
      answer: '',
      evidence: [],
    };
    try {
      const res = await fetch('/api/my-dots/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dotName: obj.dotName, message: obj.taskTemplate }),
        signal: AbortSignal.timeout(150000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const tools: ToolEvidence[] = data.forgeosTools || [];
      const answer =
        data.choices?.[0]?.message?.content || data.reply || '(no response text)';
      record.status = tools.length > 0 && tools.some((t) => t.success) ? 'success' : tools.length > 0 ? 'failed' : 'success';
      // If no tools ran but we got an answer, mark success (Dot answered from knowledge);
      // if tools ran and all failed, mark failed.
      if (tools.length > 0 && !tools.some((t) => t.success)) {
        record.status = 'failed';
        record.error = 'All tool calls failed: ' + tools.map((t) => t.error || t.capability).join('; ');
      }
      record.toolsUsed = tools.length;
      record.answer = answer;
      record.evidence = tools;
    } catch (e: any) {
      record.status = 'failed';
      record.error = e.message || 'Unknown error';
    }
    const updated = [record, ...runs];
    setRuns(updated);
    saveRuns(updated);
    setRunningDot(null);
  };

  const lastRunFor = (dotName: string) => runs.find((r) => r.dotName === dotName);
  const successCount = runs.filter((r) => r.status === 'success').length;
  const failCount = runs.filter((r) => r.status === 'failed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Workforce Command Center"
        subtitle="Measurable outcomes per Dot — Young Money revenue first"
      />

      {/* Policy banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.25)' }}>
          <AlertTriangle className="h-4 w-4" style={{ color: '#ffb400' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>PinDrop outreach: HELD — research only</span>
        </div>
        <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.25)' }}>
          <AlertTriangle className="h-4 w-4" style={{ color: '#6496ff' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Quant: research-only, $0 exposure</span>
        </div>
        <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <CheckCircle2 className="h-4 w-4" style={{ color: '#22c55e' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {runs.length} runs · {successCount} delivered · {failCount} failed · $0 spent
          </span>
        </div>
      </div>

      {/* Dot cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {objectives.map((obj) => (
          <FadeUp key={obj.dotName}>
            <DotCard
              objective={obj}
              lastRun={lastRunFor(obj.dotName)}
              running={runningDot === obj.dotName}
              onRun={() => runTask(obj)}
            />
          </FadeUp>
        ))}
      </div>

      {objectives.length === 0 && (
        <GlassPanel className="p-6 text-center">
          <p style={{ color: 'var(--text-muted)' }}>Could not load workforce objectives.</p>
        </GlassPanel>
      )}
    </div>
  );
}
