"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl bg-ink-800 border border-ink-600", className)}>{children}</div>;
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("text-[11px] font-semibold tracking-widest text-zinc-400", className)}>{children}</div>;
}

export function StepHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-ink-800 border border-ink-600 grid place-items-center text-lg">{icon}</div>
      <div>
        <h2 className="text-[18px] font-bold">{title}</h2>
        <p className="text-[12px] text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { variant?: "md" | "sm" }) {
  const { className, variant = "md", ...rest } = props;
  return (
    <input
      {...rest}
      className={cx(
        "w-full rounded-xl bg-ink-950 border border-ink-600 focus:border-ink-400 focus:outline-none placeholder:text-zinc-600",
        variant === "md" ? "h-11 px-4 text-[14px]" : "h-9 px-3 text-[12px] rounded-lg",
        className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cx(
        "w-full rounded-xl bg-ink-950 border border-ink-600 p-4 text-[13px] leading-relaxed focus:border-ink-400 focus:outline-none resize-none placeholder:text-zinc-600",
        className,
      )}
    />
  );
}

/** Toggle pill used for stack / monetization / compliance chips. */
export function Pill({
  active,
  onClick,
  children,
  tone = "white",
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: "white" | "lime";
  className?: string;
}) {
  const on = tone === "lime" ? "bg-lime text-black border-lime" : "bg-white text-black border-white";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "relative px-3 py-1.5 rounded-full text-[12px] border transition flex items-center gap-1.5",
        active ? on : "bg-ink-950 border-ink-600 text-zinc-400 hover:border-ink-400 hover:text-zinc-200",
        className,
      )}
    >
      {children}
      {active && <Check className="w-3 h-3" aria-hidden />}
    </button>
  );
}

export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cx(
        "w-5 h-5 rounded-md grid place-items-center border shrink-0",
        checked ? "bg-lime border-lime text-black" : "bg-ink-800 border-ink-600",
      )}
      aria-hidden
    >
      {checked && <Check className="w-3 h-3" />}
    </div>
  );
}

export function Radio({ checked, tone = "lime" }: { checked: boolean; tone?: "lime" | "violet" }) {
  const on = tone === "lime" ? "bg-lime border-lime text-black" : "bg-violet border-violet text-white";
  return (
    <div className={cx("w-5 h-5 rounded-full border grid place-items-center shrink-0", checked ? on : "border-ink-400")} aria-hidden>
      {checked && <Check className="w-3 h-3" />}
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed top-[64px] left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-ink-800 border border-ink-400 text-[12px] text-white shadow-xl flex items-center gap-2 max-w-[92vw]"
    >
      <span className="w-2 h-2 rounded-full bg-lime animate-pulse shrink-0" />
      <span className="truncate">{message}</span>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={cx("border-2 border-current/30 border-t-current rounded-full animate-spin", className ?? "w-4 h-4")} aria-hidden />;
}
