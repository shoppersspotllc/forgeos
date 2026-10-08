'use client';

import { useState } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, CinematicBackground, GlowButton,
} from '@/components/design-system';
import { Palette, Sparkles, Copy, Check, Loader2, Image as ImageIcon, Film, Music } from 'lucide-react';

type MediaType = 'image' | 'video' | 'audio';

const MEDIA_TYPES: { id: MediaType; label: string; icon: any; placeholder: string }[] = [
  { id: 'image', label: 'Image', icon: ImageIcon, placeholder: 'A cinematic portrait of a robot artist painting at sunset...' },
  { id: 'video', label: 'Video', icon: Film, placeholder: 'Slow dolly shot through a neon-lit cyberpunk market, rain reflections...' },
  { id: 'audio', label: 'Audio', icon: Music, placeholder: 'Ambient electronic track, 90 BPM, dreamy pads with subtle arpeggios...' },
];

export function MediaEngineView() {
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [prompt, setPrompt] = useState('');
  const [enhanced, setEnhanced] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const enhance = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setEnhanced('');
    try {
      const typeLabel = MEDIA_TYPES.find(t => t.id === mediaType)?.label || 'media';
      const res = await fetch('/api/forgeos-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a professional ${typeLabel.toLowerCase()} generation prompt engineer. Take the user's rough idea and expand it into a detailed, production-ready prompt optimized for AI ${typeLabel.toLowerCase()} generators (like Midjourney, DALL-E, Runway, or ElevenLabs). Include style descriptors, lighting/composition/audio details, mood, and technical quality tags. Return ONLY the enhanced prompt, no explanations.`,
            },
            { role: 'user', content: prompt },
          ],
          capability: 'chat',
        }),
        signal: AbortSignal.timeout(120000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enhancement failed');
      const text = data.choices?.[0]?.message?.content || data.text || JSON.stringify(data);
      setEnhanced(typeof text === 'string' ? text : JSON.stringify(text));
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const copyPrompt = async () => {
    const text = enhanced || prompt;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard unavailable on this device');
    }
  };

  const activeType = MEDIA_TYPES.find(t => t.id === mediaType)!;

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="mediaengine" />
      <div className="relative p-4 sm:p-8 max-w-4xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Creative Pipeline"
            title="Media Engine"
            description="AI-powered prompt studio. Craft production-ready prompts for image, video, and audio generation."
            accent="#f472b6"
          />
        </FadeUp>

        {/* Media type selector */}
        <FadeUp delay={80}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            {MEDIA_TYPES.map((t) => {
              const active = mediaType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setMediaType(t.id)}
                  className="flex items-center justify-center gap-2 px-3 py-3 sm:py-3.5 rounded-xl text-sm font-medium transition-all min-h-[48px]"
                  style={{
                    background: active ? 'var(--accent-glow)' : 'var(--surface)',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    color: active ? 'var(--text)' : 'var(--text-secondary)',
                  }}
                >
                  <t.icon className="h-4 w-4" />
                  <span className="hidden xs:inline sm:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
        </FadeUp>

        {/* Prompt input */}
        <FadeUp delay={120}>
          <GlassPanel className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Your idea
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeType.placeholder}
              rows={4}
              className="w-full bg-transparent text-sm outline-none resize-y rounded-xl p-3"
              style={{ color: 'var(--text)', background: 'var(--bg)', border: '1px solid var(--border)' }}
            />
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              {loading || !prompt.trim() ? (
                <span
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white opacity-50 cursor-not-allowed inline-flex items-center justify-center min-h-[44px]"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
                  }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : <Sparkles className="h-4 w-4 inline mr-1" />}
                  Enhance with AI
                </span>
              ) : (
                <GlowButton onClick={enhance}>
                  <Sparkles className="h-4 w-4 inline mr-1" />
                  Enhance with AI
                </GlowButton>
              )}
              <button
                onClick={copyPrompt}
                disabled={!prompt && !enhanced}
                className="text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
              >
                {copied ? <Check className="h-4 w-4" style={{ color: 'var(--success)' }} /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy prompt'}
              </button>
            </div>
            {error && <p className="text-sm mt-3" style={{ color: 'var(--error)' }}>{error}</p>}
          </GlassPanel>
        </FadeUp>

        {/* Enhanced output */}
        {enhanced && (
          <FadeUp delay={160}>
            <GlassPanel glow="#f472b6" className="mb-4">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Palette className="h-4 w-4" style={{ color: '#f472b6' }} />
                Enhanced {activeType.label} Prompt
              </h4>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {enhanced}
              </p>
            </GlassPanel>
          </FadeUp>
        )}

        {/* Tips */}
        <FadeUp delay={200}>
          <GlassPanel>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <Sparkles className="h-3 w-3 inline mr-1" />
              Tip: paste the enhanced prompt into Midjourney, DALL-E, Runway, Pika, or ElevenLabs.
              Media Engine crafts the prompt — your chosen generator renders it.
            </p>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
