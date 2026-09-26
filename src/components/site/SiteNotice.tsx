"use client";

import { useEffect, useState } from "react";
import { Languages, Megaphone, Wrench, X } from "lucide-react";
import { usePathname } from "next/navigation";
import type { PublicSettings } from "@/lib/settings";
import { LOCALE_COOKIE, enReady, localePath, stripLocale } from "@/lib/i18n";

/**
 * Site-wide strips driven by the admin settings (maintenance / announcement) plus a one-time
 * "also available in English" hint for non-Turkish browsers on Turkish pages.
 * Client-side so static pages stay static; the settings endpoint is edge-cached for a minute.
 */
type Notice = PublicSettings & { announcement_en?: string };

export function SiteNotice() {
  const pathname = usePathname() || "/";
  const { locale, path } = stripLocale(pathname);
  const [s, setS] = useState<Notice | null>(null);
  const [hidden, setHidden] = useState(false);
  const [suggestEn, setSuggestEn] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Notice | null) => {
        if (!alive || !j) return;
        setS(j);
        try {
          const text = locale === "en" && j.announcement_en ? j.announcement_en : j.announcement;
          if (text && sessionStorage.getItem("pm:notice:dismissed") === text) setHidden(true);
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [locale]);

  // "Prefer English?" — only on Turkish pages that have an English twin, for browsers not set to Turkish,
  // when no explicit language choice was made yet.
  useEffect(() => {
    if (locale !== "tr" || !enReady(path) || path.startsWith("/admin")) return setSuggestEn(false);
    try {
      const chosen = document.cookie.split(/;\s*/).some((c) => c.startsWith(`${LOCALE_COOKIE}=`));
      const dismissed = sessionStorage.getItem("pm:lang:dismissed") === "1";
      const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
      const prefersTurkish = langs.some((l) => /^tr\b/i.test(l || ""));
      setSuggestEn(!chosen && !dismissed && !prefersTurkish);
    } catch {
      setSuggestEn(false);
    }
  }, [locale, path]);

  if (s?.maintenance_mode) {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-[12.5px] px-4 py-2 flex items-center gap-2 justify-center">
        <Wrench className="w-3.5 h-3.5 shrink-0" aria-hidden />
        {locale === "en"
          ? "We're doing maintenance — AI features and checkout are briefly off; prompt generation still works."
          : "Bakım yapıyoruz — AI özellikleri ve satın alma kısa süreliğine kapalı; prompt üretimi çalışıyor."}
      </div>
    );
  }

  if (suggestEn) {
    const href = localePath(path, "en");
    return (
      <div className="bg-ink-800 border-b border-ink-600 text-zinc-200 text-[12.5px] px-4 py-2 flex items-center gap-2" lang="en">
        <a
          href={href}
          className="flex items-center gap-2 min-w-0 hover:text-lime mx-auto"
          onClick={() => {
            try {
              document.cookie = `${LOCALE_COOKIE}=en; path=/; max-age=31536000; samesite=lax`;
            } catch {
              /* ignore */
            }
          }}
        >
          <Languages className="w-3.5 h-3.5 shrink-0 text-lime" aria-hidden />
          <span className="truncate">This page is also available in English — switch to English →</span>
        </a>
        <button
          type="button"
          aria-label="Dismiss"
          className="shrink-0 text-zinc-500 hover:text-white"
          onClick={() => {
            setSuggestEn(false);
            try {
              sessionStorage.setItem("pm:lang:dismissed", "1");
            } catch {
              /* ignore */
            }
          }}
        >
          <X className="w-3.5 h-3.5" aria-hidden />
        </button>
      </div>
    );
  }

  if (!s) return null;
  const text = locale === "en" && s.announcement_en ? s.announcement_en : s.announcement;
  if (!text || hidden) return null;

  const inner = (
    <>
      <Megaphone className="w-3.5 h-3.5 shrink-0 text-lime" aria-hidden />
      <span className="truncate">{text}</span>
    </>
  );
  return (
    <div className="bg-ink-800 border-b border-ink-600 text-zinc-200 text-[12.5px] px-4 py-2 flex items-center gap-2">
      {s.announcement_url ? (
        <a href={s.announcement_url} className="flex items-center gap-2 min-w-0 hover:text-lime mx-auto">
          {inner}
        </a>
      ) : (
        <span className="flex items-center gap-2 min-w-0 mx-auto">{inner}</span>
      )}
      <button
        type="button"
        aria-label={locale === "en" ? "Close" : "Kapat"}
        className="shrink-0 text-zinc-500 hover:text-white"
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem("pm:notice:dismissed", text);
          } catch {
            /* ignore */
          }
        }}
      >
        <X className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
}
