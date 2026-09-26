/** HTTP plumbing shared by /api/v1/* and /api/mcp: CORS, errors, key auth, per-minute rate limit. */
import { NextResponse } from "next/server";
import { logApiCall, resolveApiKey, type ApiIdentity } from "./api-keys";
import { SITE } from "./api-core";
import { clientKey, consumeWindow } from "./ratelimit";
import { readServerSettings } from "./settings-server";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Api-Key, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID, Accept",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Credits-Remaining, WWW-Authenticate",
};

export function apiJson(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store", ...headers } });
}

export function apiError(code: string, message: string, status = 400, headers: Record<string, string> = {}) {
  return apiJson({ error: { code, message } }, status, headers);
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: { ...CORS_HEADERS, "Access-Control-Max-Age": "86400" } });
}

/** A refusal before the endpoint runs (flag off, bad key, rate limit). Each transport renders it its own way. */
export interface GateError {
  status: number;
  code: string;
  message: string;
  headers: Record<string, string>;
}

export type Authz = { ok: true; identity: ApiIdentity | null } | { ok: false; error: GateError };

const KEYS_URL = `${SITE}/account/api`;

/** Feature flags + optional API key. requireKey: endpoints that spend credits or touch account data. */
export async function authorize(req: Request, kind: "api" | "mcp", opts: { requireKey?: boolean } = {}): Promise<Authz> {
  const s = await readServerSettings();
  const fail = (status: number, code: string, message: string, headers: Record<string, string> = {}): Authz => ({ ok: false, error: { status, code, message, headers } });
  if (s.maintenance_mode) return fail(503, "maintenance", "Prompt.Monster is in maintenance mode. Please try again shortly.");
  if (kind === "api" && !s.api_enabled) return fail(503, "api_disabled", "The public API is temporarily disabled.");
  if (kind === "mcp" && !s.mcp_enabled) return fail(503, "mcp_disabled", "The MCP server is temporarily disabled.");

  let id: Awaited<ReturnType<typeof resolveApiKey>>;
  try {
    id = await resolveApiKey(req);
  } catch (e) {
    console.error("[api:key]", e);
    return fail(503, "auth_unavailable", "Could not verify the API key right now. Please retry in a moment.", { "Retry-After": "10" });
  }
  if (id === "invalid") {
    return fail(401, "invalid_key", `Invalid or revoked API key. Create a new one at ${KEYS_URL}`, {
      "WWW-Authenticate": 'Bearer realm="prompter.monster", error="invalid_token"',
    });
  }
  if (id?.banned) return fail(403, "banned", "This account is suspended. Support: hello@prompter.monster");
  if (!id && opts.requireKey) {
    return fail(401, "key_required", `This endpoint needs an API key: "Authorization: Bearer pm_live_…". Create one at ${KEYS_URL}`, {
      "WWW-Authenticate": 'Bearer realm="prompter.monster"',
    });
  }
  return { ok: true, identity: id };
}

/** Per-minute window: 30/min per key, 10/min per IP without a key (both editable in the admin settings). */
export async function limitRate(req: Request, identity: ApiIdentity | null): Promise<{ ok: true; headers: Record<string, string> } | { ok: false; error: GateError }> {
  const s = await readServerSettings();
  const limit = identity ? Number(s.api_rate_per_minute) || 30 : Number(s.api_anon_rate_per_minute) || 10;
  const rl = await consumeWindow(identity ? `key:${identity.keyId}` : `api:${clientKey(req)}`, limit, 60);
  const headers = { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(rl.remaining), "X-RateLimit-Reset": String(rl.reset) };
  if (!rl.ok) {
    return {
      ok: false,
      error: {
        status: 429,
        code: "rate_limited",
        message: `Too many requests — ${limit} per minute${identity ? "" : " without an API key"}. Retry in ${rl.reset}s.`,
        headers: { ...headers, "Retry-After": String(rl.reset) },
      },
    };
  }
  return { ok: true, headers };
}

export type Gate = { ok: true; identity: ApiIdentity | null; headers: Record<string, string> } | { ok: false; response: NextResponse };

/** REST endpoints: authorize + count the request. `name` labels the endpoint in the admin API statistics. */
export async function gate(req: Request, name: string, opts: { requireKey?: boolean } = {}): Promise<Gate> {
  const a = await authorize(req, "api", opts);
  if (!a.ok) return { ok: false, response: apiError(a.error.code, a.error.message, a.error.status, a.error.headers) };
  const r = await limitRate(req, a.identity);
  if (!r.ok) return { ok: false, response: apiError(r.error.code, r.error.message, r.error.status, r.error.headers) };
  logApiCall("api", name, Boolean(a.identity));
  return { ok: true, identity: a.identity, headers: r.headers };
}
