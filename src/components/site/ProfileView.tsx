import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, Eye, GitFork, Heart, Share2 } from "lucide-react";
import { publicProfile, publicProfileShares } from "@/lib/profile";
import { socialFor, type Locale } from "@/lib/i18n";
import { PublicShell } from "./PublicShell";
import { ProfileShareGrid } from "./ProfileShareGrid";

const COPY = {
  tr: {
    memberSince: (d: string) => `${d} tarihinden beri üye`,
    shares: "Paylaşım",
    views: "Görüntülenme",
    forks: "Çatal",
    likes: "Beğeni",
    empty: "Bu canavarın galeride henüz görünen bir paylaşımı yok.",
  },
  en: {
    memberSince: (d: string) => `Member since ${d}`,
    shares: "Shares",
    views: "Views",
    forks: "Forks",
    likes: "Likes",
    empty: "This monster has no shares in the gallery yet.",
  },
} as const;

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "tr-TR", { month: "long", year: "numeric" });
}

/** page.tsx'in generateMetadata'sından çağrılır. */
export async function generateProfileMetadata(username: string, locale: Locale): Promise<Metadata> {
  const profile = await publicProfile(username);
  if (!profile) return { title: locale === "en" ? "Monster not found" : "Canavar bulunamadı", robots: { index: false } };
  const title = `${profile.display_name} (@${profile.username})`;
  const description =
    locale === "en"
      ? `${profile.display_name}'s shared build prompts on Prompter.Monster: ${profile.share_count} shares, ${profile.total_likes} likes.`
      : `@${profile.username} kullanıcısının Prompter.Monster'da paylaştığı build prompt'lar: ${profile.share_count} paylaşım, ${profile.total_likes} beğeni.`;
  return { title, description, ...socialFor(`/u/${profile.username}`, locale, title, description) };
}

/** /u/[username] (+ /en twin) — herkese açık canavar profili: başlık, istatistikler, galerideki paylaşımları. */
export async function ProfileView({ username, locale }: { username: string; locale: Locale }) {
  const c = COPY[locale];
  const [profile, shares] = await Promise.all([publicProfile(username), publicProfileShares(username, 24, 0)]);
  if (!profile) notFound();

  const stat = (icon: React.ReactNode, label: string, value: number) => (
    <div className="rounded-xl bg-ink-900 border border-ink-600 p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-zinc-500">{icon}</div>
      <div className="mt-1 text-[18px] font-bold tabular-nums">{value}</div>
      <div className="text-[11px] text-zinc-500">{label}</div>
    </div>
  );

  return (
    <PublicShell locale={locale}>
      <main className="max-w-[1000px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime to-violet grid place-items-center text-black text-2xl font-black shrink-0">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight truncate">{profile.display_name}</h1>
            <p className="text-[13px] text-zinc-500 mt-1">@{profile.username}</p>
            <p className="text-[12px] text-zinc-600 mt-1 inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3" aria-hidden /> {c.memberSince(fmtDate(profile.member_since, locale))}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 max-w-[480px] mb-10">
          {stat(<Share2 className="w-3.5 h-3.5" aria-hidden />, c.shares, profile.share_count)}
          {stat(<Eye className="w-3.5 h-3.5" aria-hidden />, c.views, profile.total_views)}
          {stat(<GitFork className="w-3.5 h-3.5" aria-hidden />, c.forks, profile.total_forks)}
          {stat(<Heart className="w-3.5 h-3.5" aria-hidden />, c.likes, profile.total_likes)}
        </div>

        {shares.length === 0 ? (
          <p className="text-[14px] text-zinc-500 py-12 text-center max-w-[480px] mx-auto">{c.empty}</p>
        ) : (
          <ProfileShareGrid username={profile.username} initialItems={shares} locale={locale} />
        )}
      </main>
    </PublicShell>
  );
}
