import { NextResponse } from "next/server";
import { isResponse, requireAdminApi } from "@/lib/admin";
import { anthropic, hasApiKey } from "@/lib/ai";
import { resolveModel } from "@/lib/settings-server";

export const runtime = "nodejs";

/** POST /api/admin/ai-test?plan=free|pro — one tiny request to that plan's model (does not touch user credits). */
export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  if (!hasApiKey()) return NextResponse.json({ ok: false, message: "ANTHROPIC_API_KEY tanımlı değil (Cloudflare → Variables and Secrets)." }, { status: 503 });
  const plan = new URL(req.url).searchParams.get("plan") === "free" ? "free" : "pro";
  const model = await resolveModel(plan);
  const t0 = Date.now();
  try {
    const res = await anthropic().messages.create({
      model,
      max_tokens: 40,
      messages: [{ role: "user", content: "Tek kelimeyle yanıtla: Prompt.Monster'ın maskotu ne?" }],
    });
    const reply = res.content.map((c) => ("text" in c ? c.text : "")).join("").trim();
    return NextResponse.json({ ok: true, model, reply, ms: Date.now() - t0, usage: res.usage });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, model, message: `Model çağrısı başarısız: ${msg}` }, { status: 502 });
  }
}
