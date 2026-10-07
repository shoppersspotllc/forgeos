// ForgeOS Terminal PTY Server (Local)
// WebSocket terminal server on 127.0.0.1:3457
// LOCAL ONLY — no Oracle VPS dependency.
// Spawns local shells/processes. Each session is isolated.

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { spawn, execSync } from 'child_process';

const PORT = parseInt(process.env.TERMINAL_PORT || '3457', 10);
const HOST = '127.0.0.1';

// Session management with 5-minute detached persistence
const sessions = new Map();

function checkBinary(name) {
  try {
    const p = execSync(`which ${name} 2>/dev/null`, { timeout: 3000 }).toString().trim();
    return p || null;
  } catch { return null; }
}

const server = createServer((req, res) => {
  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'forgeos-terminal',
      local: true,
      oracle: false,
      sessions: sessions.size,
      binaries: {
        opencode: !!checkBinary('opencode'),
        claude: !!checkBinary('claude'),
        shell: true,
      },
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('session') || `term-${Date.now()}`;
  const worker = url.searchParams.get('worker') || 'shell'; // 'opencode' | 'claude' | 'shell'

  console.log(`Terminal session: ${sessionId} (worker=${worker})`);

  // Determine command to spawn
  let cmd, args;
  const opencodePath = checkBinary('opencode');
  const claudePath = checkBinary('claude');

  if (worker === 'opencode' && opencodePath) {
    cmd = opencodePath; args = [];
  } else if (worker === 'claude' && claudePath) {
    cmd = claudePath; args = [];
  } else {
    // Fallback to shell with informative banner
    cmd = '/bin/bash'; args = ['--login'];
  }

  const proc = spawn(cmd, args, {
    cwd: process.env.HOME || '/tmp',
    env: { ...process.env, TERM: 'xterm-256color', FORGEOS_TERMINAL: '1', FORGEOS_WORKER: worker },
  });

  const session = { proc, ws, worker, lastActive: Date.now(), sessionId };
  sessions.set(sessionId, session);

  // Send banner
  const banner = worker === 'opencode' && !opencodePath
    ? '\r\n\x1b[33mOpenCode not installed. Shell fallback active.\x1b[0m\r\n\x1b[90mInstall: npm install -g opencode-ai\x1b[0m\r\n\r\n'
    : worker === 'claude' && !claudePath
    ? '\r\n\x1b[33mClaude Code not installed. Shell fallback active.\x1b[0m\r\n\x1b[90mInstall: npm install -g @anthropic-ai/claude-code\x1b[0m\r\n\r\n'
    : `\r\n\x1b[32mForgeOS Terminal — ${worker} (${sessionId})\x1b[0m\r\n\x1b[90mLocal session. No Oracle dependency.\x1b[0m\r\n\r\n`;
  ws.send(JSON.stringify({ type: 'output', data: banner }));

  proc.stdout.on('data', (data) => {
    session.lastActive = Date.now();
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'output', data: data.toString('base64'), encoding: 'base64' }));
  });
  proc.stderr.on('data', (data) => {
    session.lastActive = Date.now();
    if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'output', data: data.toString('base64'), encoding: 'base64' }));
  });
  proc.on('exit', (code) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'exit', code }));
    }
    // Keep session for 5 minutes (detached persistence)
    setTimeout(() => {
      if (sessions.get(sessionId) === session) {
        sessions.delete(sessionId);
        console.log(`Session expired: ${sessionId}`);
      }
    }, 5 * 60 * 1000);
  });

  ws.on('message', (msg) => {
    try {
      const { type, data } = JSON.parse(msg.toString());
      session.lastActive = Date.now();
      if (type === 'input' && proc.stdin.writable) {
        proc.stdin.write(Buffer.from(data, 'base64'));
      } else if (type === 'resize' && proc.stdout.isTTY) {
        // Resize not supported without PTY, ignore
      }
    } catch { /* ignore malformed */ }
  });

  ws.on('close', () => {
    console.log(`WebSocket closed: ${sessionId} (process kept for 5 min)`);
  });
  ws.on('error', () => { /* ignore */ });
});

server.listen(PORT, HOST, () => {
  console.log(`ForgeOS Terminal (LOCAL) on ${HOST}:${PORT}`);
  console.log('No Oracle VPS dependency. All sessions local.');
});
