"use client";

import { Check, Copy, Crown, Download, FileArchive, FileText, Lock, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/site/LocaleProvider";
import { BUILDERS, EXPERTS, EXPORT_TARGETS, MEGA_CHAIN_STEPS } from "@/lib/data";
import { lhref } from "@/lib/i18n";
import { buildExpertPrompt, buildMegaPreview, buildMegaPrompt, exportJSON, sectionHeadings, slugify } from "@/lib/prompt";
import { copyText, downloadBytes, downloadText } from "@/lib/client";
import { PROJECT_FILES, buildProjectFiles } from "@/lib/exports";
import { zipFiles } from "@/lib/zip";
import { PRO_EXPORTS, type PlanId, type PlanLimits } from "@/lib/plans";
import type { StudioState } from "@/lib/types";
import { Spinner, cx } from "./ui";
import { useT } from "./useT";

/** Section cards of the expert view; titles come from the locale's `output.sections`. */
const SECTIONS = [
  { id: "role", tone: "bg-violet-500/10", icon: "🎭", lines: 8 },
  { id: "context", tone: "bg-blue-500/10", icon: "🗺️", lines: 12 },
  { id: "task", tone: "bg-lime/10", icon: "🎯", lines: 12 },
  { id: "arch", tone: "bg-orange-500/10", icon: "🏗️", lines: 12 },
  { id: "features", tone: "bg-ink-600/50", icon: "✅", lines: 12 },
  { id: "constraints", tone: "bg-red-500/10", icon: "⛔", lines: 12 },
  { id: "output", tone: "bg-ink-600/50", icon: "📦", lines: 12 },
  { id: "check", tone: "bg-emerald-500/10", icon: "🧪", lines: 8 },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Split a generated prompt into its sections by XML tag or ### heading (TR or EN, whatever the prompt's language). */
function sectionOf(prompt: string, id: SectionId): string {
  const xmlTag: Record<SectionId, string> = {
    role: "role",
    context: "context",
    task: "task",
    arch: "technical_architecture",
    features: "feature_matrix",
    constraints: "constraints",
    output: "output_format",
    check: "self_check",
  };
  const tag = xmlTag[id];
  const xm = prompt.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (xm) return xm[1].trim();
  for (const h of sectionHeadings(id)) {
    const m = prompt.match(new RegExp(`##+ ${h}[^\\n]*\\n([\\s\\S]*?)(?=\\n##+ |$)`));
    if (m) return m[1].trim();
  }
  return "";
}

/** Tab label: first word of the role, or two words when the first is a short acronym ("AI Agent", "QA Automation"). */
function shortRole(role: string): string {
  const words = role.split(/\s+/);
  return words[0].length <= 3 && words[1] && words[1] !== "/" && words[1] !== "&" ? `${words[0]} ${words[1]}` : words[0];
}

export function OutputPanel({
  s,
  released,
  tab,
  onTab,
  quality,
  tokens,
  onReset,
  onRefine,
  refining,
  refineCost = 3,
  refined,
  onClearRefined,
  toast,
  plan,
  limits,
}: {
  s: StudioState;
  released: boolean;
  tab: string;
  onTab: (t: string) => void;
  quality: number;
  tokens: number;
  onReset: () => void;
  onRefine: (expertId: string) => void;
  refining: boolean;
  /** Credit cost of one refine call. */
  refineCost?: number;
  refined: Record<string, string>;
  onClearRefined: (expertId: string) => void;
  toast: (m: string) => void;
  plan: PlanId;
  limits: PlanLimits;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const locale = useLocale();
  const t = useT().output;
  const pricing = lhref("/pricing", locale);

  const copy = async (text: string, key: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } else toast(t.copyFailed);
  };

  const activeExpert = EXPERTS.find((e) => e.id === tab);
  const basePrompt = useMemo(() => (activeExpert ? buildExpertPrompt(s, activeExpert.id) : ""), [s, activeExpert]);
  const shownPrompt = activeExpert && refined[activeExpert.id] ? refined[activeExpert.id] : basePrompt;
  const isRefined = Boolean(activeExpert && refined[activeExpert.id]);

  const doExport = (id: (typeof EXPORT_TARGETS)[number]["id"]) => {
    if (PRO_EXPORTS.has(id) && !limits.builders) {
      toast(t.exportProOnly(pricing));
      return;
    }
    const slug = slugify(s.name);
    switch (id) {
      case "md":
        return downloadText(`${slug}-master-prompt.md`, buildMegaPrompt({ ...s, format: s.format === "Claude XML" ? "Claude XML" : "ChatGPT Markdown" }), "text/markdown;charset=utf-8");
      case "json":
        return downloadText(`${slug}-prompt-monster.json`, exportJSON(s), "application/json;charset=utf-8");
      case "txt":
        return downloadText(`${slug}-master-prompt.txt`, buildMegaPrompt(s));
    }
  };

  /** Pro: project files for coding agents — one row, a folder (as .zip) or everything (.zip). */
  const exportProjectFiles = (id: string | "all") => {
    if (!limits.builders) {
      toast(t.exportProOnly(pricing));
      return;
    }
    const all = buildProjectFiles(s);
    const slug = slugify(s.name);
    if (id === "all") {
      downloadBytes(`${slug}-agent-files.zip`, zipFiles(all));
      toast(t.zipReady(Object.keys(all).length));
      return;
    }
    const def = PROJECT_FILES.find((f) => f.id === id);
    if (!def) return;
    const picked = Object.entries(all).filter(([p]) => (def.path.endsWith("/") ? p.startsWith(def.path) : p === def.path));
    if (picked.length === 1 && !def.path.endsWith("/")) {
      const [p, body] = picked[0];
      const name = p.split("/").pop() || p;
      return downloadText(name, body, p.endsWith(".json") ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8");
    }
    downloadBytes(`${slug}-${id}.zip`, zipFiles(Object.fromEntries(picked)));
  };

  return (
    <>
      {/* header + stats */}
      <div className="p-4 border-b border-ink-600 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-widest text-zinc-400">{t.header}</div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
            <span className="text-[10px] text-lime">LIVE</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-ink-800 border border-ink-600 p-3 flex items-center gap-2 min-w-0">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40" aria-hidden>
                <circle cx="20" cy="20" r="16" stroke="#1E1E24" strokeWidth="3" fill="none" />
                <circle cx="20" cy="20" r="16" stroke="#A3FF12" strokeWidth="3" fill="none" strokeDasharray={`${quality * 1.005} 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[11px] font-bold mono">{quality}</span>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500">QUALITY</div>
              <div className="text-[11px] font-semibold truncate">{quality >= 90 ? t.excellent : t.good}</div>
            </div>
          </div>
          <div className="rounded-xl bg-ink-800 border border-ink-600 p-3">
            <div className="text-[10px] text-zinc-500">TOKENS</div>
            <div className="text-[13px] font-mono font-bold">{tokens.toLocaleString(locale === "en" ? "en-US" : "tr-TR")}</div>
            <div className="text-[10px] text-zinc-600">{t.cost((tokens * 0.000003).toFixed(2))}</div>
          </div>
          <div className="rounded-xl bg-ink-800 border border-ink-600 p-3">
            <div className="text-[10px] text-zinc-500">OPTIMIZED</div>
            <div className="text-[11px] font-semibold flex items-center gap-1">
              <Crown className="w-3 h-3 text-lime" aria-hidden /> {s.format}
            </div>
            <div className="text-[10px] text-violet mt-1">{s.lang === "TR" ? t.langTR : t.langEN}</div>
          </div>
        </div>
        {s.lang === "EN" && /[çğıöşüÇĞİÖŞÜ]/.test([s.name, s.pitch, s.description, s.usp, s.audience.role, s.audience.pain, s.audience.budget].join(" ")) && (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 leading-relaxed">{t.langMismatch}</p>
        )}
      </div>

      {!released ? (
        <div className="flex-1 grid place-items-center p-8 text-center">
          <div className="space-y-4 max-w-[280px]">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-lime/20 to-violet/20 border border-ink-600 grid place-items-center text-4xl">👹</div>
            <div className="text-[14px] font-bold">{t.asleepTitle}</div>
            <div className="text-[12px] text-zinc-500 leading-relaxed">{t.asleepBody}</div>
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              {EXPERTS.slice(0, 6).map((e) => (
                <span key={e.id} className="px-2 py-1 rounded-full bg-ink-800 border border-ink-600 text-[10px]">
                  {e.emoji} {e.role.split("/")[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* tabs */}
          <div className="flex items-center gap-1 px-2 py-2 border-b border-ink-600 overflow-x-auto scrollbar-none">
            {s.experts.map((id) => {
              const e = EXPERTS.find((x) => x.id === id);
              if (!e) return null; // expert hidden in the admin catalog since this project was saved
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTab(id)}
                  className={cx(
                    "shrink-0 h-8 px-3 rounded-full border text-[11px] font-medium flex items-center gap-1.5",
                    tab === id ? "bg-violet text-white border-violet" : "bg-ink-800 border-ink-600 text-zinc-400",
                  )}
                >
                  <span>{e.emoji}</span>
                  {shortRole(e.role)}
                  {refined[id] && <span className="w-1.5 h-1.5 rounded-full bg-lime" title={t.refinedDot} />}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onTab("mega")}
              className={cx(
                "shrink-0 h-8 px-3 rounded-full border text-[11px] font-bold flex items-center gap-1.5",
                tab === "mega" ? "bg-lime text-black border-lime" : "bg-ink-800 border-ink-600 text-zinc-400",
              )}
            >
              {limits.megaChain ? <Zap className="w-3 h-3" aria-hidden /> : <Lock className="w-3 h-3" aria-hidden />} MEGA CHAIN
            </button>
            <button
              type="button"
              onClick={() => onTab("export")}
              className={cx(
                "shrink-0 h-8 px-3 rounded-full border text-[11px] font-bold flex items-center gap-1.5",
                tab === "export" ? "bg-white text-black border-white" : "bg-ink-800 border-ink-600 text-zinc-400",
              )}
            >
              <Download className="w-3 h-3" aria-hidden /> EXPORT
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {tab === "mega" && !limits.megaChain ? (
              <div className="p-4 space-y-4">
                <div className="rounded-xl bg-gradient-to-br from-lime/10 to-violet/10 border border-lime/30 p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-ink-950 border border-ink-600 grid place-items-center">
                    <Lock className="w-5 h-5 text-lime" aria-hidden />
                  </div>
                  <div className="mt-3 text-[14px] font-bold">{t.megaLockedTitle}</div>
                  <p className="mt-1 text-[12px] text-zinc-400 leading-relaxed">{t.megaLockedBody(MEGA_CHAIN_STEPS.length)}</p>
                  <Link href={pricing} className="mt-4 inline-flex h-9 px-4 rounded-lg bg-lime text-black text-[12px] font-bold items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" aria-hidden /> {t.goProPrice}
                  </Link>
                </div>
                <div className="rounded-xl bg-ink-800 border border-ink-600 p-4 opacity-60 select-none" aria-hidden>
                  <div className="text-[11px] font-bold tracking-widest text-zinc-500 mb-3">{t.previewSteps(MEGA_CHAIN_STEPS.length)}</div>
                  <div className="space-y-2">
                    {MEGA_CHAIN_STEPS.map((st, i) => (
                      <div key={st} className="flex items-center gap-3 text-[12px] text-zinc-500">
                        <span className="w-6 h-6 rounded-full bg-ink-950 border border-ink-600 grid place-items-center text-[10px] font-bold">{i + 1}</span>
                        {st}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : tab === "mega" ? (
              <div className="p-4 space-y-4">
                <div className="rounded-xl bg-ink-800 border border-ink-600 p-4">
                  <div className="text-[11px] font-bold tracking-widest text-lime mb-3">{t.megaSteps(MEGA_CHAIN_STEPS.length)}</div>
                  <div className="space-y-0 relative">
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-lime via-violet to-lime/20" />
                    {MEGA_CHAIN_STEPS.map((st, i) => (
                      <div key={st} className="relative flex gap-3 pb-4">
                        <div className="w-8 h-8 rounded-full bg-ink-950 border border-ink-400 grid place-items-center text-[11px] font-bold shrink-0 z-10">{i + 1}</div>
                        <div className="flex-1 rounded-xl bg-ink-950 border border-ink-600 p-3">
                          <div className="text-[12px] font-semibold">{st}</div>
                          <div className="text-[11px] text-zinc-500 mt-1">{t.stepDeliverables}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-ink-800 border border-ink-600 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold">MASTER PROMPT (One-Shot)</span>
                    <button
                      type="button"
                      onClick={() => copy(buildMegaPrompt(s), "mega")}
                      className="h-7 px-2.5 rounded-lg bg-ink-600 border border-ink-400 text-[11px] flex items-center gap-1"
                    >
                      {copied === "mega" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy All
                    </button>
                  </div>
                  <div className="mono text-[11px] leading-relaxed text-zinc-400 bg-ink-950 rounded-lg p-3 border border-ink-600 max-h-[300px] overflow-y-auto whitespace-pre-wrap scrollbar-thin">
                    {buildMegaPreview(s)}
                  </div>
                </div>
              </div>
            ) : tab === "export" ? (
              <div className="p-4 space-y-3">
                {EXPORT_TARGETS.map((x) => (
                  <div key={x.id} className="flex items-center justify-between p-3 rounded-xl bg-ink-800 border border-ink-600 hover:border-ink-400 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{x.icon}</span>
                      <div>
                        <div className="text-[12px] font-semibold">{x.name}</div>
                        <div className="text-[11px] text-zinc-500">{locale === "en" ? x.descEn : x.desc}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => doExport(x.id)}
                      className={cx("h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1", PRO_EXPORTS.has(x.id) && !limits.builders ? "bg-ink-950 border border-ink-600 text-zinc-500" : "bg-white text-black")}
                    >
                      {PRO_EXPORTS.has(x.id) && !limits.builders && <Lock className="w-3 h-3" aria-hidden />}
                      {PRO_EXPORTS.has(x.id) && !limits.builders ? "Pro" : t.download}
                    </button>
                  </div>
                ))}
                <div className="rounded-xl bg-ink-800 border border-ink-600 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold flex items-center gap-1.5">
                        {!limits.builders && <Lock className="w-3.5 h-3.5 text-lime" aria-hidden />} {t.agentFiles}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{t.agentFilesHint}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportProjectFiles("all")}
                      className={cx(
                        "shrink-0 h-8 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1.5",
                        limits.builders ? "bg-lime text-black" : "bg-ink-950 border border-ink-600 text-zinc-500",
                      )}
                    >
                      {limits.builders ? <FileArchive className="w-3.5 h-3.5" aria-hidden /> : <Lock className="w-3 h-3" aria-hidden />}
                      {limits.builders ? t.downloadAllZip : "Pro"}
                    </button>
                  </div>
                  <div className="mt-3 divide-y divide-ink-600 rounded-lg border border-ink-600 bg-ink-950">
                    {PROJECT_FILES.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-[11.5px] font-mono text-zinc-200 truncate">{f.label}</div>
                          <div className="text-[10.5px] text-zinc-500 truncate">
                            {f.tool} · {f.desc[locale]}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => exportProjectFiles(f.id)}
                          aria-label={`${t.download}: ${f.label}`}
                          className={cx(
                            "shrink-0 w-8 h-8 rounded-lg grid place-items-center border",
                            limits.builders ? "bg-ink-800 border-ink-600 hover:border-ink-400 text-zinc-200" : "bg-ink-950 border-ink-600 text-zinc-600",
                          )}
                        >
                          {limits.builders ? <Download className="w-3.5 h-3.5" aria-hidden /> : <Lock className="w-3 h-3" aria-hidden />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-lime/10 to-violet/10 border border-lime/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-bold flex items-center gap-1.5">
                      {!limits.builders && <Lock className="w-3.5 h-3.5 text-lime" aria-hidden />} Export to Builders
                    </div>
                    {!limits.builders && (
                      <Link href={pricing} className="text-[11px] text-lime font-semibold">
                        {t.goPro}
                      </Link>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">{limits.builders ? t.buildersOn : t.buildersOff}</div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {BUILDERS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          if (!limits.builders) {
                            toast(t.buildersProOnly(pricing));
                            return;
                          }
                          const fmt = b === "Cursor" || b === "Windsurf" ? "Cursor Rules" : b === "v0" ? "v0" : b === "Lovable" || b === "Bolt" ? "Lovable/Bolt" : "ChatGPT Markdown";
                          copy(buildMegaPrompt({ ...s, format: fmt }), `b:${b}`);
                        }}
                        className={cx("h-9 rounded-lg bg-ink-950 border border-ink-600 text-[11px] font-medium hover:border-ink-400 flex items-center justify-center gap-1", !limits.builders && "opacity-60")}
                      >
                        {copied === `b:${b}` ? <Check className="w-3 h-3 text-lime" /> : null}
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeExpert ? (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeExpert.emoji}</span>
                    <div>
                      <div className="text-[13px] font-bold">{activeExpert.role}</div>
                      <div className="text-[11px] text-zinc-500">{activeExpert.org}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(shownPrompt, activeExpert.id)}
                    className="h-8 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[11px] flex items-center gap-1.5 hover:bg-ink-600"
                  >
                    {copied === activeExpert.id ? (
                      <>
                        <Check className="w-3 h-3 text-lime" /> {t.copied}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> {t.copy}
                      </>
                    )}
                  </button>
                </div>

                {isRefined && (
                  <div className="flex items-center justify-between rounded-lg bg-lime/10 border border-lime/20 px-3 py-2 text-[11px]">
                    <span className="text-lime flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {t.refinedVersion}
                    </span>
                    <button type="button" onClick={() => onClearRefined(activeExpert.id)} className="text-zinc-400 hover:text-white">
                      {t.backToOriginal}
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {SECTIONS.map((sec) => {
                    const text = sectionOf(shownPrompt, sec.id);
                    const title = t.sections[sec.id];
                    return (
                      <div key={sec.id} className="rounded-xl bg-ink-800 border border-ink-600 overflow-hidden">
                        <div className={cx("h-8 px-3 flex items-center justify-between border-b border-ink-600", sec.tone)}>
                          <span className="text-[11px] font-bold tracking-widest flex items-center gap-1.5">
                            <span>{sec.icon}</span>
                            {title}
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(text, `${activeExpert.id}:${sec.id}`)}
                            aria-label={t.copySection(title)}
                            className="w-6 h-6 rounded-md bg-ink-950 border border-ink-600 grid place-items-center"
                          >
                            {copied === `${activeExpert.id}:${sec.id}` ? <Check className="w-3 h-3 text-lime" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="p-3 mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap max-h-[180px] overflow-y-auto scrollbar-thin">
                          {text || "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-ink-950 border border-ink-600 p-3">
                  <div className="text-[11px] font-semibold mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" aria-hidden /> {t.fullPreview}
                  </div>
                  <div className="mono text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap max-h-[400px] overflow-y-auto bg-ink-800 rounded-lg p-3 border border-ink-600 scrollbar-thin">
                    {shownPrompt}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRefine(activeExpert.id)}
                  disabled={refining}
                  className="w-full h-10 rounded-xl bg-ink-600 border border-ink-400 text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-ink-500 disabled:opacity-60"
                >
                  {refining ? <Spinner className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-violet" aria-hidden />}
                  {refining ? t.refining : t.refine(refineCost)}
                </button>
              </div>
            ) : null}
          </div>

          <div className="p-3 border-t border-ink-600 flex items-center justify-between">
            <div className="text-[11px] text-zinc-500 flex items-center gap-2">
              <Users className="w-3 h-3" aria-hidden /> {t.teamActive(s.experts.length)}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onReset} className="h-8 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[11px]">
                {t.reset}
              </button>
              <button type="button" onClick={() => onTab("export")} className="h-8 px-3 rounded-lg bg-lime text-black text-[11px] font-bold">
                Export All
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
