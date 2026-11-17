"use client";

/**
 * Ana sayfadaki "canlı kullanım sayaçları" bölümü — prompts.chat/Promptmasters analizi, öneri #7,
 * görev #65. StarterKitsSection.tsx ile aynı desen: istemci bileşeni, mount sonrası fetch (ana
 * sayfa statik kalsın — bkz. o dosyanın yorumu / open-next.config.ts). Görev #65'in kendi notu:
 * "Lansman henüz yapılmadı, rakamlar küçük/sıfır olabilir". Bu yüzden bir eşik altında
 * (MIN_GENERATIONS) bölüm hiç gösterilmez — yarım/küçük görünen bir sayaç olmasın. Eşik gerçek
 * kullanımla aşıldığında kod değişikliği gerekmeden otomatik görünür olur.
 */
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { PublicUsageStats } from "@/lib/stats";

const MIN_GENERATIONS = 50;

const COPY = {
  tr: {
    generations: "build prompt üretildi",
    tokens: "token üretildi",
    projects: "proje",
    shares: "paylaşım",
  },
  en: {
    generations: "build prompts generated",
    tokens: "tokens generated",
    projects: "projects",
    shares: "shares",
  },
} as const;

function fmt(n: number, locale: Locale): string {
  return n.toLocaleString(locale === "tr" ? "tr-TR" : "en-US");
}

export function UsageStatsSection({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [stats, setStats] = useState<PublicUsageStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Partial<PublicUsageStats> | null) => {
        if (!cancelled) setStats(data && typeof data.generations_total === "number" ? (data as PublicUsageStats) : null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || stats.generations_total < MIN_GENERATIONS) return null;

  const items: { value: string; label: string }[] = [
    { value: fmt(stats.generations_total, locale), label: c.generations },
    { value: fmt(stats.tokens_total, locale), label: c.tokens },
    { value: fmt(stats.projects_total, locale), label: c.projects },
  ];
  if (stats.shares_total > 0) items.push({ value: fmt(stats.shares_total, locale), label: c.shares });

  return (
    <section className="max-w-[1100px] mx-auto px-4 lg:px-8 py-4">
      <div className="rounded-2xl bg-ink-800 border border-ink-600 p-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center">
        {items.map((it) => (
          <div key={it.label}>
            <div className="text-2xl md:text-3xl font-black text-lime">{it.value}</div>
            <div className="text-[12px] text-zinc-500 mt-1">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
