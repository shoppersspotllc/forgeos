'use client';

import { useEffect, useRef, useState } from 'react';
import {
  GlassPanel, SectionHeader, FadeUp, StatusPill, CinematicBackground,
} from '@/components/design-system';
import { Terminal as TerminalIcon, Wifi, WifiOff, RotateCcw } from 'lucide-react';

// xterm.js is loaded dynamically (client-only)
export function LocalTerminal({ worker, sessionId }: { worker: 'opencode' | 'claude'; sessionId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let term: any = null;
    let fitAddon: any = null;
    let ws: WebSocket | null = null;
    let mounted = true;

    const init = async () => {
      // Check if terminal server is running (LOCAL)
      try {
        const st = await fetch('/api/terminal/server-status', { signal: AbortSignal.timeout(5000) });
        if (mounted) setServerOnline(st.ok);
        if (!st.ok) return;
      } catch {
        if (mounted) setServerOnline(false);
        return;
      }

      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      await import('@xterm/xterm/css/xterm.css');

      if (!mounted || !containerRef.current) return;

      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        theme: {
          background: 'rgba(10,10,18,0.95)',
          foreground: '#e4e4e7',
          cursor: '#8b5cf6',
          selectionBackground: 'rgba(139,92,246,0.3)',
        },
      });
      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();
      termRef.current = term;

      // Connect to LOCAL terminal server directly (both run on same machine)
      // No Oracle VPS. No proxy. Local only.
      ws = new WebSocket(`ws://127.0.0.1:3457?session=${sessionId}&worker=${worker}`);
      wsRef.current = ws;

      ws.onopen = () => { if (mounted) setConnected(true); };
      ws.onclose = () => { if (mounted) setConnected(false); };
      ws.onerror = () => { if (mounted) setConnected(false); };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'output' && term) {
            const text = msg.encoding === 'base64'
              ? Buffer.from(msg.data, 'base64').toString('utf-8')
              : msg.data;
            term.write(text);
          } else if (msg.type === 'exit' && term) {
            term.write(`\r\n\x1b[90m[Process exited: ${msg.code}]\x1b[0m\r\n`);
          }
        } catch { /* ignore */ }
      };

      term.onData((data: string) => {
        if (ws && ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'input', data: Buffer.from(data).toString('base64') }));
        }
      });

      const onResize = () => fitAddon?.fit();
      window.addEventListener('resize', onResize);

      return () => window.removeEventListener('resize', onResize);
    };

    const cleanup = init();
    return () => {
      mounted = false;
      ws?.close();
      term?.dispose();
      if (typeof cleanup === 'function') cleanup;
    };
  }, [worker, sessionId]);

  const reconnect = () => {
    wsRef.current?.close();
    setConnected(false);
    // Re-trigger effect by bumping a key — simplest: reload terminal
    window.location.reload();
  };

  return (
    <div className="relative min-h-full">
      <CinematicBackground identityId="dashboard" />
      <div className="relative p-8 max-w-6xl mx-auto">
        <FadeUp>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: 'var(--accent)' }}>
                Local Terminal — No Oracle Dependency
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3" style={{ color: 'var(--text)' }}>
                <TerminalIcon className="h-7 w-7" style={{ color: 'var(--accent)' }} />
                {worker === 'opencode' ? 'OpenCode' : 'Claude Code'}
              </h1>
              <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                Session: {sessionId} · 127.0.0.1:3457 (local)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusPill status={connected ? 'online' : serverOnline === false ? 'offline' : 'busy'} />
              <button onClick={reconnect} title="Reconnect"
                      className="p-2 rounded-lg transition-transform hover:scale-110"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={100}>
          {serverOnline === false ? (
            <GlassPanel className="text-center py-12">
              <WifiOff className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--warning)' }} />
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>Terminal server not running</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Start the local terminal server:
              </p>
              <code className="text-xs font-mono px-4 py-2 rounded-lg inline-block"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                cd ~/workspace/forgeos/services/terminal && npm start
              </code>
            </GlassPanel>
          ) : (
            <GlassPanel padding="p-2" glow="var(--accent)">
              <div ref={containerRef} className="rounded-xl overflow-hidden" style={{ height: '60vh', background: 'rgba(10,10,18,0.95)' }} />
              <div className="flex items-center gap-2 px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {connected ? <Wifi className="h-3.5 w-3.5" style={{ color: 'var(--success)' }} /> : <WifiOff className="h-3.5 w-3.5" style={{ color: 'var(--warning)' }} />}
                {connected ? 'Connected to local terminal' : 'Connecting…'}
                <span className="ml-auto font-mono">local only · forgeos-terminal</span>
              </div>
            </GlassPanel>
          )}
        </FadeUp>
      </div>
    </div>
  );
}
