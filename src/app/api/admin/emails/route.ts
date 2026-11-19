import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireAdminApi } from "@/lib/admin";
import { sameOrigin } from "@/lib/api-keys-server";
import { emailConfigFrom, emailRpc, runLifecycleEmails, sendViaResend } from "@/lib/email/lifecycle";
import { renderLifecycleEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("test"), kind: z.enum(["welcome", "nudge"]), locale: z.enum(["tr", "en"]) }),
  z.object({ action: z.literal("run") }),
]);

/**
 * Admin → E-postalar (0023).
 *  test — sends one template to the signed-in admin's own address (subject prefixed "[Test]"; not logged as a lifecycle send).
 *  run  — what the hourly cron does, right now (at most 10 per kind).
 */
export async function POST(req: Request) {
  const ctx = await requireAdminApi();
  if (isResponse(ctx)) return ctx;
  if (!sameOrigin(req)) return NextResponse.json({ error: "bad_origin" }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const cfg = emailConfigFrom(process.env);
  if (!cfg) {
    return NextResponse.json(
      { error: "not_configured", message: "RESEND_API_KEY tanımlı değil ya da LIFECYCLE_EMAILS = off — e-postalar kapalı." },
      { status: 409 },
    );
  }

  if (parsed.data.action === "run") {
    const results = await runLifecycleEmails(cfg, { limit: 10 });
    return NextResponse.json({ ok: true, results });
  }

  const { kind, locale } = parsed.data;
  const to = ctx.user.email;
  if (!to) return NextResponse.json({ error: "no_email", message: "Hesabında e-posta adresi yok." }, { status: 400 });
  try {
    const token = await emailRpc<string>(cfg, "email_token_for", { p_user: ctx.user.id });
    const { data: prof } = await ctx.supabase.from("profiles").select("display_name").eq("id", ctx.user.id).maybeSingle<{ display_name: string | null }>();
    const mail = renderLifecycleEmail(kind, { name: prof?.display_name ?? null, locale, token }, cfg.siteUrl);
    const out = await sendViaResend(cfg, {
      to,
      subject: `[Test] ${mail.subject}`,
      html: mail.html,
      text: mail.text,
      oneClickUrl: mail.oneClickUrl,
      tags: { category: "lifecycle-test", kind, locale },
      idempotencyKey: `lifecycle-test-${kind}-${locale}-${ctx.user.id}-${Date.now()}`,
    });
    return out.ok ? NextResponse.json({ ok: true, id: out.id ?? null, to }) : NextResponse.json({ ok: false, error: "send_failed", message: out.error }, { status: 502 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "failed", message: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
