/**
 * API keys for the public API (/api/v1) and the MCP server (/api/mcp). Server-only.
 * Format: pm_live_<32 base62 chars>. Only the SHA-256 hash and a short prefix are stored.
 */
import { background } from "./background";
import { adminConfigured, createAdminClient } from "./supabase/admin";

export const KEY_PREFIX = "pm_live_";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const MAX_ACTIVE_KEYS = 5;

export function generateApiKey(): string {
  // Rejection sampling keeps every character uniformly likely (256 is not a multiple of 62).
  const out: string[] = [];
  while (out.length < 32) {
    const bytes = new Uint8Array(48);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < 248 && out.length < 32) out.push(ALPHABET[b % 62]);
    }
  }
  return `${KEY_PREFIX}${out.join("")}`;
}

export async function hashApiKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** What the UI shows for a key: "pm_live_Ab12…". */
export function displayPrefix(key: string): string {
  return key.slice(0, KEY_PREFIX.length + 4);
}

/** Bearer token from Authorization (or x-api-key) header, when it looks like one of our keys. */
export function bearerKey(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  const m = /^Bearer\s+(\S+)$/i.exec(auth.trim());
  const key = (m?.[1] || req.headers.get("x-api-key") || "").trim();
  return key.startsWith(KEY_PREFIX) && key.length >= KEY_PREFIX.length + 20 && key.length <= 80 ? key : null;
}

export interface ApiIdentity {
  keyId: string;
  userId: string;
  plan: "free" | "pro";
  banned: boolean;
}

export class ApiKeyLookupError extends Error {}

/**
 * Resolves the caller's key → owner (and counts the request on the key, atomically, in resolve_api_key).
 * Returns null for no key, "invalid" for an unknown/revoked key; throws ApiKeyLookupError when the database is unreachable.
 */
export async function resolveApiKey(req: Request): Promise<ApiIdentity | null | "invalid"> {
  const key = bearerKey(req);
  if (!key) {
    const auth = req.headers.get("authorization") || req.headers.get("x-api-key");
    return auth ? "invalid" : null;
  }
  if (!adminConfigured()) throw new ApiKeyLookupError("service role not configured");
  const { data, error } = await createAdminClient()
    .rpc("resolve_api_key", { p_hash: await hashApiKey(key) })
    .maybeSingle<{ key_id: string; owner_id: string; plan: string; banned: boolean }>();
  if (error) throw new ApiKeyLookupError(error.message);
  if (!data) return "invalid";
  return { keyId: data.key_id, userId: data.owner_id, plan: data.plan === "pro" ? "pro" : "free", banned: Boolean(data.banned) };
}

/** Daily per-endpoint/tool counters for the admin panel (fire-and-forget). */
export function logApiCall(kind: "api" | "mcp", name: string, keyed: boolean): void {
  if (!adminConfigured()) return;
  background(createAdminClient().rpc("log_api_call", { p_kind: kind, p_name: name.slice(0, 60), p_keyed: keyed }));
}
