import { loadCatalog } from "@/lib/catalog-server";
import { llmsTxt } from "@/lib/docs";

export const dynamic = "force-dynamic";

/** /llms.txt — machine-readable guide for AI agents (llmstxt.org convention). */
export async function GET() {
  await loadCatalog();
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
