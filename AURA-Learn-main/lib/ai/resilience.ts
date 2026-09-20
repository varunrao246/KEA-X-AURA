/**
 * Keeps a flaky or slow AI service from ever slowing down or breaking learning.
 *  - CircuitBreaker: after a few failures in a row, stop calling the model for a while and go straight to the built-in themes.
 *  - RateLimiter: caps calls per student per minute, which also caps cost.
 */

export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  constructor(private opts: { threshold?: number; cooldownMs?: number; now?: () => number } = {}) {}

  private now() { return (this.opts.now ?? Date.now)(); }
  private get threshold() { return this.opts.threshold ?? 3; }
  private get cooldown() { return this.opts.cooldownMs ?? 60_000; }

  get state(): "closed" | "open" {
    if (this.openedAt === null) return "closed";
    if (this.now() - this.openedAt >= this.cooldown) return "closed"; // half-open: allow a trial call
    return "open";
  }

  canCall() { return this.state === "closed"; }
  success() { this.failures = 0; this.openedAt = null; }
  failure() {
    this.failures++;
    if (this.failures >= this.threshold) this.openedAt = this.now();
  }
}

export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private opts: { max: number; windowMs?: number; now?: () => number }) {}

  allow(key: string): boolean {
    const now = (this.opts.now ?? Date.now)();
    const windowMs = this.opts.windowMs ?? 60_000;
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= this.opts.max) { this.hits.set(key, recent); return false; }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
