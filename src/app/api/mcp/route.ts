import { NextResponse } from "next/server";
import { logApiCall } from "@/lib/api-keys";
import { CORS_HEADERS, authorize, limitRate, preflight } from "@/lib/api-http";
import { handleRpc, isRequest, rpcError, type RpcResponse, type ToolCtx } from "@/lib/mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Prompt.Monster MCP server — Streamable HTTP transport, stateless (no Mcp-Session-Id, no server-initiated stream).
 *   claude mcp add --transport http prompt-monster https://prompter.monster/api/mcp --header "Authorization: Bearer pm_live_…"
 * The key is optional: without one the Free plan applies and refine_prompt / export_files explain how to get one.
 */
function rpcHttp(body: RpcResponse | RpcResponse[], status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store", ...headers } });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return rpcHttp(rpcError(null, -32700, "Parse error: the body must be a JSON-RPC 2.0 message."), 400);
  }
  const batch = Array.isArray(body);
  const msgs = (batch ? body : [body]) as unknown[];
  if (!msgs.length) return rpcHttp(rpcError(null, -32600, "Invalid Request: empty batch."), 400);
  const requests = msgs.filter(isRequest);

  const auth = await authorize(req, "mcp");
  if (!auth.ok) {
    if (!requests.length) return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
    const code = auth.error.status === 401 || auth.error.status === 403 ? -32001 : -32002;
    const errs = requests.map((m) => rpcError(m.id ?? null, code, auth.error.message, { code: auth.error.code }));
    return rpcHttp(batch ? errs : errs[0], auth.error.status, auth.error.headers);
  }

  const ctx: ToolCtx = { req, identity: auth.identity };
  let headers: Record<string, string> = {};
  // Only tool calls count against the per-minute limit (initialize / tools/list are cheap and happen on every client start).
  if (requests.some((m) => m.method === "tools/call")) {
    const rl = await limitRate(req, auth.identity);
    headers = rl.ok ? rl.headers : rl.error.headers;
    if (!rl.ok) ctx.rateLimited = rl.error.message;
  }

  const out: RpcResponse[] = [];
  for (const m of msgs) {
    const res = await handleRpc(m, ctx);
    if (res) out.push(res);
    if (isRequest(m) && (m.method === "initialize" || m.method === "tools/call")) {
      const tool = m.method === "tools/call" ? String((m.params as { name?: unknown } | undefined)?.name ?? "?") : "initialize";
      logApiCall("mcp", tool, Boolean(auth.identity));
    }
  }
  if (!out.length) return new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  return rpcHttp(batch ? out : out[0], 200, headers);
}

/** No server-initiated SSE stream (stateless server) — per the spec, GET answers 405. */
export function GET() {
  return NextResponse.json(
    {
      error: {
        code: "method_not_allowed",
        message: "This is the Prompt.Monster MCP endpoint (Streamable HTTP). Send JSON-RPC via POST. Setup: https://prompter.monster/developers",
      },
    },
    { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" } },
  );
}

/** Stateless: there is no session to delete. */
export function DELETE() {
  return new NextResponse(null, { status: 405, headers: { ...CORS_HEADERS, Allow: "POST, OPTIONS" } });
}

export const OPTIONS = preflight;
