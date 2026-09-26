"use client";

import { useEffect, useState } from "react";
import { Megaphone, Wrench, X } from "lucide-react";
import type { PublicSettings } from "@/lib/settings";

/**
 * Site-wide announcement / maintenance strip driven by the admin settings.
 * Client-side so static pages stay static; the endpoint is edge-cached for a minute.
 */
export function SiteNotice() {
  const [s, setS] = useState<PublicSettings | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: PublicSettings | null) => {
        if (!alive || !j) return;
        setS(j);
        try {
          if (j.announcement && sessionStorage.getItem("pm:notice:dismissed") === j.announcement) setHidden(true);
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!s) return null;

  if (s.maintenance_mode) {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-[12.5px] px-4 py-2 flex items-center gap-2 justify-center">
        <Wrench className="w-3.5 h-3.5 shrink-0" aria-hidden /> Bakım yapıyoruz — AI özellikleri ve satın alma kısa süreliğine kapalı; prompt üretimi çalışıyor.
      </div>
    );
  }
  if (!s.announcement || hidden) return null;

  const inner = (
    <>
      <Megaphone className="w-3.5 h-3.5 shrink-0 text-lime" aria-hidden />
      <span className="truncate">{s.announcement}</span>
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
        aria-label="Kapat"
        className="shrink-0 text-zinc-500 hover:text-white"
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem("pm:notice:dismissed", s.announcement);
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
