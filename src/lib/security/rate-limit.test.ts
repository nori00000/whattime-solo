import { describe, expect, it } from "vitest";

import { createRateLimiter, getClientIp } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the max within the window", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 1).allowed).toBe(true);
    expect(limiter.check("ip", 2).allowed).toBe(true);
  });

  it("blocks the request that exceeds the max within the window", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });

    limiter.check("ip", 0);
    limiter.check("ip", 1);
    limiter.check("ip", 2);

    const blocked = limiter.check("ip", 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("keys buckets independently per client", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });

    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 1).allowed).toBe(false);
    expect(limiter.check("b", 1).allowed).toBe(true);
  });

  it("recovers after the window slides past old hits", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });

    expect(limiter.check("ip", 0).allowed).toBe(true);
    expect(limiter.check("ip", 30_000).allowed).toBe(false);
    // First hit at t=0 falls outside the 60s window at t=60_001.
    expect(limiter.check("ip", 60_001).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("reads the first entry of x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });

    expect(getClientIp(request)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when forwarded-for is absent", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.7" },
    });

    expect(getClientIp(request)).toBe("198.51.100.7");
  });

  it("falls back to a shared bucket when no proxy header is present", () => {
    const request = new Request("http://localhost");

    expect(getClientIp(request)).toBe("unknown");
  });
});
