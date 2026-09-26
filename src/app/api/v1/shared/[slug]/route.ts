import { apiError, apiJson, gate, preflight } from "@/lib/api-http";
import { getShared } from "@/lib/share";

export const runtime = "nodejs";

/** GET /api/v1/shared/{slug} — a public shared prompt (/p/{slug}) as JSON. No key required. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const g = await gate(req, "shared");
  if (!g.ok) return g.response;
  const { slug } = await params;
  const s = await getShared(slug);
  if (!s) return apiError("not_found", "Shared prompt not found.", 404, g.headers);
  return apiJson(
    { data: { slug: s.slug, name: s.name, projectType: s.project_type, version: s.version, format: s.format, lang: s.lang, experts: s.experts, prompt: s.output, createdAt: s.created_at } },
    200,
    g.headers,
  );
}

export const OPTIONS = preflight;
