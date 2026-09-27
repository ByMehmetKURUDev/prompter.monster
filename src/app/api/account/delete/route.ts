import { NextResponse } from "next/server";
import { z } from "zod";
import { billingConfigured, cancelSubscription, isProStatus } from "@/lib/billing/lemonsqueezy";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Body = z.object({ confirm: z.string().trim() });
/** The word the user types to confirm (either language works). */
const CONFIRM_WORDS = new Set(["SİL", "SIL", "DELETE"]);

type Lang = "tr" | "en";
const MSG: Record<string, Record<Lang, string>> = {
  confirm: { tr: "Onaylamak için SİL yaz.", en: "Type DELETE to confirm." },
  admin: { tr: "Admin hesabı buradan silinemez. Önce admin yetkisini kaldır.", en: "Admin accounts can't be deleted here. Remove the admin role first." },
  unavailable: { tr: "Hesap silme şu an kullanılamıyor; hello@prompter.monster adresine yaz.", en: "Account deletion is unavailable right now; email hello@prompter.monster." },
  subscription: {
    tr: "Aktif aboneliğin iptal edilemedi. Önce Plan sayfasından aboneliği iptal et, sonra tekrar dene.",
    en: "We couldn't cancel your active subscription. Cancel it from the Plan page first, then try again.",
  },
  failed: { tr: "Hesap silinemedi, tekrar dene.", en: "The account couldn't be deleted, please try again." },
};

/**
 * POST /api/account/delete { confirm: "SİL" | "DELETE" } — permanently deletes the signed-in account.
 * Cancels an active Lemon Squeezy subscription first, then deletes the auth user; profiles, projects, versions,
 * share links, subscriptions and API keys cascade, AI usage rows are kept without the owner (anonymous statistics).
 */
export async function POST(req: Request) {
  const lang: Lang = req.headers.get("x-pm-locale") === "en" ? "en" : "tr";
  const fail = (key: keyof typeof MSG, status: number) => NextResponse.json({ error: MSG[key][lang], code: key }, { status });

  if (!supabaseConfigured() || !adminConfigured()) return fail("unavailable", 503);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated", code: "unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !CONFIRM_WORDS.has(parsed.data.confirm.toLocaleUpperCase("tr-TR"))) return fail("confirm", 400);

  const admin = createAdminClient();
  const { data: prof } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string }>();
  if (prof?.role === "admin") return fail("admin", 403);

  // Stop renewals before the rows (and our link to the subscription) disappear.
  const { data: subs } = await admin.from("subscriptions").select("provider,provider_ref,status").eq("owner_id", user.id);
  for (const sub of subs ?? []) {
    if (sub.provider !== "lemonsqueezy" || !isProStatus(String(sub.status))) continue;
    if (!billingConfigured()) return fail("subscription", 409);
    try {
      await cancelSubscription(String(sub.provider_ref));
    } catch (e) {
      console.error("account delete: cancel subscription", e);
      return fail("subscription", 409);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("account delete", error);
    return fail("failed", 500);
  }
  console.log(JSON.stringify({ event: "account_deleted", at: new Date().toISOString() }));

  // Clear the session cookies of the (now deleted) user.
  await supabase.auth.signOut().catch(() => undefined);
  return NextResponse.json({ ok: true });
}
