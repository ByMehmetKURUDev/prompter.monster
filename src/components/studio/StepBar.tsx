"use client";

import { cx } from "./ui";

const STEPS = [
  { n: 1, t: "FİKİR & VİZYON" },
  { n: 2, t: "TEKNOLOJİ & MİMARİ" },
  { n: 3, t: "ÖZELLİKLER & ÖDEME" },
  { n: 4, t: "UZMANLAR & ÜRET" },
] as const;

export function StepBar({ step, onStep, quality }: { step: number; onStep: (n: 1 | 2 | 3 | 4) => void; quality: number }) {
  return (
    <div className="sticky top-[56px] z-30 bg-ink-950/90 backdrop-blur border-b border-ink-600">
      <div className="px-4 lg:px-8 py-4 flex items-center gap-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStep(s.n)}
                aria-label={`Adım ${s.n}: ${s.t}`}
                aria-current={step === s.n ? "step" : undefined}
                className={cx(
                  "w-8 h-8 rounded-full grid place-items-center text-[12px] font-bold border transition",
                  step === s.n
                    ? "bg-lime text-black border-lime shadow-[0_0_12px_rgba(163,255,18,0.5)]"
                    : step > s.n
                      ? "bg-ink-800 border-ink-400 text-lime"
                      : "bg-ink-800 border-ink-600 text-zinc-500",
                )}
              >
                {s.n}
              </button>
              {s.n < 4 && <div className={cx("w-8 lg:w-12 h-px", step > s.n ? "bg-lime" : "bg-ink-600")} />}
            </div>
          ))}
        </div>
        <div className="ml-4 hidden md:flex items-center gap-6 text-[12px]">
          {STEPS.map((s) => (
            <span key={s.n} className={cx(step === s.n ? "text-white font-semibold" : "text-zinc-500", "flex items-center gap-1.5")}>
              {s.t}
              {step === s.n && <span className="w-1 h-1 rounded-full bg-lime" />}
            </span>
          ))}
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">Quality</span>
          <div className="w-20 h-1.5 rounded-full bg-ink-600 overflow-hidden" role="progressbar" aria-valuenow={quality} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-lime" style={{ width: `${quality}%` }} />
          </div>
          <span className="text-[11px] font-mono text-lime">{quality}%</span>
        </div>
      </div>
    </div>
  );
}
