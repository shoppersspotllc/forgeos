'use client';

import { useState } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, GlowButton, CinematicBackground,
} from '@/components/design-system';
import {
  GitBranch, Search, CheckCircle2, AlertTriangle, Package,
  FileCode, ShieldCheck, Zap, ExternalLink, Loader2,
} from 'lucide-react';

interface Analysis {
  repository: any;
  languages: Record<string, number>;
  analysis: {
    projectType: string;
    primaryLanguage: string;
    packageManager: string;
    capabilities: string[];
    requirements: string[];
    risks: string[];
    integrationScore: number;
    integrationReadiness: string;
    suggestedRole: string;
  };
}

export function GitHubView() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [integrated, setIntegrated] = useState(false);

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setIntegrated(false);
    try {
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const readinessColor = (r: string) =>
    r === 'READY' ? 'var(--success)' : r === 'NEEDS_REVIEW' ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="github" />
      <div className="relative p-8 max-w-5xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Repository Workspace"
            title="GitHub"
            description="Paste a repository URL → analyze → understand → approve → one-click integrate."
            accent="#a371f7"
          />
        </FadeUp>

        {/* URL input */}
        <FadeUp delay={80}>
          <GlassPanel className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 rounded-xl"
                   style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <GitBranch className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && analyze()}
                  placeholder="https://github.com/owner/repository"
                  className="flex-1 bg-transparent py-3 text-sm outline-none font-mono"
                  style={{ color: 'var(--text)' }}
                />
              </div>
              <GlowButton onClick={analyze}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1 inline" />}
                Analyze
              </GlowButton>
            </div>
            {error && (
              <p className="text-sm mt-3 flex items-center gap-2" style={{ color: 'var(--error)' }}>
                <AlertTriangle className="h-4 w-4" /> {error}
              </p>
            )}
          </GlassPanel>
        </FadeUp>

        {result && (
          <FadeUp delay={120}>
            {/* Repo header */}
            <GlassPanel glow="#a371f7" className="mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <a href={result.repository.url} target="_blank" rel="noopener"
                     className="font-bold text-lg flex items-center gap-2 hover:underline"
                     style={{ color: 'var(--text)' }}>
                    {result.repository.fullName} <ExternalLink className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  </a>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {result.repository.description || 'No description'}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>⭐ {result.repository.stars}</span>
                    <span>⑂ {result.repository.forks}</span>
                    <span>License: {result.repository.license}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-extrabold" style={{ color: readinessColor(result.analysis.integrationReadiness) }}>
                    {result.analysis.integrationScore}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>
                    {result.analysis.integrationReadiness.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </GlassPanel>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Capabilities */}
              <GlassPanel>
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Zap className="h-4 w-4" style={{ color: 'var(--success)' }} /> Capabilities
                </h4>
                <div className="space-y-1.5">
                  {result.analysis.capabilities.map((c) => (
                    <p key={c} className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--success)' }} /> {c}
                    </p>
                  ))}
                  {result.analysis.capabilities.length === 0 && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No specific capabilities detected</p>
                  )}
                </div>
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Suggested role</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{result.analysis.suggestedRole}</p>
                </div>
              </GlassPanel>

              {/* Requirements & Risks */}
              <GlassPanel>
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Package className="h-4 w-4" style={{ color: 'var(--accent)' }} /> Requirements
                </h4>
                <div className="space-y-1.5 mb-4">
                  {result.analysis.requirements.map((r) => (
                    <p key={r} className="text-xs" style={{ color: 'var(--text-secondary)' }}>• {r}</p>
                  ))}
                </div>
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <ShieldCheck className="h-4 w-4" style={{ color: 'var(--warning)' }} /> Risks
                </h4>
                <div className="space-y-1.5">
                  {result.analysis.risks.map((r) => (
                    <p key={r} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--warning)' }}>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {r}
                    </p>
                  ))}
                  {result.analysis.risks.length === 0 && (
                    <p className="text-xs" style={{ color: 'var(--success)' }}>✓ No significant risks detected</p>
                  )}
                </div>
              </GlassPanel>
            </div>

            {/* Languages */}
            <GlassPanel className="mb-4">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <FileCode className="h-4 w-4" style={{ color: 'var(--accent)' }} /> Languages
              </h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(result.languages).slice(0, 6).map(([lang]) => (
                  <span key={lang} className="text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    {lang}
                  </span>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Type: {result.analysis.projectType} {result.analysis.packageManager && `· ${result.analysis.packageManager}`}
              </p>
            </GlassPanel>

            {/* One-click integrate */}
            <GlassPanel glow={integrated ? 'var(--success)' : 'var(--accent)'} className="text-center py-6">
              {!integrated ? (
                <>
                  <h4 className="font-bold mb-2" style={{ color: 'var(--text)' }}>Ready to integrate?</h4>
                  <p className="text-xs mb-4 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                    This will register <code className="font-mono">{result.repository.fullName}</code> as a
                    ForgeOS capability ({result.analysis.suggestedRole.toLowerCase()}).
                  </p>
                  <GlowButton onClick={() => setIntegrated(true)}>
                    <Zap className="h-4 w-4 mr-1 inline" /> One-Click Integrate
                  </GlowButton>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2" style={{ color: 'var(--success)' }} />
                  <h4 className="font-bold" style={{ color: 'var(--text)' }}>Integrated</h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {result.repository.fullName} registered in the Capability Registry.
                  </p>
                </>
              )}
            </GlassPanel>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
