/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Deliberately dependency-free and process-local: the app is a single-instance
 * self-host, so a shared Map is sufficient to throttle abusive callers on the
 * unauthenticated public write routes. This is not a distributed limiter; if the
 * app is ever scaled horizontally, replace the store with a shared backend.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export type RateLimiter = {
  check: (key: string, now?: number) => RateLimitResult;
  reset: () => void;
};

type RateLimiterOptions = {
  windowMs: number;
  max: number;
};

export function createRateLimiter({ windowMs, max }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      const windowStart = now - windowMs;
      const timestamps = (hits.get(key) ?? []).filter((ts) => ts > windowStart);

      if (timestamps.length >= max) {
        hits.set(key, timestamps);
        const retryAfterMs = timestamps[0] + windowMs - now;
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: retryAfterMs > 0 ? retryAfterMs : 0,
        };
      }

      timestamps.push(now);
      hits.set(key, timestamps);

      return {
        allowed: true,
        remaining: max - timestamps.length,
        retryAfterMs: 0,
      };
    },
    reset() {
      hits.clear();
    },
  };
}

/**
 * Shared limiter for unauthenticated public write routes (booking create,
 * public cancel): 10 requests per minute per client IP.
 */
export const publicWriteRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
});

/**
 * Best-effort client IP extraction from proxy headers. Falls back to a shared
 * "unknown" bucket when no forwarding header is present (e.g. local dev), which
 * intentionally throttles anonymous callers together rather than failing open.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
