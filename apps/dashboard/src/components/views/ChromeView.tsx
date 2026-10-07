'use client';

import {
  GlassPanel, SectionHeader, FadeUp, CinematicBackground,
} from '@/components/design-system';
import { Globe, Info, Monitor, Cloud } from 'lucide-react';

export function ChromeView() {
  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="dashboard" />
      <div className="relative p-8 max-w-4xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Browser Environment"
            title="Google Chrome"
            description="Browser bridge strategy — honest technical explanation."
            accent="#22d3ee"
          />
        </FadeUp>

        <FadeUp delay={100}>
          <GlassPanel className="mb-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                   style={{ background: 'linear-gradient(135deg,#22d3ee,#3b82f6)' }}>
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>
                  You are already in Chrome
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  ForgeOS is a web application running <em>inside</em> your browser.
                  A web app cannot launch its own host browser — that would be circular.
                </p>
              </div>
            </div>
          </GlassPanel>
        </FadeUp>

        <FadeUp delay={140}>
          <GlassPanel className="mb-4">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Monitor className="h-4 w-4" style={{ color: 'var(--accent)' }} />
              Correct Bridge Strategy
            </h4>
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex gap-3">
                <span className="font-bold" style={{ color: 'var(--accent)' }}>1.</span>
                <p><strong style={{ color: 'var(--text)' }}>Desktop app:</strong> Package ForgeOS as an Electron/Tauri app.
                The desktop shell <em>can</em> launch and control Chrome via CDP (Chrome DevTools Protocol).</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold" style={{ color: 'var(--accent)' }}>2.</span>
                <p><strong style={{ color: 'var(--text)' }}>Browser extension:</strong> A ForgeOS Chrome extension
                can open tabs, manage windows, and automate browser workflows via the Extensions API.</p>
              </div>
              <div className="flex gap-3">
                <span className="font-bold" style={{ color: 'var(--accent)' }}>3.</span>
                <p><strong style={{ color: 'var(--text)' }}>Cloud browser:</strong> Connect to a cloud browser service
                (e.g., Browserless) for programmatic Chrome control from the server.</p>
              </div>
            </div>
          </GlassPanel>
        </FadeUp>

        <FadeUp delay={180}>
          <GlassPanel>
            <div className="flex items-start gap-2">
              <Cloud className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <Info className="h-3 w-3 inline mr-1" />
                No fake "Chrome launched" status. When you choose a bridge strategy above,
                ForgeOS will implement real browser automation — not a dashboard pretending.
              </p>
            </div>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
