'use client';

import {
  GlassPanel, SectionHeader, FadeUp, CinematicBackground, GlowButton,
} from '@/components/design-system';
import { AppWindow, ExternalLink, Info, ShieldCheck, UserPlus } from 'lucide-react';

const STUDIO_URL = 'https://studio.shogo.ai';

export function ShogoView() {
  const openStudio = () => {
    window.open(STUDIO_URL, '_blank', 'noopener');
  };

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="shogo" />
      <div className="relative p-8 max-w-4xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="AI App Builder"
            title="Shogo Studio"
            description="Your actual Shogo Studio workspace — design, build, and publish apps and sites."
            accent="#8b5cf6"
          />
        </FadeUp>

        <FadeUp delay={100}>
          <GlassPanel glow="#8b5cf6" className="text-center py-12">
            <div className="h-16 w-16 mx-auto mb-6 rounded-3xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', boxShadow: '0 12px 32px rgba(139,92,246,0.4)' }}>
              <AppWindow className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Open Shogo Studio
            </h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              ForgeOS launches your real Shogo Studio in a new tab — the full app,
              not a preview. Build and publish future projects from there.
            </p>
            <GlowButton onClick={openStudio}>
              Launch Shogo Studio <ExternalLink className="h-4 w-4 ml-1 inline" />
            </GlowButton>
            <p className="text-xs mt-6 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Info className="h-3.5 w-3.5" />
              Shogo's security policy blocks in-page embedding, so the full studio opens in its own tab.
            </p>
          </GlassPanel>
        </FadeUp>

        <FadeUp delay={140}>
          <GlassPanel className="mb-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                   style={{ background: 'linear-gradient(135deg,#8b5cf6,#4c1d95)' }}>
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>
                  Subscribe with your Shopper's Spot account
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  When you sign up or subscribe inside Shogo Studio, use your
                  Shopper's Spot account (shoppersspotllc.com) so all future
                  projects stay under one business identity.
                </p>
              </div>
            </div>
          </GlassPanel>
        </FadeUp>

        <FadeUp delay={180}>
          <GlassPanel>
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                This tab never re-implements Shogo — it opens the real platform.
                Your Shogo login, projects, and subscription live on shogo.ai, not in ForgeOS.
              </p>
            </div>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
