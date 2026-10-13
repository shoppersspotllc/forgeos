'use client';

import { useState } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, CinematicBackground, GlowButton,
} from '@/components/design-system';
import { Crosshair, Brain, Loader2, Sparkles } from 'lucide-react';

export function PositionAIView() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      // Calls Position AI's server-side API route, which authenticates to
      // ForgeOS AI using Position AI's dedicated fk_ credential (server-side only).
      // The browser never sees the credential and never calls ForgeOS AI directly.
      const res = await fetch('/api/position-ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(120000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="positionai" />
      <div className="relative p-8 max-w-4xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Strategic Intelligence"
            title="Position AI"
            description="Strategic positioning analysis powered by ForgeOS AI. Ask about market position, competitive landscape, or strategic direction."
            accent="#ec4899"
          />
        </FadeUp>

        <FadeUp delay={80}>
          <GlassPanel glow="#ec4899" className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 px-4 rounded-xl"
                   style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <Crosshair className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && analyze()}
                  placeholder="Analyze strategic position for..."
                  className="flex-1 bg-transparent py-3 text-sm outline-none"
                  style={{ color: 'var(--text)' }}
                />
              </div>
              <GlowButton onClick={analyze}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4 mr-1 inline" />}
                Analyze
              </GlowButton>
            </div>
            {error && (
              <p className="text-sm mt-3" style={{ color: 'var(--error)' }}>
                {error === 'All providers unavailable'
                  ? 'ForgeOS AI has no available providers. Add a provider key or install Ollama to enable analysis.'
                  : error}
              </p>
            )}
          </GlassPanel>
        </FadeUp>

        {result && (
          <FadeUp delay={120}>
            <GlassPanel>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" style={{ color: '#ec4899' }} />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Analysis via {result.forgeos?.label || 'ForgeOS AI'}
                  {result.forgeos?.fallback && ' (fallback)'}
                </p>
              </div>
              <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
                {result.choices?.[0]?.message?.content || 'No response content'}
              </div>
            </GlassPanel>
          </FadeUp>
        )}

        {!result && !error && !loading && (
          <FadeUp delay={120}>
            <GlassPanel className="text-center py-10">
              <Crosshair className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Enter a strategic question above to receive AI-powered positioning analysis.
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Powered by ForgeOS AI — routes to the best available provider.
              </p>
            </GlassPanel>
          </FadeUp>
        )}
      </div>
    </div>
  );
}
