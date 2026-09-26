import { z } from "zod";
import { AiRouteError, complete, creditInfo, guard } from "@/lib/ai";
import { REFINE_SYSTEM, refineUserMessage } from "@/lib/ai-prompts";
import { apiError, apiJson, gate, preflight } from "@/lib/api-http";

export const runtime = "nodejs";

const Body = z.object({
  prompt: z.string().min(50).max(60000),
  expertRole: z.string().max(120).default("expert"),
  lang: z.enum(["TR", "EN"]).default("EN"),
  format: z.string().max(40).default("Claude XML"),
});

/** POST /api/v1/refine — Claude improves a prompt. Needs an API key; spends the owner's AI credits. */
export async function POST(req: Request) {
  const g = await gate(req, "refine", { requireKey: true });
  if (!g.ok) return g.response;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("bad_request", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), 400, g.headers);
  try {
    const ctx = await guard(req, "refine", "api", { userId: g.identity!.userId });
    const text = await complete(ctx, REFINE_SYSTEM, refineUserMessage(parsed.data));
    return apiJson({ data: { text, ...creditInfo(ctx) } }, 200, g.headers);
  } catch (e) {
    if (e instanceof AiRouteError) return apiError(e.code, e.message, e.status, g.headers);
    console.error("[api:refine]", e);
    return apiError("ai_failed", "The AI call failed. Your credits were not used — please try again.", 502, g.headers);
  }
}

export const OPTIONS = preflight;
