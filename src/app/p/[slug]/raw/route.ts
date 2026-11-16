import { getShared } from "@/lib/share";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

/** Plain-text prompt body for AI-tool handoff (Claude Code's `prompt_url`). No auth, no HTML. */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const shared = await getShared(slug);
  if (!shared) return new Response("Not found", { status: 404 });
  return new Response(shared.output, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
