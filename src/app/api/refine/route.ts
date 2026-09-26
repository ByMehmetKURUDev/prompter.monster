import { z } from "zod";
import { creditHeaders, errorResponse, guard, requestLang, streamText } from "@/lib/ai";
import { REFINE_SYSTEM, refineUserMessage } from "@/lib/ai-prompts";

export const runtime = "nodejs";

const Body = z.object({
  prompt: z.string().min(50).max(60000),
  expertRole: z.string().max(120).default("expert"),
  lang: z.enum(["TR", "EN"]).default("TR"),
  format: z.string().max(40).default("Claude XML"),
});



export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const ctx = await guard(req, "refine", req.headers.get("x-pm-source") || "web");
    const stream = streamText(ctx, REFINE_SYSTEM, refineUserMessage(b));
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...creditHeaders(ctx) },
    });
  } catch (e) {
    return errorResponse(e, requestLang(req));
  }
}
