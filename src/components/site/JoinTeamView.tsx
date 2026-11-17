import Link from "next/link";
import { Users } from "lucide-react";
import { JoinTeamButton } from "@/components/account/JoinTeamButton";
import { lhref, type Locale } from "@/lib/i18n";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import type { InvitePreview } from "@/lib/team";
import { PublicShell } from "./PublicShell";

const COPY = {
  tr: {
    invited: (team: string) => `"${team}" takımına davet edildin`,
    by: (u: string) => `@${u} seni Prompt.Monster'daki takımına çağırıyor.`,
    byAnon: "Prompt.Monster'da bir takıma çağrıldın.",
    active: "Katıldığın anda Monster Pro özellikleri (18 uzman, Mega Chain, 5 format, aylık AI kredisi) hesabında açılır.",
    pending: "Takım henüz aktivasyon bekliyor: şimdi katılabilirsin, Pro özellikleri takım aktifleşince açılır.",
    login: "Giriş yap veya kayıt ol, sonra katıl",
    loginNote: "Davet tek kullanımlıktır ve seçtiğin hesaba bağlanır.",
    bad: {
      invalid: ["Davet bulunamadı", "Link eksik ya da hatalı kopyalanmış olabilir. Takım yöneticinden yeni bir link iste."],
      revoked: ["Bu davet iptal edilmiş", "Takım yöneticinden yeni bir davet linki iste."],
      used: ["Bu davet zaten kullanılmış", "Davet linkleri tek kullanımlık. Takıma zaten katıldıysan Hesabım sayfasında görürsün."],
      expired: ["Davetin süresi dolmuş", "Davet linkleri 14 gün geçerli. Takım yöneticinden yeni bir link iste."],
      canceled: ["Bu takım iptal edilmiş", "Bu takıma artık katılınamaz."],
    },
    account: "Hesabıma git",
    studio: "Studio'yu aç",
  },
  en: {
    invited: (team: string) => `You're invited to "${team}"`,
    by: (u: string) => `@${u} is inviting you to their team on Prompt.Monster.`,
    byAnon: "You've been invited to a team on Prompt.Monster.",
    active: "As soon as you join, Monster Pro features (18 experts, Mega Chain, 5 formats, monthly AI credits) switch on for your account.",
    pending: "The team is still awaiting activation: you can join now, and Pro features switch on once the team is active.",
    login: "Sign in or sign up, then join",
    loginNote: "The invite is single use and gets linked to the account you choose.",
    bad: {
      invalid: ["Invite not found", "The link may be incomplete or mistyped. Ask your team admin for a new one."],
      revoked: ["This invite was revoked", "Ask your team admin for a new invite link."],
      used: ["This invite has already been used", "Invite links are single use. If you already joined, you'll see the team on your account page."],
      expired: ["This invite has expired", "Invite links are valid for 14 days. Ask your team admin for a new one."],
      canceled: ["This team was canceled", "It's no longer possible to join this team."],
    },
    account: "Go to my account",
    studio: "Open the Studio",
  },
} as const;

/** /join/<token> — team invite landing page (noindex). Works for signed-out visitors too. */
export async function JoinTeamView({ locale, token }: { locale: Locale; token: string }) {
  const c = COPY[locale];
  let preview: InvitePreview | null = null;
  let signedIn = false;
  if (supabaseConfigured() && /^[a-f0-9]{20,100}$/i.test(token)) {
    try {
      const supabase = await createClient();
      const [{ data }, { data: auth }] = await Promise.all([
        supabase.rpc("team_invite_preview", { p_token: token }).maybeSingle<InvitePreview>(),
        supabase.auth.getUser(),
      ]);
      preview = data ?? null;
      signedIn = Boolean(auth.user);
    } catch {
      preview = null;
    }
  }

  const here = `${lhref("/join", locale)}/${token}`;
  const state = preview?.state ?? "invalid";

  return (
    <PublicShell locale={locale}>
      <main className="max-w-[560px] mx-auto px-4 lg:px-8 py-16">
        <div className="rounded-2xl bg-ink-800 border border-ink-600 p-6 md:p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-lime/10 border border-lime/30 grid place-items-center">
            <Users className="w-6 h-6 text-lime" aria-hidden />
          </div>
          {preview && state === "valid" ? (
            <>
              <h1 className="mt-5 text-2xl font-black tracking-tight">{c.invited(preview.team_name)}</h1>
              <p className="mt-2 text-[14px] text-zinc-400">{preview.inviter_username ? c.by(preview.inviter_username) : c.byAnon}</p>
              <p className="mt-4 text-[13px] text-zinc-300 leading-relaxed">{preview.team_status === "active" ? c.active : c.pending}</p>
              <div className="mt-7">
                {signedIn ? (
                  <JoinTeamButton locale={locale} token={token} />
                ) : (
                  <>
                    <Link
                      href={`${lhref("/login", locale)}?next=${encodeURIComponent(here)}`}
                      className="h-11 px-6 rounded-xl bg-lime text-black text-[14px] font-bold inline-flex items-center justify-center"
                    >
                      {c.login}
                    </Link>
                    <p className="mt-3 text-[12px] text-zinc-500">{c.loginNote}</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-5 text-2xl font-black tracking-tight">{c.bad[state === "valid" ? "invalid" : state][0]}</h1>
              <p className="mt-2 text-[14px] text-zinc-400">{c.bad[state === "valid" ? "invalid" : state][1]}</p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                <Link href={lhref("/account", locale)} className="h-10 px-4 rounded-lg bg-ink-950 border border-ink-600 text-[13px] font-semibold inline-flex items-center">
                  {c.account}
                </Link>
                <Link href={lhref("/studio", locale)} className="h-10 px-4 rounded-lg bg-white text-black text-[13px] font-bold inline-flex items-center">
                  {c.studio}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </PublicShell>
  );
}
