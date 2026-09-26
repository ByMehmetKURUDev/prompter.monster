"use client";

import { Cpu, Sparkles } from "lucide-react";
import { STACK, STACK_LABELS, STACK_SUGGESTIONS, type StackKey } from "@/lib/data";
import type { StudioState } from "@/lib/types";
import { Card, Pill, SectionLabel, Spinner, StepHeader } from "./ui";
import { useT } from "./useT";

export function Step2Stack({
  s,
  toggle,
  onSuggest,
  suggesting,
  aiPicks,
  aiWhy,
  cost = 1,
}: {
  s: StudioState;
  toggle: (key: StackKey, v: string) => void;
  onSuggest: () => void;
  suggesting: boolean;
  aiPicks: string[] | null;
  aiWhy: string;
  /** Credit cost of one stack suggestion. */
  cost?: number;
}) {
  const t = useT().step2;
  const suggested = aiPicks ?? STACK_SUGGESTIONS[s.projectType] ?? STACK_SUGGESTIONS["saas-dash"];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <StepHeader icon={<Cpu className="w-5 h-5 text-violet" aria-hidden />} title={t.title} subtitle={t.subtitle} />
        <button
          type="button"
          onClick={onSuggest}
          disabled={suggesting}
          className="h-9 px-3 rounded-lg bg-ink-800 border border-ink-400 text-[12px] font-medium flex items-center gap-1.5 disabled:opacity-60"
        >
          {suggesting ? <Spinner className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-lime" aria-hidden />}
          {t.suggest}
          <span className="text-zinc-500 font-normal">{t.cost(cost)}</span>
        </button>
      </div>
      {aiWhy && <p className="text-[12px] text-zinc-400 -mt-2">{aiWhy}</p>}

      {(Object.keys(STACK) as StackKey[]).map((key) => (
        <Card key={key} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>{STACK_LABELS[key]}</SectionLabel>
            <div className="text-[10px] text-zinc-500">{t.selected(s[key].length)}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {STACK[key].map((opt) => (
              <Pill key={opt} active={s[key].includes(opt)} onClick={() => toggle(key, opt)}>
                {opt}
                {suggested.includes(opt) && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-lime text-black text-[9px] font-bold">{t.aiPick}</span>
                )}
              </Pill>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
