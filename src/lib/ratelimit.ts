/**
 * Minimal per-IP daily rate limiter for the AI endpoints.
 *
 * Faz 1: in-memory (resets on every deploy / cold start — fine for a single
 * Vercel region and a free tier). Faz 2 replaces this with a Supabase or
 * Upstash-backed counter tied to the user's account and plan.
 */

type Bucket = { day: string; count: number };
const buckets = new Map<string, Bucket>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dailyLimit(): number {
  const n = Number(process.env.FREE_AI_CALLS_PER_DAY ?? 3);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

/** Returns { ok, remaining }. Consumes one call when ok. */
export function consume(key: string): { ok: boolean; remaining: number; limit: number } {
  const limit = dailyLimit();
  const d = today();
  const b = buckets.get(key);
  if (!b || b.day !== d) {
    buckets.set(key, { day: d, count: 1 });
    return { ok: true, remaining: limit - 1, limit };
  }
  if (b.count >= limit) return { ok: false, remaining: 0, limit };
  b.count += 1;
  return { ok: true, remaining: limit - b.count, limit };
}

export function clientKey(req: Request): string {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "local";
  return `ip:${ip}`;
}
