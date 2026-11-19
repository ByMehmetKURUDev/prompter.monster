"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_STATE, DEFAULT_STATE_EN } from "@/lib/data";
import { coachInput, type CoachState } from "@/lib/input-coach";
import { track } from "@/lib/track";
import type { StudioState } from "@/lib/types";
import { cx } from "./ui";
import { useT } from "./useT";

const COLLAPSE_KEY = "pm.coach.collapsed";

/**
 * Girdi Koçu / Input Coach (#47): a step 1 checklist with a 0–100 input score, concrete tips and
 * one-click example ideas. Scoring lives in src/lib/input-coach.ts; it does not touch the "Quality" meter.
 */
export function InputCoach({
  s,
  patch,
  onNotify,
}: {
  s: StudioState;
  patch: (p: Partial<StudioState>) => void;
  /** Shows a short toast in the Studio (optional). */
  onNotify?: (message: string, ms?: number) => void;
}) {
  const t = useT().coach;
  const { score, items } = useMemo(
    () => coachInput({ name: s.name, pitch: s.pitch, description: s.description, audience: s.audience, competitors: s.competitors, usp: s.usp }),
    [s.name, s.pitch, s.description, s.audience, s.competitors, s.usp],
  );

  // Collapsed state is a per-browser convenience; storage can be unavailable (private mode, embedded views).
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const tone = score >= 80 ? "lime" : score >= 50 ? "amber" : "low";
  const bodyId = "input-coach-body";

  function applyKit(i: number) {
    const k = t.kits[i];
    if (!k) return;
    if (hasOwnInput(s) && !window.confirm(t.confirmReplace)) return;
    patch({
      name: k.name,
      pitch: k.pitch,
      description: k.description,
      audience: { ...k.audience },
      competitors: padCompetitors(k.competitors, s.competitors.length),
      usp: k.usp,
      projectType: k.projectType,
      monetization: [...k.monetization],
    });
    track("quick_start", { project_type: k.projectType, source: "coach_example" });
    onNotify?.(t.kitApplied(k.name), 3200);
  }

  return (
    <section
      aria-labelledby="input-coach-title"
      className="rounded-2xl border border-ink-600 overflow-hidden bg-ink-800 bg-[linear-gradient(180deg,rgba(139,92,246,0.07),rgba(21,21,26,0)_55%)]"
    >
      <div className="px-5 pt-4 pb-3.5 flex items-start gap-3 border-b border-ink-600">
        <div className="w-9 h-9 rounded-xl bg-ink-700 border border-violet grid place-items-center text-base shrink-0" aria-hidden>
          🧭
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 id="input-coach-title" className="text-[15px] font-bold">
              {t.title}
            </h3>
            <span className="text-[9px] font-bold tracking-wider bg-lime text-black px-1.5 py-0.5 rounded-full">{t.badge}</span>
          </div>
          <p className="text-[11.5px] text-zinc-500 mt-0.5">{t.subtitle}</p>
        </div>
        <div className="text-right shrink-0" aria-label={t.scoreAria(score)} role="img">
          <div
            className={cx(
              "font-mono tabular-nums text-[24px] font-extrabold leading-none",
              tone === "lime" ? "text-lime" : tone === "amber" ? "text-amber-400" : "text-zinc-300",
            )}
          >
            {score}
            <span className="text-[13px] font-semibold text-zinc-500">/100</span>
          </div>
          <div className="text-[10px] text-zinc-500 tracking-wider uppercase mt-0.5">{t.scoreLabel}</div>
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          aria-label={collapsed ? t.show : t.hide}
          className="h-7 px-2 -mr-1 rounded-lg text-[11px] text-zinc-500 hover:text-zinc-200 hover:bg-ink-700 flex items-center gap-1 shrink-0"
        >
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" aria-hidden /> : <ChevronUp className="w-3.5 h-3.5" aria-hidden />}
          <span className="hidden sm:inline">{collapsed ? t.show : t.hide}</span>
        </button>
      </div>
      <div className="h-1.5 bg-ink-600" aria-hidden>
        <div
          className={cx("h-full transition-[width] duration-300", tone === "lime" ? "bg-lime" : tone === "amber" ? "bg-amber-400" : "bg-zinc-500")}
          style={{ width: `${score}%` }}
        />
      </div>

      {!collapsed && (
        <div id={bodyId} className="px-5 pt-3 pb-4">
          <ul className="divide-y divide-ink-700">
            {items.map((it) => (
              <li key={it.key} className="flex gap-3 py-2.5">
                <Dot state={it.state} label={t.stateAria[it.state]} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12.5px] font-semibold text-zinc-100">{t.labels[it.key]}</span>
                    <span className="font-mono text-[10px] text-zinc-600">{t.points(it.weight)}</span>
                  </div>
                  <p className={cx("text-[11.5px] leading-snug mt-0.5", it.state === "warn" ? "text-amber-300/80" : "text-zinc-500")}>{t.tips[it.tip]}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 pt-3 border-t border-ink-700">
            <div className="text-[10.5px] text-zinc-600 tracking-wider uppercase mb-2">{t.examplesLabel}</div>
            <div className="flex flex-wrap gap-2">
              {t.kits.map((k, i) => (
                <button
                  key={k.name}
                  type="button"
                  onClick={() => applyKit(i)}
                  className="text-[11.5px] px-3 py-1.5 rounded-full border border-ink-600 bg-ink-950 text-zinc-300 hover:border-violet hover:text-white flex items-center gap-1.5 transition"
                >
                  <span aria-hidden>{k.emoji}</span> {k.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-3 pt-3 border-t border-ink-700 text-[11px] text-zinc-600 leading-relaxed flex gap-2">
            <span aria-hidden>💡</span>
            <span>{t.note}</span>
          </p>
        </div>
      )}
    </section>
  );
}

function Dot({ state, label }: { state: CoachState; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cx(
        "w-5 h-5 mt-px rounded-full grid place-items-center text-[11px] font-bold shrink-0",
        state === "pass" && "bg-lime text-black",
        state === "warn" && "border-[1.5px] border-amber-400 text-amber-400",
        state === "fail" && "border-[1.5px] border-ink-500",
      )}
    >
      {state === "pass" ? "✓" : state === "warn" ? "!" : ""}
    </span>
  );
}

/** Step 1 text fields, in a fixed order, for comparing two states. */
function step1Fields(s: StudioState): string[] {
  return [s.name, s.pitch, s.description, s.usp, s.audience.role, s.audience.pain, s.audience.budget, ...s.competitors].map((v) => (v ?? "").trim());
}

/** True when step 1 holds something the user typed (not empty, not the untouched demo project the Studio opens with). */
function hasOwnInput(s: StudioState): boolean {
  const mine = step1Fields(s);
  if (mine.every((v) => !v)) return false;
  const same = (d: StudioState) => {
    const demo = step1Fields(d);
    return demo.length === mine.length && demo.every((v, i) => v === mine[i]);
  };
  return !(same(DEFAULT_STATE) || same(DEFAULT_STATE_EN));
}

/** Keep the Studio's competitor slot count (3 by default) so the inputs don't jump. */
function padCompetitors(list: string[], slots: number): string[] {
  const n = Math.max(slots, list.length, 1);
  return Array.from({ length: n }, (_, i) => list[i] ?? "");
}
