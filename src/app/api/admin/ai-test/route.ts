import { NextResponse } from "next/server";
import { isResponse, requireAdminApi } from "@/lib/admin";
import { anthropic, hasApiKey } from "@/lib/ai";
import { resolveModel } from "@/lib/settings-server";

export const runtime = "nodejs";

/** POST /api/admin/ai-test — one tiny request to the configured model (does not touch user quotas). */
export async function POST() {
  const admin = await requireAdminApi();
  if (isResponse(admin)) return admin;
  if (!hasApiKey()) return NextResponse.json({ ok: false, message: "ANTHROPIC_API_KEY tanımlı değil (Cloudflare → Variables and Secrets)." }, { status: 503 });
  const model = await resolveModel();
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
