import { NextResponse } from "next/server";
import { z } from "zod";
import { complete, creditHeaders, creditInfo, errorResponse, guard, requestLang } from "@/lib/ai";
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
    const b = Body.parse(await req.json());
    const ctx = await guard(req, "suggest", req.headers.get("x-pm-source") || "web");

    const allowed = Object.entries(STACK)
      .map(([k, v]) => `${k}: ${v.join(" | ")}`)
      .join("\n");

    const raw = await complete(
      ctx,
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
    );

    const json = raw.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(json.slice(json.indexOf("{"), json.lastIndexOf("}") + 1)) as Record<string, unknown>;
    } catch {
      parsed = {}; // model answered with prose — return empty picks rather than failing after spending credits
    }

    // Keep only values that exist in the allowed lists.
    const picks: Record<string, string[]> = {};
    for (const key of Object.keys(STACK) as (keyof typeof STACK)[]) {
      const arr = Array.isArray(parsed[key]) ? (parsed[key] as unknown[]) : [];
      picks[key] = arr.filter((x): x is string => typeof x === "string" && (STACK[key] as readonly string[]).includes(x));
    }
    return NextResponse.json({ picks, why: typeof parsed.why === "string" ? parsed.why : "", ...creditInfo(ctx) }, { headers: creditHeaders(ctx) });
  } catch (e) {
    return errorResponse(e, requestLang(req));
  }
}
