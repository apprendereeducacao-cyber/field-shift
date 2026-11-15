// Simple in-memory sliding-window limiter, per client IP. It lives in the function
// instance's memory, so it is per instance, not global: enough to stop a single client
// from running up the Anthropic bill during judging. Pair it with a monthly spend cap
// in the Anthropic console.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;
const hits = new Map<string, number[]>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Returns the seconds to wait when the client is over the limit, or 0 when allowed. */
export function rateLimit(key: string, now = Date.now()): number {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    // keep memory bounded: drop the oldest keys
    for (const k of Array.from(hits.keys()).slice(0, 5_000)) hits.delete(k);
  }
  return 0;
}
