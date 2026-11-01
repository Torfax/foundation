/**
 * Express `trust proxy`, from one environment variable.
 *
 * Behind a reverse proxy every request arrives from the proxy: without this, `req.ip` is the
 * proxy for everybody, `req.protocol` is `http`, and nothing a `X-Forwarded-*` header says is
 * believed. Empty, `false` or `0` = the process is reached directly; `true` = one hop; a
 * number = that many hops; anything else (`loopback`, a CIDR list) passes through as Express
 * documents it.
 */
export function parseTrustProxy(value: string | undefined): boolean | number | string | undefined {
  if (value === undefined || value === '' || value === 'false' || value === '0') return undefined;
  if (value === 'true') return 1;
  return /^\d+$/.test(value) ? Number(value) : value;
}

/**
 * The browser origins allowed to call a service on another origin (CORS).
 *
 * Built from settings the service already has, so the list is not one more thing to
 * remember: `webUrl` is the human interface's address (for Torfax, Blue's), and `extra` is a
 * comma-separated list (`CORS_ORIGINS`). Only origins: a path is cut, and a value that is not
 * a URL is dropped rather than allowed by accident. Nothing configured = nothing allowed.
 */
export function browserOrigins(webUrl: unknown, extra?: unknown): Set<string> {
  const origins = new Set<string>();
  for (const raw of [String(webUrl ?? ''), ...String(extra ?? '').split(',')]) {
    const value = raw.trim();
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      // Not a URL.
    }
  }
  return origins;
}

/**
 * Whether a path belongs to the API, given the prefixes that are API on this origin. By
 * segments, not by text: `/v1x` is not `/v1`. A service that serves a web interface from the
 * same origin uses it to tell an API 404 (an envelope) from a page only the client router
 * knows (the interface's `index.html`).
 */
export function isApiPath(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`));
}
