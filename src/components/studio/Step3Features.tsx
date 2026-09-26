"use client";

import { Layers, Shield } from "lucide-react";
import { COMPLIANCE, FEATURE_GROUPS, PAYMENTS } from "@/lib/data";
import type { StudioState } from "@/lib/types";
import { Card, CheckBox, Pill, Radio, SectionLabel, StepHeader, cx } from "./ui";
import { useT } from "./useT";

export function Step3Features({
  s,
  toggle,
}: {
  s: StudioState;
  toggle: (key: "features" | "payments" | "compliance", v: string) => void;
}) {
  const t = useT().step3;
  return (
    <div className="space-y-6 animate-fade-in">
      <StepHeader icon={<Layers className="w-5 h-5 text-lime" aria-hidden />} title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4">
        {FEATURE_GROUPS.map((g) => (
          <Card key={g.cat} className="p-5">
            <SectionLabel className="mb-3">{g.cat}</SectionLabel>
            <div className="grid md:grid-cols-2 gap-2">
              {g.items.map((f) => {
                const on = s.features.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggle("features", f)}
                    aria-pressed={on}
                    className={cx(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition",
                      on ? "bg-ink-600 border-ink-400" : "bg-ink-950 border-ink-600 hover:border-ink-400",
                    )}
                  >
                    <CheckBox checked={on} />
                    <span className={cx("text-[12px]", on ? "text-white" : "text-zinc-500")}>{f}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}

        <Card className="p-5">
          <SectionLabel className="mb-3">{t.payments}</SectionLabel>
          <div className="grid md:grid-cols-2 gap-3">
            {PAYMENTS.map((p) => {
              const on = s.payments.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle("payments", p.id)}
                  aria-pressed={on}
                  className={cx(
                    "text-left p-3 rounded-xl border transition relative overflow-hidden",
                    on ? "bg-ink-600 border-lime/40" : "bg-ink-950 border-ink-600 hover:border-ink-400",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-[13px] font-semibold">{p.name}</span>
                      {p.tr && <span className="px-1.5 py-0.5 rounded bg-ink-600 border border-ink-400 text-[9px]">TR</span>}
                    </div>
                    <Radio checked={on} />
                  </div>
                  <div className="mt-2 flex gap-2 text-[11px]">
                    <span className="text-zinc-500">{p.fee}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400">{p.best}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {COMPLIANCE.map((c) => (
              <Pill key={c} active={s.compliance.includes(c)} onClick={() => toggle("compliance", c)} className="text-[11px]">
                <Shield className="w-3 h-3" aria-hidden /> {c}
              </Pill>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
