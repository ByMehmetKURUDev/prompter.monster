"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ScrollText } from "lucide-react";
import { cx } from "@/lib/cx";
import type { Locale } from "@/lib/i18n";
import { TEAM_RULES_MAX, type MyTeamRules } from "@/lib/team";

const COPY = {
  tr: {
    title: "Takım kuralları",
    intro:
      "Takımın ortak stack'i, kod kuralları ve marka sesi; üyelerin Studio'da ürettiği master prompt'lara, proje dosyalarına (CLAUDE.md, AGENTS.md…) ve API/MCP çıktılarına otomatik eklenir. Paylaşım sayfalarına eklenmez.",
    pending: "Kurallar takım aktifleşince prompt'lara eklenir; şimdiden hazırlayabilirsin.",
    readOnly: "Yalnız takım sahibi ve yöneticiler düzenleyebilir.",
    empty: "Henüz takım kuralı yok.",
    stack: "Stack ve altyapı",
    code: "Kod kuralları",
    voice: "Marka sesi ve ürün kuralları",
    stackPh: "Örn. Next.js 15 App Router + TypeScript, Supabase (Postgres + RLS), Tailwind + shadcn/ui, Vercel'e deploy, e-posta için Resend.",
    codePh: "Örn. TypeScript strict, any yok; doğrulama zod ile; testler Vitest + Playwright; conventional commits; her şema değişikliği migration ile; dosya adları kebab-case.",
    voicePh: "Örn. Arayüz dili Türkçe, samimi ama profesyonel ('sen' dili); WCAG AA; marka rengi #A3FF12; hata mesajları çözüm önerir.",
    enabled: "Üyelerin prompt'larına ekle",
    enabledHint: "Kapalıyken kurallar saklanır ama hiçbir prompt'a eklenmez. Üyeler de Studio'da proje bazında kapatabilir.",
    save: "Kaydet",
    saved: "Kaydedildi",
    failed: "Kaydedilemedi, tekrar dene.",
    updated: (d: string, u: string | null) => `Son güncelleme: ${d}${u ? ` · @${u}` : ""}`,
    statusOn: "Prompt'lara ekleniyor",
    statusOff: "Kapalı",
  },
  en: {
    title: "Team conventions",
    intro:
      "Your team's shared stack, coding conventions and brand voice — added automatically to the master prompts members build in the Studio, to the project files (CLAUDE.md, AGENTS.md…) and to API/MCP output. Never added to share pages.",
    pending: "The conventions are added to prompts once the team is active; you can prepare them now.",
    readOnly: "Only the team owner and admins can edit them.",
    empty: "No team conventions yet.",
    stack: "Stack & infrastructure",
    code: "Coding conventions",
    voice: "Brand voice & product rules",
    stackPh: "e.g. Next.js 15 App Router + TypeScript, Supabase (Postgres + RLS), Tailwind + shadcn/ui, deployed on Vercel, Resend for email.",
    codePh: "e.g. TypeScript strict, no any; validation with zod; tests with Vitest + Playwright; conventional commits; every schema change through a migration; kebab-case file names.",
    voicePh: "e.g. UI copy in English, friendly but professional; WCAG AA; brand colour #A3FF12; error messages suggest a fix.",
    enabled: "Add to members' prompts",
    enabledHint: "When off, the conventions are kept but not added to any prompt. Members can also switch them off per project in the Studio.",
    save: "Save",
    saved: "Saved",
    failed: "Couldn't save, please try again.",
    updated: (d: string, u: string | null) => `Last updated: ${d}${u ? ` · @${u}` : ""}`,
    statusOn: "Added to prompts",
    statusOff: "Off",
  },
} as const;

type Field = "stack" | "code" | "voice";

