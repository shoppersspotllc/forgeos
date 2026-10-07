'use client';

import { useState, useEffect } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, StatusPill, CinematicBackground, GlowButton,
} from '@/components/design-system';
import { Terminal, Code2, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

interface WorkerStatus {
  installed: boolean;
  version: string | null;
  path: string | null;
  provider: string;
  sessionId: string;
}

function WorkerCard({ title, icon: Icon, status, color, installCmd }: {
  title: string; icon: any; status: WorkerStatus; color: string; installCmd: string;
}) {
  return (
    <GlassPanel hover glow={status.installed ? color : undefined}>
      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
             style={{
               background: status.installed ? `linear-gradient(135deg, ${color}, ${color}88)` : 'var(--surface)',
               border: status.installed ? 'none' : '1px solid var(--border)',
             }}>
          <Icon className="h-6 w-6" style={{ color: status.installed ? '#fff' : 'var(--text-muted)' }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
            <StatusPill status={status.installed ? 'available' : 'setup'} />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Provider: {status.provider} · Session: <code className="font-mono">{status.sessionId}</code>
          </p>
        </div>
      </div>

      {status.installed ? (
        <div className="space-y-2">
          <p className="text-xs flex items-center gap-2" style={{ color: 'var(--success)' }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Installed{status.version ? ` — ${status.version}` : ''}
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{status.path}</p>
          <GlowButton>Open Terminal</GlowButton>
        </div>
      ) : (
        <div className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 20%, transparent)' }}>
          <p className="text-xs font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--warning)' }}>
            <AlertTriangle className="h-3.5 w-3.5" /> Not installed on this machine
          </p>
          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>To enable:</p>
          <code className="text-[11px] font-mono block p-2 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            {installCmd}
          </code>
        </div>
      )}
    </GlassPanel>
  );
}

export function TerminalView({ worker }: { worker: 'opencode' | 'claude' }) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/terminal/status').then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  const isOpenCode = worker === 'opencode';
  const ws = isOpenCode ? status?.opencode : status?.claudeCode;

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="dashboard" />
      <div className="relative p-8 max-w-4xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Developer Worker"
            title={isOpenCode ? 'OpenCode' : 'Claude Code'}
            description={isOpenCode
              ? 'Developer worker powered by ForgeOS AI (default provider).'
              : 'Premium developer worker using Anthropic authentication.'}
          />
        </FadeUp>

        <FadeUp delay={100}>
          {ws ? (
            <WorkerCard
              title={isOpenCode ? 'OpenCode' : 'Claude Code'}
              icon={isOpenCode ? Code2 : Terminal}
              status={ws}
              color={isOpenCode ? '#22d3ee' : '#f59e0b'}
              installCmd={isOpenCode
                ? 'npm install -g opencode-ai'
                : 'npm install -g @anthropic-ai/claude-code'}
            />
          ) : (
            <GlassPanel className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Checking worker status…</p>
            </GlassPanel>
          )}
        </FadeUp>

        <FadeUp delay={160}>
          <GlassPanel className="mt-4">
            <h4 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>PTY Terminal Server</h4>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              WebSocket PTY server on <code className="font-mono">127.0.0.1:3457</code> with 5-minute
              detached-session persistence (as on VPS).
            </p>
            <p className="text-xs mt-2 flex items-center gap-2" style={{ color: 'var(--warning)' }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {status?.ptyServer.note || 'Status unknown'}
            </p>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
