/**
 * Per-IP daily rate limiter for the AI endpoints.
 *
 * Production (Cloudflare Workers): counters live in the RATE_LIMIT KV namespace
 * (see wrangler.jsonc), so every isolate shares the same count.
 * Local `next dev` / `next start` without bindings: in-memory fallback.
 * Faz 2 ties the quota to the signed-in user's plan instead of the IP.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Minimal KV surface we use (avoids depending on generated Cloudflare types). */
interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

type Bucket = { day: string; count: number };
const memory = new Map<string, Bucket>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dailyLimit(): number {
  const n = Number(process.env.FREE_AI_CALLS_PER_DAY ?? 3);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

function kv(): KVLike | null {
  try {
    const { env } = getCloudflareContext() as unknown as { env: Record<string, unknown> };
    const ns = env?.RATE_LIMIT as KVLike | undefined;
    return ns && typeof ns.get === "function" ? ns : null;
  } catch {
    return null; // not running on Cloudflare (plain next dev / next start)
  }
}

export type ConsumeResult = { ok: boolean; remaining: number; limit: number };

/** Consumes one call for `key` when under the daily limit. */
export async function consume(key: string): Promise<ConsumeResult> {
  const limit = dailyLimit();
  const d = today();
  const store = kv();

  if (store) {
    const k = `rl:${d}:${key}`;
    const count = Number((await store.get(k)) ?? 0);
    if (count >= limit) return { ok: false, remaining: 0, limit };
    // KV is eventually consistent — good enough for a soft daily quota.
    await store.put(k, String(count + 1), { expirationTtl: 60 * 60 * 48 });
    return { ok: true, remaining: limit - count - 1, limit };
  }

  const b = memory.get(key);
  if (!b || b.day !== d) {
    memory.set(key, { day: d, count: 1 });
    return { ok: true, remaining: limit - 1, limit };
  }
  if (b.count >= limit) return { ok: false, remaining: 0, limit };
  b.count += 1;
  return { ok: true, remaining: limit - b.count, limit };
}

export function clientKey(req: Request): string {
  const h = req.headers;
  const ip =
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return `ip:${ip}`;
}
