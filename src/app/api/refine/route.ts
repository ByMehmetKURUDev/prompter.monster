import { z } from "zod";
import { creditHeaders, errorResponse, guard, requestLang, streamText } from "@/lib/ai";

export const runtime = "nodejs";

const Body = z.object({
  prompt: z.string().min(50).max(60000),
  expertRole: z.string().max(120).default("expert"),
  lang: z.enum(["TR", "EN"]).default("TR"),
  format: z.string().max(40).default("Claude XML"),
});

const SYSTEM = `You are a world-class prompt engineer. You receive a structured build prompt written for an AI coding assistant and you return a strictly better version of the SAME prompt: keep its structure, tags/headings and format exactly; make the task section concrete and ordered; add missing acceptance criteria, edge cases and non-functional requirements; remove vagueness; keep every fact the user supplied. Never answer the prompt — only improve it. Return only the improved prompt.`;

export async function POST(req: Request) {
  try {
    const b = Body.parse(await req.json());
    const ctx = await guard(req, "refine", req.headers.get("x-pm-source") || "web");
    const stream = streamText(
      ctx,
      SYSTEM,
      `Format: ${b.format}. Output language: ${b.lang === "TR" ? "Turkish (keep English technical terms)" : "English"}. Expert persona: ${b.expertRole}.\n\n<prompt_to_improve>\n${b.prompt}\n</prompt_to_improve>`,
    );
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...creditHeaders(ctx) },
    });
  } catch (e) {
    return errorResponse(e, requestLang(req));
  }
}
