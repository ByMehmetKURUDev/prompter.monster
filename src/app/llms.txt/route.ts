import { llmsTxt } from "@/lib/docs";

/** /llms.txt — machine-readable guide for AI agents (llmstxt.org convention). */
export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
