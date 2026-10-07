import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

/**
 * Terminal worker status — checks for actual OpenCode/Claude Code binaries.
 * Honest: reports NOT_INSTALLED if binary missing, never fabricates.
 */

function checkBinary(name: string): { installed: boolean; version: string | null; path: string | null } {
  try {
    const path = execSync(`which ${name} 2>/dev/null`, { timeout: 5000 }).toString().trim();
    if (!path) return { installed: false, version: null, path: null };
    let version = null;
    try {
      version = execSync(`${name} --version 2>/dev/null`, { timeout: 5000 }).toString().trim().slice(0, 50);
    } catch { /* version optional */ }
    return { installed: true, version, path };
  } catch {
    return { installed: false, version: null, path: null };
  }
}

export async function GET() {
  const opencode = checkBinary('opencode');
  const claude = checkBinary('claude');

  return NextResponse.json({
    opencode: {
      ...opencode,
      provider: 'ForgeOS AI (default)',
      sessionId: 'forgeos-opencode',
    },
    claudeCode: {
      ...claude,
      provider: 'Anthropic (own auth)',
      sessionId: 'forgeos-claude',
    },
    ptyServer: {
      port: 3457,
      // PTY server status would be checked here when implemented
      available: false,
      note: 'PTY terminal server not running — start with: cd services/terminal && npm start',
    },
  });
}
