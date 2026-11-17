import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { leaderboardCreators } from "@/lib/explore";
import { lhref, type Locale } from "@/lib/i18n";
import { PublicShell } from "./PublicShell";
import { LeaderboardTable } from "./LeaderboardTable";

const COPY = {
  tr: {
    back: "Keşfet'e dön",
    title: "Usta Canavarlar",
    subtitle: "Topluluktan en çok beğeni alan paylaşım sahipleri. Beğendiğin bir build prompt'u aç, Studio'da çatalla, ve sahibine bir beğeni bırak.",
  },
  en: {
    back: "Back to Explore",
    title: "Master Monsters",
    subtitle: "The creators whose shared prompts picked up the most likes from the community. Open one you like, fork it in Studio, and leave its creator a like.",
  },
} as const;

export async function LeaderboardView({ locale }: { locale: Locale }) {
  const entries = await leaderboardCreators("all", 20);
  const c = COPY[locale];

  return (
    <PublicShell locale={locale}>
      <main className="max-w-[760px] mx-auto px-4 lg:px-8 py-10">
        <Link href={lhref("/explore", locale)} className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-white mb-6">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> {c.back}
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">{c.title}</h1>
        <p className="mt-3 text-[15px] text-zinc-400 max-w-[560px] leading-relaxed">{c.subtitle}</p>

        <div className="mt-8">
          <LeaderboardTable initialEntries={entries} locale={locale} />
        </div>
      </main>
    </PublicShell>
  );
}
