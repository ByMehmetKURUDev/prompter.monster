import { apiJson, gate, preflight } from "@/lib/api-http";
import { listTypes } from "@/lib/api-core";

export const runtime = "nodejs";

/** GET /api/v1/types?lang=EN|TR — project types with their landing pages. No key required. */
export async function GET(req: Request) {
  const g = await gate(req, "types");
  if (!g.ok) return g.response;
  const lang = new URL(req.url).searchParams.get("lang")?.toUpperCase() === "TR" ? "TR" : "EN";
  return apiJson({ data: listTypes(lang) }, 200, g.headers);
}

export const OPTIONS = preflight;
