import { NextResponse } from "next/server";
import { z } from "zod";
import { complete, errorResponse, guard } from "@/lib/ai";
import { STACK } from "@/lib/data";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().max(120).default(""),
  pitch: z.string().max(300).default(""),
  description: z.string().max(4000).default(""),
  projectType: z.string().max(60).default(""),
  features: z.array(z.string().max(80)).max(60).default([]),
});

const SYSTEM = `You are a pragmatic staff engineer choosing a tech stack for a solo founder or small team. Pick ONLY from the allowed options given. Prefer boring, well-documented, cheap-to-run choices unless the product clearly needs otherwise. Return strict JSON matching the schema — no prose.`;

export async function POST(req: Request) {
  try {
    const { remaining } = await guard(req, "suggest");
    const b = Body.parse(await req.json());

    const allowed = Object.entries(STACK)
      .map(([k, v]) => `${k}: ${v.join(" | ")}`)
      .join("\n");

    const raw = await complete(
      SYSTEM,
      [
        `Project: ${b.name} — ${b.pitch}`,
        `Type: ${b.projectType}`,
        `Description: ${b.description}`,
        `Planned features: ${b.features.join(", ") || "(none yet)"}`,
        ``,
        `Allowed options (choose 1–3 per category, exact strings):`,
        allowed,
        ``,
        `Schema: {"frontend":[],"backend":[],"database":[],"auth":[],"ai":[],"realtime":[],"search":[],"why":"one sentence"}`,
      ].join("\n"),
      700,
    );

    const json = raw.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
    const parsed = JSON.parse(json) as Record<string, unknown>;

    // Keep only values that exist in the allowed lists.
    const picks: Record<string, string[]> = {};
    for (const key of Object.keys(STACK) as (keyof typeof STACK)[]) {
      const arr = Array.isArray(parsed[key]) ? (parsed[key] as unknown[]) : [];
      picks[key] = arr.filter((x): x is string => typeof x === "string" && (STACK[key] as readonly string[]).includes(x));
    }
    return NextResponse.json({ picks, why: typeof parsed.why === "string" ? parsed.why : "", remaining });
  } catch (e) {
    return errorResponse(e);
  }
}
