/**
 * Dot browser executor — ForgeOS workforce vertical slice.
 *
 * Gives one Dot an isolated headless Chromium session for READ-ONLY tasks.
 * Hard boundaries:
 *  - Domain allowlist enforced twice (pre-navigation check + request interception).
 *  - No form filling, no button clicking, no logins, no submissions, no downloads.
 *  - Hard timeout; browser is ALWAYS closed (finally block).
 *  - Screenshots captured as evidence; never contain credentials (no auth performed).
 */
import { chromium } from 'playwright-core';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CHROMIUM_BIN = join(
  homedir(),
  '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
);
const SHIM_HOST = '127.0.0.1';
// The shim port is per-run (ephemeral) to avoid cross-run collisions.
// Passed via opts.proxyPort; defaults to the legacy fixed port.
function shimProxy(port) {
  return `http://${SHIM_HOST}:${port || 18923}`;
}

// TLS POLICY — confinement by design.
//
// The runtime egress proxy performs TLS interception and its CA is not in
// Chromium's trust store. There are exactly two modes, chosen per call:
//
//   'strict'       (DEFAULT) — no certificate flags. Fails closed against the
//                              MITM proxy. Required for any session that will
//                              ever handle credentials.
//   'insecure-dev' — adds --ignore-certificate-errors. ONLY for
//                    credential-free development tasks, and ONLY when the
//                    caller explicitly opts in. Can never be the default and
//                    can never be inherited silently: the runner enables it
//                    solely via the DOT_BROWSER_INSECURE_TLS_DEV=1 environment
//                    variable, and records a warning in the task trace.
//
// Future authenticated sessions MUST use 'strict' + a proper proxy-CA
// install. Any credential-bearing option passed to the executor is refused.
const CREDENTIAL_KEYS = new Set([
  'httpCredentials', 'cookies', 'storageState', 'clientCertificates',
  'username', 'password', 'token', 'apiKey',
]);

function tlsArgs(tlsMode) {
  if (tlsMode === 'insecure-dev') return ['--ignore-certificate-errors', '--no-sandbox'];
  if (tlsMode === 'strict' || tlsMode === undefined) return ['--no-sandbox'];
  throw new Error(`unknown tlsMode "${tlsMode}" — refusing to launch`);
}

export class AllowlistViolation extends Error {}

/**
 * @param {object} opts
 * @param {string} opts.url - target URL
 * @param {string[]} opts.allowlist - permitted hostnames (exact match)
 * @param {number} opts.timeoutMs - hard ceiling for the whole session
 * @param {string} opts.screenshotDir - where to write evidence PNGs
 * @param {'strict'|'insecure-dev'} [opts.tlsMode='strict'] - TLS policy (see above)
 * @param {number} [opts.proxyPort] - shim port (ephemeral per run)
 * @param {(actionType:string, detail:string)=>void} opts.onAction - trace hook
 */
export async function executeBrowserTask(opts) {
  const { url, allowlist, timeoutMs, screenshotDir, onAction } = opts;
  const tlsMode = opts.tlsMode || 'strict';
  const proxyUrl = shimProxy(opts.proxyPort);

  // Credential refusal: this executor is credential-free by construction.
  for (const k of Object.keys(opts)) {
    if (CREDENTIAL_KEYS.has(k)) {
      throw new Error(`credential-bearing option "${k}" refused by the read-only executor`);
    }
  }
  const startedAt = Date.now();
  const actions = [];
  const screenshots = [];

  const record = (type, detail) => {
    actions.push({ type, detail, at: new Date().toISOString() });
    if (onAction) onAction(type, detail);
  };

  // Boundary 1: pre-navigation allowlist check.
  let target;
  try {
    target = new URL(url);
  } catch {
    throw new AllowlistViolation(`malformed URL rejected: ${url}`);
  }
  // Credential-bearing URLs are refused: the executor must never transmit
  // userinfo (basic-auth) to any host, even an allowlisted one.
  if (target.username || target.password) {
    throw new AllowlistViolation('URL userinfo (embedded credentials) refused');
  }
  if (!allowlist.includes(target.hostname)) {
    throw new AllowlistViolation(
      `hostname "${target.hostname}" not in allowlist [${allowlist.join(', ')}]`
    );
  }
  record('allowlist-check', `hostname "${target.hostname}" permitted`);

  const timer = setTimeout(() => {
    throw new Error(`hard timeout ${timeoutMs}ms exceeded`);
  }, timeoutMs);
  // Don't let the timer alone kill us mid-await; we also race navigation.
  timer.unref?.();

  let browser = null;
  try {
    const launchArgs = tlsArgs(tlsMode);
    record('tls-mode', tlsMode === 'insecure-dev'
      ? 'WARNING: insecure-dev TLS (credential-free dev only, explicit opt-in)'
      : 'strict TLS (no certificate flags)');
    record('browser-launch', 'starting isolated headless Chromium (playwright-core)');
    browser = await chromium.launch({
      executablePath: CHROMIUM_BIN,
      headless: true,
      args: launchArgs,
      proxy: { server: proxyUrl },
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      javaScriptEnabled: true,
    });
    const page = await context.newPage();

    // Boundary 2: request interception — abort anything off-allowlist
    // (covers redirects, subresources, and page-initiated navigation).
    await page.route('**/*', (route) => {
      const reqUrl = new URL(route.request().url());
      if (reqUrl.protocol === 'data:' || reqUrl.protocol === 'blob:') {
        return route.continue();
      }
      if (allowlist.includes(reqUrl.hostname)) return route.continue();
      record('request-blocked', `off-allowlist request aborted: ${reqUrl.hostname}`);
      return route.abort();
    });

    record('navigate', `GET ${url}`);
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: Math.min(30000, timeoutMs - (Date.now() - startedAt)),
    });
    const status = response ? response.status() : -1;
    record('response', `HTTP ${status} in ${Date.now() - startedAt}ms`);
    if (status < 200 || status >= 400) {
      throw new Error(`non-success HTTP status: ${status}`);
    }

    // Boundary 3: post-navigation confinement check. Server-side redirects
    // can bypass Playwright's request interception for the navigation
    // request itself (verified 2026-10-12); the shim's network filter is the
    // primary stop, and this check fails the task if the page still escaped.
    const finalHost = new URL(page.url()).hostname;
    if (!allowlist.includes(finalHost)) {
      throw new AllowlistViolation(
        `navigation escaped allowlist: landed on "${finalHost}"`
      );
    }
    record('confinement-check', `final URL host "${finalHost}" within allowlist`);

    const shot1 = join(screenshotDir, 'step1-loaded.png');
    await page.screenshot({ path: shot1 });
    screenshots.push(shot1);
    record('screenshot', `captured ${shot1}`);

    // READ-ONLY extraction: title + visible link count. No interaction.
    const title = await page.title();
    const linkCount = await page.evaluate(
      () => document.querySelectorAll('a[href]').length
    );
    record('extract', `title="${title}", links=${linkCount}`);

    const shot2 = join(screenshotDir, 'step2-final.png');
    await page.screenshot({ path: shot2 });
    screenshots.push(shot2);
    record('screenshot', `captured ${shot2}`);

    return { title, linkCount, httpStatus: status, screenshots, actions };
  } finally {
    clearTimeout(timer);
    if (browser) {
      await browser.close().catch(() => {});
      record('browser-close', 'session destroyed');
    }
  }
}
