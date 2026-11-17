"use client";

/**
 * Ana sayfadaki "canlı başlangıç kitleri" bölümü — bkz. StarterKitCards.tsx (kart ızgarası) ve
 * src/app/api/explore/starter-kits/route.ts (veri). Bilinçli olarak istemci bileşeni: ana sayfa
 * statik kalsın (Workers Assets'ten servis edilsin) diye server-side fetch/ISR kullanmıyoruz —
 * bkz. open-next.config.ts: bu Cloudflare Workers hedefinde incremental cache yapılandırılı değil,
 * yani revalidate burada gerçek "canlı" tazelik sağlamaz. Mount sonrası küçük bir client fetch ile
 * her sayfa yüklemesinde taze veri alıyoruz; karşılığında bu bölüm JS olmadan görünmez (SEO açısından
 * küçük bir kayıp, ama sayfanın asıl içeriği statik/hızlı kalıyor).
 */
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ExploreItem } from "@/lib/explore";
import { lhref, type Locale } from "@/lib/i18n";
import { StarterKitCards } from "./StarterKitCards";

const COPY = {
  tr: {
    title: "Topluluktan canlı başlangıç kitleri",
    sub: "Keşfet galerisindeki gerçek projeler — birini aç, Studio'da çatalla, kendi fikrine uyarla.",
    all: "Tümünü Keşfet'te gör",
  },
  en: {
    title: "Live starter kits from the community",
    sub: "Real projects from the Explore gallery — open one, fork it in Studio, and make it your own.",
    all: "See all in Explore",
  },
} as const;

export function StarterKitsSection({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [items, setItems] = useState<ExploreItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const lang = locale === "en" ? "EN" : "TR";
    fetch(`/api/explore/starter-kits?lang=${lang}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ExploreItem[]) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // Yetersiz içerik varsa (erken lansman, henüz az paylaşım) ya da yüklenmediyse bölüm hiç
  // gösterilmez — boş/yarım görünen bir "trend" bloğu olmasın.
  if (!items || items.length < 3) return null;

  return (
    <section className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{c.title}</h2>
          <p className="mt-3 text-[13px] text-zinc-500 max-w-[560px]">{c.sub}</p>
        </div>
        <Link href={lhref("/explore", locale)} className="text-[13px] text-zinc-400 hover:text-lime whitespace-nowrap flex items-center gap-1">
          {c.all} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
        </Link>
      </div>
      <div className="mt-8">
        <StarterKitCards items={items} locale={locale} />
      </div>
    </section>
  );
}
