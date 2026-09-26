import { apiError, apiJson, gate, preflight } from "@/lib/api-http";
import { typePreset } from "@/lib/api-core";

export const runtime = "nodejs";

/** GET /api/v1/types/{id} — the preset the Studio applies for a project type. No key required. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await gate(req, "types.preset");
  if (!g.ok) return g.response;
  const { id } = await params;
  const preset = typePreset(id);
  if (!preset) return apiError("not_found", `Unknown project type "${id}".`, 404, g.headers);
  return apiJson({ data: preset }, 200, g.headers);
}

export const OPTIONS = preflight;
