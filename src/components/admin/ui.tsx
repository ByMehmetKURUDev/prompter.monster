import type { ReactNode } from "react";
import { cx } from "@/components/studio/ui";

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-zinc-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "lime" | "violet" | "red" }) {
  return (
    <div className="rounded-2xl bg-ink-800 border border-ink-600 p-4">
      <div className="text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">{label}</div>
      <div className={cx("mt-2 text-2xl font-black tabular-nums", tone === "lime" && "text-lime", tone === "violet" && "text-violet", tone === "red" && "text-red-400")}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-zinc-500">{hint}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cx("rounded-2xl bg-ink-900 border border-ink-600", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-4 h-11 border-b border-ink-600">
          {title && <h2 className="text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto scrollbar-thin -mx-4">
      <table className="min-w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-[11px] text-zinc-500 uppercase tracking-wider">
            {head.map((h) => (
              <th key={h} className="px-4 py-2 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-600">{children}</tbody>
      </table>
    </div>
  );
}

export function Badge({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | "lime" | "violet" | "red" | "amber" }) {
  const map = {
    zinc: "bg-ink-800 border-ink-600 text-zinc-300",
    lime: "bg-lime/10 border-lime/30 text-lime",
    violet: "bg-violet/10 border-violet/30 text-violet",
    red: "bg-red-500/10 border-red-500/30 text-red-400",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  } as const;
  return <span className={cx("inline-flex items-center px-2 h-6 rounded-full border text-[11px] font-medium whitespace-nowrap", map[tone])}>{children}</span>;
}

export function fmtDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
}

export function fmtNum(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("tr-TR");
}

/** Tiny dependency-free bar chart (server-renderable SVG). */
export function Bars({ series, labels, colors, height = 140 }: { series: number[][]; labels: string[]; colors: string[]; height?: number }) {
  const n = labels.length;
  const max = Math.max(1, ...series.flat());
  const w = 100; // percent-based x
  const groupW = w / Math.max(n, 1);
  const barW = (groupW * 0.7) / Math.max(series.length, 1);
  return (
    <div>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="Günlük grafik">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2="100" y1={height - f * (height - 12)} y2={height - f * (height - 12)} stroke="#1E1E24" strokeWidth="0.3" />
        ))}
        {labels.map((_, i) =>
          series.map((s, k) => {
            const h = ((s[i] ?? 0) / max) * (height - 12);
            const x = i * groupW + groupW * 0.15 + k * barW;
            return <rect key={`${i}-${k}`} x={x} y={height - h} width={barW * 0.9} height={h} fill={colors[k]} rx="0.4" />;
          }),
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
        <span>{labels[0]}</span>
        <span>{labels[Math.floor(n / 2)]}</span>
        <span>{labels[n - 1]}</span>
      </div>
    </div>
  );
}
