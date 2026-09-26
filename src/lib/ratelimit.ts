/**
 * Per-IP daily credit counter for visitors who are not signed in.
 *
 * Production (Cloudflare Workers): counters live in the RATE_LIMIT KV namespace (see wrangler.jsonc),
 * keyed by day + IP, and expire after 48 hours (the privacy policy promises no longer).
 * Local `next dev` / `next start` without bindings: in-memory fallback.
 * Signed-in users are metered in Postgres instead (consume_ai_call).
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Minimal KV surface we use (avoids depending on generated Cloudflare types). */
interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

type Bucket = { day: string; count: number };
const memory = new Map<string, Bucket>();
const TTL = 60 * 60 * 48;

function today(): string {
  return new Date().toISOString().slice(0, 10);
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

export type ConsumeResult = { ok: boolean; remaining: number; limit: number; used: number };

/** Credits already used today by `key`. */
export async function peek(key: string): Promise<number> {
  const store = kv();
  if (store) return Number((await store.get(`rl:${today()}:${key}`)) ?? 0);
  const b = memory.get(key);
  return b && b.day === today() ? b.count : 0;
}

/** Spends `cost` credits for `key` when that stays within `limit` (KV is eventually consistent — a soft quota). */
export async function consume(key: string, cost = 1, limit = 3): Promise<ConsumeResult> {
  const d = today();
  const store = kv();
  if (store) {
    const k = `rl:${d}:${key}`;
    const used = Number((await store.get(k)) ?? 0);
    if (used + cost > limit) return { ok: false, remaining: Math.max(0, limit - used), limit, used };
    await store.put(k, String(used + cost), { expirationTtl: TTL });
    return { ok: true, remaining: limit - used - cost, limit, used: used + cost };
  }
  const b = memory.get(key);
  const used = b && b.day === d ? b.count : 0;
  if (used + cost > limit) return { ok: false, remaining: Math.max(0, limit - used), limit, used };
  memory.set(key, { day: d, count: used + cost });
  return { ok: true, remaining: limit - used - cost, limit, used: used + cost };
}

/** Gives credits back after a failed AI call. */
export async function refund(key: string, cost: number): Promise<void> {
  const d = today();
  const store = kv();
  if (store) {
    const k = `rl:${d}:${key}`;
    const used = Number((await store.get(k)) ?? 0);
    await store.put(k, String(Math.max(0, used - cost)), { expirationTtl: TTL });
    return;
  }
  const b = memory.get(key);
  if (b && b.day === d) b.count = Math.max(0, b.count - cost);
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export function clientKey(req: Request): string {
  return `ip:${clientIp(req)}`;
}

/**
 * Irreversible, day-scoped IP digest for usage statistics (the raw IP is never stored in the database).
 * The daily salt means the same visitor cannot be linked across days.
 */
export async function ipHash(req: Request): Promise<string> {
  const salt = process.env.IP_HASH_SALT || process.env.NEXT_PUBLIC_SUPABASE_URL || "prompt-monster";
  const data = new TextEncoder().encode(`${today()}|${clientIp(req)}|${salt}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
