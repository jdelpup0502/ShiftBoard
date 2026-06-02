const windows = new Map<string, { count: number; resetAt: number }>();

/**
 * Sliding-window rate limiter backed by an in-memory map.
 * Safe for single-instance deployments (Railway + SQLite).
 * Returns true if the request is allowed, false if rate-limited.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const win = windows.get(key);

  if (!win || now > win.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (win.count >= max) return false;
  win.count++;
  return true;
}

export function getClientIp(xForwardedFor: string | null): string {
  if (!xForwardedFor) return "unknown";
  return xForwardedFor.split(",")[0].trim();
}
