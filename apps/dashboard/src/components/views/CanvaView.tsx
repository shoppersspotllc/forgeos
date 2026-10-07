'use client';

import {
  GlassPanel, SectionHeader, FadeUp, CinematicBackground, GlowButton,
} from '@/components/design-system';
import { Palette, ExternalLink, Info } from 'lucide-react';

export function CanvaView() {
  const openCanva = () => {
    window.open('https://www.canva.com', '_blank', 'noopener');
  };

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="canva" />
      <div className="relative p-8 max-w-4xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Design Studio"
            title="Canva"
            description="First-class creative capability. Opens your actual Canva workspace."
            accent="#00c4cc"
          />
        </FadeUp>

        <FadeUp delay={100}>
          <GlassPanel glow="#00c4cc" className="text-center py-12">
            <div className="h-16 w-16 mx-auto mb-6 rounded-3xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#00c4cc,#7d2ae8)', boxShadow: '0 12px 32px rgba(0,196,204,0.4)' }}>
              <Palette className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Open Canva Workspace
            </h3>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              ForgeOS launches your real Canva account in a new tab.
              Use your Canva Pro account for premium assets, brand kits, and AI design tools.
            </p>
            <GlowButton onClick={openCanva}>
              Launch Canva <ExternalLink className="h-4 w-4 ml-1 inline" />
            </GlowButton>
            <p className="text-xs mt-6 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Info className="h-3.5 w-3.5" />
              OAuth integration available — connect your account for in-dashboard asset management.
            </p>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
