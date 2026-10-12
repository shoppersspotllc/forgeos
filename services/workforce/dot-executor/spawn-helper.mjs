/**
 * Spawn helper for the Dot browser executor — plain Node, NOT bundled.
 *
 * Loaded at RUNTIME by the Next.js API route via dynamic import with
 * `webpackIgnore: true`, so the bundler never traces it (it spawns a
 * sibling script via child_process, which Turbopack would otherwise try
 * to statically resolve and fail on).
 */
import { execFile } from 'node:child_process';

/**
 * @param {string} scriptPath absolute path to run-task.mjs
 * @param {string[]} args CLI args
 * @param {number} timeoutMs kill timeout
 * @returns {Promise<string>} stdout of the completed process
 */
export function spawnExecutor(scriptPath, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [scriptPath, ...args],
      { timeout: timeoutMs, maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          const e = new Error(`executor failed: ${err.message}`);
          e.stdout = stdout;
          e.stderr = stderr;
          e.code = err.code;
          reject(e);
          return;
        }
        resolve(stdout);
      }
    );
  });
}
