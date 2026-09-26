"use client";

import { Brain, Crown, Gauge, Lock, Star } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/site/LocaleProvider";
import { EXPERTS, FORMATS } from "@/lib/data";
import { lhref } from "@/lib/i18n";
import type { PlanId, PlanLimits } from "@/lib/plans";
import type { OutputFormat, OutputLang, StudioState } from "@/lib/types";
import { Card, Radio, SectionLabel, Spinner, StepHeader, cx } from "./ui";
import { useT } from "./useT";

export function Step4Experts({
  s,
  onToggleExpert,
  onFormat,
  patch,
  onGenerate,
  generating,
  tokens,
  plan,
  limits,
}: {
  s: StudioState;
  onToggleExpert: (id: string) => void;
  onFormat: (f: OutputFormat) => void;
  patch: (p: Partial<StudioState>) => void;
  onGenerate: () => void;
  generating: boolean;
  tokens: number;
  plan: PlanId;
  limits: PlanLimits;
}) {
  const locale = useLocale();
  const t = useT().step4;
  const pricing = lhref("/pricing", locale);
  const okCount = s.experts.length >= 3 && s.experts.length <= 5;
  const atCap = s.experts.length >= limits.experts;
  const isFree = plan !== "pro";

  return (
    <div className="space-y-6 animate-fade-in">
      <StepHeader icon="👹" title={t.title} subtitle={isFree ? t.subtitleFree(limits.experts) : t.subtitlePro} />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <SectionLabel>{t.expertsLabel}</SectionLabel>
          <div className="flex items-center gap-2">
            <span
              className={cx(
                "text-[11px] px-2 py-1 rounded-full border",
                okCount ? "bg-lime/20 border-lime/30 text-lime" : "bg-red-500/10 border-red-500/20 text-red-400",
              )}
            >
              {t.selected(s.experts.length, limits.experts)}
              {isFree ? "" : t.recommended}
            </span>
            {isFree && (
              <Link href={pricing} className="text-[11px] px-2 py-1 rounded-full bg-gradient-to-r from-lime/20 to-violet/20 border border-lime/30 text-lime flex items-center gap-1">
                <Crown className="w-3 h-3" aria-hidden /> {t.proForAll}
              </Link>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {EXPERTS.map((e) => {
            const on = s.experts.includes(e.id);
            const locked = !on && atCap && isFree;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onToggleExpert(e.id)}
                aria-pressed={on}
                title={locked ? t.lockedTitle(limits.experts) : undefined}
                className={cx(
                  "text-left p-4 rounded-xl border transition group relative overflow-hidden",
                  on ? "bg-ink-600 border-violet/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "bg-ink-950 border-ink-600 hover:border-ink-400",
                  locked && "opacity-60",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-ink-800 border border-ink-600 grid place-items-center text-xl">{e.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold truncate">{e.role}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink-600 border border-ink-400 text-zinc-400">{e.years}y</span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {e.org} • {e.spec}
                    </div>
                  </div>
                  {locked ? <Lock className="w-4 h-4 text-zinc-500 mt-1" aria-hidden /> : <Radio checked={on} tone="violet" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <SectionLabel className="mb-2 text-zinc-500">{t.outputLang}</SectionLabel>
          <div className="flex gap-2">
            {(["TR", "EN"] as OutputLang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => patch({ lang: l })}
                aria-pressed={s.lang === l}
                className={cx(
                  "flex-1 h-10 rounded-xl border text-[13px] font-semibold",
                  s.lang === l ? "bg-white text-black border-white" : "bg-ink-950 border-ink-600 text-zinc-500",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </Card>
        <Card className="p-4 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <SectionLabel className="text-zinc-500">FORMAT</SectionLabel>
            {isFree && (
              <Link href={pricing} className="text-[10px] text-zinc-500 hover:text-lime flex items-center gap-1">
                <Lock className="w-3 h-3" aria-hidden /> {t.proFormats}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => {
              const allowed = limits.formats.includes(f as OutputFormat);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFormat(f as OutputFormat)}
                  aria-pressed={s.format === f}
                  title={allowed ? undefined : "Pro plan"}
                  className={cx(
                    "px-3 h-9 rounded-xl border text-[12px] flex items-center gap-1.5",
                    s.format === f ? "bg-ink-800 border-violet text-white" : "bg-ink-950 border-ink-600 text-zinc-500",
                    !allowed && "opacity-60",
                  )}
                >
                  {!allowed && <Lock className="w-3 h-3" aria-hidden />}
                  {f}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={s.experts.length < 3 || generating}
        className="w-full h-[64px] rounded-2xl bg-gradient-to-r from-lime to-violet text-black font-black text-[15px] tracking-widest flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(163,255,18,0.4)] hover:shadow-[0_0_60px_rgba(163,255,18,0.6)] hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {generating ? (
          <>
            <Spinner className="w-5 h-5" /> {t.generating}
          </>
        ) : (
          <>{t.generate}</>
        )}
      </button>

      <div className="flex items-center justify-center gap-6 text-[11px] text-zinc-600 flex-wrap">
        <span className="flex items-center gap-1">
          <Gauge className="w-3 h-3" aria-hidden /> {t.tokens(tokens.toLocaleString(locale === "en" ? "en-US" : "tr-TR"))}
        </span>
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3" aria-hidden /> {t.counts(s.experts.length, s.features.length)}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" aria-hidden /> {t.qualityScore}
        </span>
      </div>
    </div>
  );
}
