const windows = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request is allowed.
 * If increment=true (default), counts this call against the limit.
 * If increment=false, only checks without counting (use recordFailure to count later).
 */
export function rateLimit(key: string, max: number, windowMs: number, increment = true): boolean {
  const now = Date.now();
  const win = windows.get(key);

  if (!win || now > win.resetAt) {
    if (increment) windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (win.count >= max) return false;
  if (increment) win.count++;
  return true;
}

/** Increment the failure counter for a key without checking the limit. */
export function recordFailure(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const win = windows.get(key);
  if (!win || now > win.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    win.count = Math.min(win.count + 1, max);
  }
}

export function getClientIp(xForwardedFor: string | null): string {
  if (!xForwardedFor) return "unknown";
  return xForwardedFor.split(",")[0].trim();
}
