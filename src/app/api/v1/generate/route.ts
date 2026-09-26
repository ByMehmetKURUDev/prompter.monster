import { ApiInputError, GenerateInput, generate } from "@/lib/api-core";
import { apiError, apiJson, gate, preflight } from "@/lib/api-http";

export const runtime = "nodejs";

/**
 * POST /api/v1/generate — build the master prompt from structured input (deterministic, no AI credits).
 * Key optional: without a key the Free plan limits apply (3 experts, Markdown/XML formats, no file exports).
 */
export async function POST(req: Request) {
  const g = await gate(req, "generate");
  if (!g.ok) return g.response;
  const body = await req.json().catch(() => null);
  const parsed = GenerateInput.safeParse(body);
  if (!parsed.success) {
    return apiError("bad_request", parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; "), 400, g.headers);
  }
  try {
    const result = generate(parsed.data, g.identity?.plan ?? "free");
    return apiJson({ data: result }, 200, g.headers);
  } catch (e) {
    if (e instanceof ApiInputError) return apiError(e.code, e.message, e.status, g.headers);
    console.error("[api:generate]", e);
    return apiError("internal", "Generation failed.", 500, g.headers);
  }
}

export const OPTIONS = preflight;
