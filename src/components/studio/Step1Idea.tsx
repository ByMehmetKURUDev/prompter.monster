"use client";

import { Sparkles } from "lucide-react";
import { ALL_PROJECT_TYPES, MONETIZATION } from "@/lib/data";
import type { StudioState } from "@/lib/types";
import { Card, Input, Pill, SectionLabel, Spinner, StepHeader, Textarea, cx } from "./ui";
import { useT } from "./useT";

export function Step1Idea({
  s,
  patch,
  toggle,
  onEnhance,
  enhancing,
  cost = 1,
}: {
  s: StudioState;
  patch: (p: Partial<StudioState>) => void;
  toggle: (key: "monetization", v: string) => void;
  onEnhance: () => void;
  enhancing: boolean;
  /** Credit cost of one Enhance call. */
  cost?: number;
}) {
  const t = useT().step1;
  return (
    <div className="space-y-6 animate-fade-in">
      <StepHeader icon="💡" title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4">
        <Card className="p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-2 block">
              <SectionLabel>{t.name}</SectionLabel>
              <Input value={s.name} onChange={(e) => patch({ name: e.target.value })} placeholder={t.namePlaceholder} />
            </label>
            <label className="space-y-2 block">
              <SectionLabel>{t.pitch}</SectionLabel>
              <Input value={s.pitch} onChange={(e) => patch({ pitch: e.target.value })} placeholder={t.pitchPlaceholder} />
            </label>
          </div>
          <label className="space-y-2 block">
            <SectionLabel>{t.description}</SectionLabel>
            <div className="relative">
              <Textarea
                value={s.description}
                onChange={(e) => patch({ description: e.target.value })}
                rows={3}
                className="pr-28"
                placeholder={t.descriptionPlaceholder}
              />
              <button
                type="button"
                onClick={onEnhance}
                disabled={enhancing}
                className="absolute right-2 top-2 h-7 px-3 rounded-lg bg-ink-600 border border-ink-400 text-[11px] font-medium flex items-center gap-1 disabled:opacity-60"
              >
                {enhancing ? <Spinner className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-lime" aria-hidden />} Enhance
                <span className="text-zinc-500 font-normal" title={t.creditCost(cost)}>· {cost}</span>
              </button>
            </div>
          </label>
        </Card>

        <Card className="p-5">
          <SectionLabel className="mb-3">{t.projectType}</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ALL_PROJECT_TYPES.slice(0, 12).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => patch({ projectType: p.id })}
                aria-pressed={s.projectType === p.id}
                className={cx(
                  "text-left p-3 rounded-xl border transition",
                  s.projectType === p.id
                    ? "bg-ink-600 border-lime/50 shadow-[0_0_0_1px_rgba(163,255,18,0.2)]"
                    : "bg-ink-950 border-ink-600 hover:border-ink-400",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{p.icon}</span>
                  {p.badge && <span className="text-[9px] px-1 py-0.5 rounded bg-lime/20 text-lime">{p.badge}</span>}
                </div>
                <div className="text-[12px] font-medium mt-2">{p.name}</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-600 mt-3">{t.allTypes}</p>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 space-y-3">
            <SectionLabel>{t.audience}</SectionLabel>
            <Input variant="sm" value={s.audience.role} onChange={(e) => patch({ audience: { ...s.audience, role: e.target.value } })} placeholder={t.role} />
            <Input variant="sm" value={s.audience.pain} onChange={(e) => patch({ audience: { ...s.audience, pain: e.target.value } })} placeholder={t.pain} />
            <Input variant="sm" value={s.audience.budget} onChange={(e) => patch({ audience: { ...s.audience, budget: e.target.value } })} placeholder={t.budget} />
          </Card>
          <Card className="p-4 space-y-3">
            <SectionLabel>{t.competitors}</SectionLabel>
            {s.competitors.map((c, i) => (
              <Input
                key={i}
                variant="sm"
                value={c}
                placeholder={t.competitor(i + 1)}
                onChange={(e) => {
                  const next = [...s.competitors];
                  next[i] = e.target.value;
                  patch({ competitors: next });
                }}
              />
            ))}
          </Card>
          <Card className="p-4 space-y-3">
            <SectionLabel>{t.usp}</SectionLabel>
            <Textarea value={s.usp} onChange={(e) => patch({ usp: e.target.value })} rows={3} className="p-3 text-[12px] rounded-lg" placeholder={t.uspPlaceholder} />
            <div className="flex flex-wrap gap-1.5">
              {MONETIZATION.map((m) => (
                <Pill key={m} active={s.monetization.includes(m)} onClick={() => toggle("monetization", m)} tone="lime" className="px-2.5 py-1 text-[11px]">
                  {m}
                </Pill>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
