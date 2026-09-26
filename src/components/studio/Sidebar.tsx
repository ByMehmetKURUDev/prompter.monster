"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PROJECT_CATEGORIES, TEMPLATES } from "@/lib/data";
import { cx } from "./ui";

export function Sidebar({
  projectType,
  onProjectType,
  onNew,
  onTemplate,
  usedToday,
  dailyLimit,
  monthUsed = null,
  monthLimit = null,
  signedIn,
  plan,
}: {
  projectType: string;
  onProjectType: (id: string) => void;
  onNew: () => void;
  onTemplate: (name: string) => void;
  usedToday: number;
  dailyLimit: number;
  /** Pro: credits used / available this month. */
  monthUsed?: number | null;
  monthLimit?: number | null;
  signedIn: boolean;
  plan: "free" | "pro" | null;
}) {
  const pct = Math.min(100, Math.round((usedToday / Math.max(1, dailyLimit)) * 100));
  const monthPct = monthLimit ? Math.min(100, Math.round(((monthUsed ?? 0) / Math.max(1, monthLimit)) * 100)) : 0;
  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r border-ink-600 bg-ink-950 h-[calc(100vh-56px)] sticky top-[56px] overflow-hidden">
      <div className="p-4">
        <button
          type="button"
          onClick={onNew}
          className="w-full h-11 rounded-xl bg-lime text-black font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,255,18,0.3)] hover:shadow-[0_0_30px_rgba(163,255,18,0.5)] transition"
        >
          <span className="text-lg">+</span> Yeni Canavar Yarat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6 scrollbar-thin">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-zinc-500 px-2 mb-2">PROJE TİPLERİ</div>
          {PROJECT_CATEGORIES.map((c) => (
            <div key={c.cat} className="mb-4">
              <div className="text-[10px] font-bold text-zinc-600 px-2 mb-1 tracking-widest">{c.cat}</div>
              <div className="space-y-0.5">
                {c.items.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onProjectType(p.id)}
                    className={cx(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] transition border",
                      projectType === p.id
                        ? "bg-ink-800 border-ink-400 text-white"
                        : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-ink-800/60",
                    )}
                  >
                    <span className="text-[14px]">{p.icon}</span>
                    <span className="truncate text-left flex-1 font-medium">{p.name}</span>
                    {p.badge && (
                      <span
                        className={cx(
                          "text-[9px] px-1.5 py-0.5 rounded font-bold",
                          p.badge === "HOT"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-lime/20 text-lime border border-lime/30",
                        )}
                      >
                        {p.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-widest text-zinc-500 px-2 mb-2">HAZIR ŞABLONLAR</div>
          <div className="space-y-1">
            {TEMPLATES.slice(0, 10).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTemplate(t)}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-[12px] text-zinc-500 hover:text-zinc-300 hover:bg-ink-800 flex items-center justify-between group"
              >
                <span>{t}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-ink-600 space-y-3">
        <div className="rounded-xl bg-ink-800 border border-ink-600 p-3">
          {plan === "pro" && monthLimit ? (
            <>
              <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5">
                <span>AI kredisi — bu ay (Pro)</span>
                <span className="tabular-nums">
                  {monthUsed ?? 0}/{monthLimit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-600 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-lime to-violet" style={{ width: `${monthPct}%` }} />
              </div>
              <div className="mt-1.5 text-[10px] text-zinc-600 tabular-nums">
                Bugün {usedToday}/{dailyLimit} (günlük adil kullanım)
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-[11px] text-zinc-500 mb-1.5">
                <span>{signedIn ? "Günlük AI kredisi (Free)" : "Günlük AI kredisi (ziyaretçi)"}</span>
                <span className="tabular-nums">
                  {usedToday}/{dailyLimit}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-ink-600 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-lime to-violet" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 text-[10px] text-zinc-600">Enhance ve stack önerisi 1, iyileştir 3 kredi. Prompt üretimi ücretsiz ve sınırsız.</div>
            </>
          )}
        </div>
        {!signedIn && (
          <a href="/login?next=/studio" className="block rounded-xl bg-ink-800 border border-ink-600 p-3 hover:border-ink-400 transition">
            <div className="text-[12px] font-semibold">Giriş yap, kaydet</div>
            <div className="text-[11px] text-zinc-500 mt-1">Projelerini ve versiyonlarını kütüphanende sakla.</div>
          </a>
        )}
        {plan !== "pro" && (
        <div className="rounded-xl bg-gradient-to-br from-ink-800 to-ink-700 border border-ink-400 p-3 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-lime/20 blur-2xl rounded-full" />
          <div className="text-[12px] font-semibold">Upgrade to Monster Pro</div>
          <div className="text-[11px] text-zinc-500 mt-1">12 uzman, Mega Chain, 5 format ve ayda 1.000 AI kredisi.</div>
          <Link href="/pricing" className="mt-2.5 w-full h-8 rounded-lg bg-white text-black text-[12px] font-bold flex items-center justify-center">
            Yükselt — $29/ay
          </Link>
        </div>
        )}
      </div>
    </aside>
  );
}
