import { NextResponse } from "next/server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Lifecycle e-mail opt-out (migration 0023). The token is email_prefs.token (random, per user).
 *  POST ?t=… with "List-Unsubscribe=One-Click" — RFC 8058 one-click from the mail client: plain 200, no page.
 *  POST form (t, a = out | in, l = tr | en) — the button on /unsubscribe; redirects back with the result.
 *  GET ?t=… — never changes anything (link scanners prefetch GETs): redirects to the confirm page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get("t") ?? "";
  return NextResponse.redirect(new URL(UUID.test(t) ? `/unsubscribe?t=${t}` : "/unsubscribe", url.origin), 303);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("t") ?? "";
  let action: "out" | "in" = "out";
  let locale: "tr" | "en" = "tr";
  let fromPage = false;

  const ctype = req.headers.get("content-type") ?? "";
  if (ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (form?.has("t")) {
      fromPage = true;
      token = String(form.get("t") ?? "");
      action = form.get("a") === "in" ? "in" : "out";
      locale = form.get("l") === "en" ? "en" : "tr";
    }
  }

  const back = (q: string) =>
    NextResponse.redirect(new URL(`${locale === "en" ? "/en" : ""}/unsubscribe?${UUID.test(token) ? `t=${token}&` : ""}${q}`, url.origin), 303);

  if (!UUID.test(token)) return fromPage ? back("error=invalid") : new NextResponse("Invalid unsubscribe link", { status: 400 });
  if (!adminConfigured()) return fromPage ? back("error=unavailable") : new NextResponse("Unavailable", { status: 503 });

  const { data, error } = await createAdminClient().rpc("email_unsubscribe", { p_token: token, p_out: action === "out" });
  if (error) {
    console.error("[unsubscribe]", error.message);
    return fromPage ? back("error=unavailable") : new NextResponse("Unavailable", { status: 503 });
  }
  const found = data === true;
  if (!fromPage) return new NextResponse(found ? "Unsubscribed" : "Unknown unsubscribe link", { status: found ? 200 : 404 });
  return back(found ? `done=${action}` : "error=invalid");
}