/** Hesabım → Takım kuralları (0021): owner/admins edit, members read. Rendered only for users in a team. */
export function TeamRulesPanel({ locale, rules }: { locale: Locale; rules: MyTeamRules }) {
  const c = COPY[locale];
  const router = useRouter();
  const [form, setForm] = useState({ stack: rules.stack, code: rules.code, voice: rules.voice, enabled: rules.enabled });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = form.stack !== rules.stack || form.code !== rules.code || form.voice !== rules.voice || form.enabled !== rules.enabled;
  const active = rules.team_status === "active";

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pm-locale": locale },
        body: JSON.stringify({ action: "rules", ...form }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || c.failed);
      setMsg({ ok: true, text: c.saved });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : c.failed });
    } finally {
      setBusy(false);
    }
  };

  const fields: [Field, string, string][] = [
    ["stack", c.stack, c.stackPh],
    ["code", c.code, c.codePh],
    ["voice", c.voice, c.voicePh],
  ];
  const updated = rules.updated_at
    ? c.updated(new Date(rules.updated_at).toLocaleDateString(locale === "en" ? "en-US" : "tr-TR", { dateStyle: "medium" }), rules.updated_by_username)
    : null;

  return (
    <section id="team-rules" aria-labelledby="team-rules-title" className="rounded-2xl bg-ink-800 border border-ink-600 p-5 scroll-mt-20">
      <div className="flex items-center gap-2 mb-1">
        <h2 id="team-rules-title" className="text-[11px] tracking-widest text-zinc-500 font-semibold flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5" aria-hidden /> {c.title.toUpperCase()}
        </h2>
        <span
          className={cx(
            "ml-auto text-[10px] px-2 py-0.5 rounded-full border",
            active && rules.enabled ? "border-violet/40 bg-violet/10 text-violet-400" : "border-ink-600 text-zinc-500",
          )}
        >
          {active && rules.enabled ? c.statusOn : c.statusOff}
        </span>
      </div>
      <p className="text-[12.5px] text-zinc-400 leading-relaxed">{c.intro}</p>
      {!active && <p className="mt-2 text-[12px] text-amber-200/90">{c.pending}</p>}

      {rules.can_edit ? (
        <div className="mt-4 space-y-4">
          {fields.map(([key, label, ph]) => {
            const max = TEAM_RULES_MAX[key];
            const id = `team-rules-${key}`;
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label htmlFor={id} className="text-[12px] font-semibold text-zinc-200">
                    {label}
                  </label>
                  <span className={cx("text-[10.5px] tabular-nums", form[key].length > max ? "text-red-300" : "text-zinc-500")}>
                    {form[key].length}/{max}
                  </span>
                </div>
                <textarea
                  id={id}
                  value={form[key]}
                  maxLength={max}
                  rows={key === "code" ? 5 : 3}
                  placeholder={ph}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-xl bg-ink-950 border border-ink-600 px-3 py-2 text-[13px] leading-relaxed placeholder:text-zinc-600 focus:outline-none focus:border-violet/60"
                />
              </div>
            );
          })}
          <label className="flex items-start gap-2.5 text-[12.5px] text-zinc-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="mt-0.5 accent-[#8B5CF6]"
            />
            <span>
              {c.enabled}
              <span className="block text-[11.5px] text-zinc-500">{c.enabledHint}</span>
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy || !dirty}
              className="h-9 px-4 rounded-lg bg-white text-black text-[12.5px] font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Check className="w-3.5 h-3.5" aria-hidden />}
              {c.save}
            </button>
            {msg && (
              <span role="status" className={cx("text-[12px]", msg.ok ? "text-lime" : "text-red-300")}>
                {msg.text}
              </span>
            )}
            {updated && <span className="ml-auto text-[11px] text-zinc-500">{updated}</span>}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rules.stack || rules.code || rules.voice ? (
            fields
              .filter(([key]) => rules[key])
              .map(([key, label]) => (
                <div key={key} className="rounded-xl bg-ink-950 border border-ink-600 p-3">
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1">{label}</div>
                  <p className="text-[12.5px] text-zinc-200 whitespace-pre-wrap leading-relaxed">{rules[key]}</p>
                </div>
              ))
          ) : (
            <p className="text-[12.5px] text-zinc-500">{c.empty}</p>
          )}
          <p className="text-[11.5px] text-zinc-500">
            {c.readOnly}
            {updated ? ` ${updated}` : ""}
          </p>
        </div>
      )}
    </section>
  );
}
