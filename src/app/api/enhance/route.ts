import { NextResponse } from "next/server";
import { z } from "zod";
import { complete, errorResponse, guard } from "@/lib/ai";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().max(120).default(""),
  pitch: z.string().max(300).default(""),
  description: z.string().max(4000).default(""),
  projectType: z.string().max(60).default(""),
  lang: z.enum(["TR", "EN"]).default("TR"),
});

const SYSTEM = `You are a senior product strategist. You rewrite rough product descriptions into a crisp, concrete vision paragraph (90–140 words) that a CTO, a designer and an investor would all understand. Keep the founder's intent and named references. No headings, no bullet points, no preamble — return only the paragraph.`;

export async function POST(req: Request) {
  try {
    const { remaining } = await guard(req, "enhance");
    const b = Body.parse(await req.json());
    const text = await complete(
      SYSTEM,
      [
        `Language of the output: ${b.lang === "TR" ? "Turkish" : "English"}.`,
        `Project name: ${b.name || "(unnamed)"}`,
        `One-line pitch: ${b.pitch || "(none)"}`,
        `Project type: ${b.projectType || "(none)"}`,
        `Current description:\n${b.description || "(empty — write one from the pitch)"}`,
      ].join("\n"),
      600,
    );
    return NextResponse.json({ text, remaining });
  } catch (e) {
    return errorResponse(e);
  }
}
