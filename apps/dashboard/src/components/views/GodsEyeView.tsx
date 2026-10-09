'use client';

import { useState } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, CinematicBackground, GlowButton, StatusPill,
} from '@/components/design-system';
import { Eye, ExternalLink, Info, MonitorSmartphone, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const GODS_EYE_URL = 'http://100.87.82.46:4173';

export function GodsEyeView() {
  const [checking, setChecking] = useState(false);
  const [reachable, setReachable] = useState<boolean | null>(null);

  const openGodsEye = () => {
    window.open(GODS_EYE_URL, '_blank', 'noopener');
  };

  const checkStatus = async () => {
    setChecking(true);
    setReachable(null);
    try {
      // Client-side probe: the user's browser must be on the Tailscale
      // network to reach God's Eye. Vercel's servers cannot reach it,
      // so a server-side check would always report offline.
      // no-cors gives an opaque response on success; failure rejects.
      await fetch(GODS_EYE_URL, {
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000),
      });
      setReachable(true);
    } catch {
      setReachable(false);
    }
    setChecking(false);
  };

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="godseye" />
      <div className="relative p-4 sm:p-8 max-w-4xl mx-auto">
        <FadeUp>
          <SectionHeader
            eyebrow="Omniscient Monitor"
            title="God's Eye"
            description="Live visual command view of your entire operation. Opens the actual God's Eye application."
            accent="#06b6d4"
          />
        </FadeUp>

        <FadeUp delay={100}>
          <GlassPanel glow="#06b6d4" className="text-center py-10 sm:py-12 px-4">
            <div className="h-16 w-16 mx-auto mb-6 rounded-3xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', boxShadow: '0 12px 32px rgba(6,182,212,0.4)' }}>
              <Eye className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Open God's Eye View
            </h3>
            <p className="text-sm mb-2 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              ForgeOS launches the real God's Eye application in a new tab —
              your live operational overview, running on the paired workstation.
            </p>
            <p className="text-xs font-mono mb-6" style={{ color: 'var(--text-muted)' }}>
              {GODS_EYE_URL}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <GlowButton onClick={openGodsEye}>
                Launch God's Eye <ExternalLink className="h-4 w-4 ml-1 inline" />
              </GlowButton>
              <button
                onClick={checkStatus}
                disabled={checking}
                className="text-sm font-medium px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50 min-h-[44px]"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Check status'}
              </button>
            </div>

            {reachable !== null && (
              <div className="mt-4 flex justify-center">
                <StatusPill status={reachable ? 'online' : 'offline'} />
              </div>
            )}
            {reachable === false && (
              <div className="mt-3 max-w-md mx-auto">
                <p className="text-xs flex items-center justify-center gap-2" style={{ color: 'var(--warning)' }}>
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  God's Eye isn't reachable from this device.
                </p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Check: (1) the Windows PC is powered on, (2) the God's Eye app is running on it
                  (port 4173), (3) this device has Tailscale connected.
                </p>
              </div>
            )}
            {reachable === true && (
              <p className="text-xs mt-3 flex items-center justify-center gap-2" style={{ color: 'var(--success)' }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                God's Eye is live and responding.
              </p>
            )}

            <p className="text-xs mt-6 flex items-center justify-center gap-2 px-2" style={{ color: 'var(--text-muted)' }}>
              <MonitorSmartphone className="h-3.5 w-3.5 shrink-0" />
              <span>Opens in a new tab — works from phone, tablet, or desktop.</span>
            </p>
            <p className="text-xs mt-2 flex items-center justify-center gap-2 px-2" style={{ color: 'var(--text-muted)' }}>
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Requires the God's Eye app running on your local network (Tailscale).</span>
            </p>
          </GlassPanel>
        </FadeUp>
      </div>
    </div>
  );
}
