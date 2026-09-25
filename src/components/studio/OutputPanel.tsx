"use client";

import { Check, Copy, Crown, Download, FileText, Sparkles, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { BUILDERS, EXPERTS, EXPORT_TARGETS, MEGA_CHAIN_STEPS } from "@/lib/data";
import { buildExpertPrompt, buildMegaPreview, buildMegaPrompt, exportClaudeMd, exportCursorRules, exportJSON, slugify } from "@/lib/prompt";
import { copyText, downloadText } from "@/lib/client";
import type { StudioState } from "@/lib/types";
import { Spinner, cx } from "./ui";

const SECTIONS = [
  { id: "role", title: "ROL", tone: "bg-violet-500/10", icon: "🎭", lines: 8 },
  { id: "context", title: "BAĞLAM", tone: "bg-blue-500/10", icon: "🗺️", lines: 12 },
  { id: "task", title: "GÖREV", tone: "bg-lime/10", icon: "🎯", lines: 12 },
  { id: "arch", title: "TEKNİK MİMARİ", tone: "bg-orange-500/10", icon: "🏗️", lines: 12 },
  { id: "features", title: "ÖZELLİK MATRİSİ", tone: "bg-ink-600/50", icon: "✅", lines: 12 },
  { id: "constraints", title: "KISITLAR", tone: "bg-red-500/10", icon: "⛔", lines: 12 },
  { id: "output", title: "ÇIKTI FORMATI", tone: "bg-ink-600/50", icon: "📦", lines: 12 },
] as const;

/** Split a generated prompt into its sections by XML tag or ### heading. */
function sectionOf(prompt: string, id: string): string {
  const xmlTag: Record<string, string> = {
    role: "role",
    context: "context",
    task: "task",
    arch: "technical_architecture",
    features: "feature_matrix",
    constraints: "constraints",
    output: "output_format",
  };
  const mdHead: Record<string, string[]> = {
    role: ["ROL", "ROLE"],
    context: ["BAĞLAM", "CONTEXT"],
    task: ["GÖREV", "TASK"],
    arch: ["TEKNİK MİMARİ", "TECHNICAL ARCHITECTURE"],
    features: ["ÖZELLİK MATRİSİ", "FEATURE MATRIX"],
    constraints: ["KISITLAR", "CONSTRAINTS"],
    output: ["ÇIKTI FORMATI", "OUTPUT FORMAT"],
  };
  const tag = xmlTag[id];
  const xm = prompt.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (xm) return xm[1].trim();
  for (const h of mdHead[id] ?? []) {
    const m = prompt.match(new RegExp(`##+ ${h}[^\\n]*\\n([\\s\\S]*?)(?=\\n##+ |$)`));
    if (m) return m[1].trim();
  }
  return "";
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
  refined,
  onClearRefined,
  toast,
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
  refined: Record<string, string>;
  onClearRefined: (expertId: string) => void;
  toast: (m: string) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } else toast("Panoya kopyalanamadı — metni elle seçin.");
  };

  const activeExpert = EXPERTS.find((e) => e.id === tab);
  const basePrompt = useMemo(() => (activeExpert ? buildExpertPrompt(s, activeExpert.id) : ""), [s, activeExpert]);
  const shownPrompt = activeExpert && refined[activeExpert.id] ? refined[activeExpert.id] : basePrompt;
  const isRefined = Boolean(activeExpert && refined[activeExpert.id]);

  const doExport = (id: (typeof EXPORT_TARGETS)[number]["id"]) => {
    const slug = slugify(s.name);
    switch (id) {
      case "md":
        return downloadText(`${slug}-master-prompt.md`, buildMegaPrompt({ ...s, format: s.format === "Claude XML" ? "Claude XML" : "ChatGPT Markdown" }), "text/markdown;charset=utf-8");
      case "json":
        return downloadText(`${slug}-prompt-monster.json`, exportJSON(s), "application/json;charset=utf-8");
      case "cursorrules":
        return downloadText(".cursorrules", exportCursorRules(s));
      case "claude":
        return downloadText("CLAUDE.md", exportClaudeMd(s), "text/markdown;charset=utf-8");
      case "txt":
        return downloadText(`${slug}-master-prompt.txt`, buildMegaPrompt(s));
    }
  };

  return (
    <>
      {/* header + stats */}
      <div className="p-4 border-b border-ink-600 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-widest text-zinc-400">OUTPUT • CANAVAR FABRİKASI</div>
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
              <div className="text-[11px] font-semibold truncate">{quality >= 90 ? "Mükemmel" : "İyi"}</div>
            </div>
          </div>
          <div className="rounded-xl bg-ink-800 border border-ink-600 p-3">
            <div className="text-[10px] text-zinc-500">TOKENS</div>
            <div className="text-[13px] font-mono font-bold">{tokens.toLocaleString("tr-TR")}</div>
            <div className="text-[10px] text-zinc-600">~${(tokens * 0.000003).toFixed(2)} maliyet</div>
          </div>
          <div className="rounded-xl bg-ink-800 border border-ink-600 p-3">
            <div className="text-[10px] text-zinc-500">OPTIMIZED</div>
            <div className="text-[11px] font-semibold flex items-center gap-1">
              <Crown className="w-3 h-3 text-lime" aria-hidden /> {s.format}
            </div>
            <div className="text-[10px] text-violet mt-1">{s.lang === "TR" ? "Türkçe çıktı" : "English output"}</div>
          </div>
        </div>
      </div>

      {!released ? (
        <div className="flex-1 grid place-items-center p-8 text-center">
          <div className="space-y-4 max-w-[280px]">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-lime/20 to-violet/20 border border-ink-600 grid place-items-center text-4xl">👹</div>
            <div className="text-[14px] font-bold">Canavar uyuyor...</div>
            <div className="text-[12px] text-zinc-500 leading-relaxed">
              Fikir, teknoloji ve özellikleri tamamla, uzmanları seç ve canavarı serbest bırak. 12 uzman sana özel 500+ kelimelik ultra promptlar üretecek.
            </div>
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
              const e = EXPERTS.find((x) => x.id === id)!;
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
                  {e.role.split(" ")[0]}
                  {refined[id] && <span className="w-1.5 h-1.5 rounded-full bg-lime" title="AI ile iyileştirildi" />}
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
              <Zap className="w-3 h-3" aria-hidden /> MEGA CHAIN
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
            {tab === "mega" ? (
              <div className="p-4 space-y-4">
                <div className="rounded-xl bg-ink-800 border border-ink-600 p-4">
                  <div className="text-[11px] font-bold tracking-widest text-lime mb-3">MEGA CHAIN • {MEGA_CHAIN_STEPS.length} ADIM</div>
                  <div className="space-y-0 relative">
                    <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-lime via-violet to-lime/20" />
                    {MEGA_CHAIN_STEPS.map((st, i) => (
                      <div key={st} className="relative flex gap-3 pb-4">
                        <div className="w-8 h-8 rounded-full bg-ink-950 border border-ink-400 grid place-items-center text-[11px] font-bold shrink-0 z-10">{i + 1}</div>
                        <div className="flex-1 rounded-xl bg-ink-950 border border-ink-600 p-3">
                          <div className="text-[12px] font-semibold">{st}</div>
                          <div className="text-[11px] text-zinc-500 mt-1">Prompt + Checklist + Kod iskeleti</div>
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
                {EXPORT_TARGETS.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-ink-800 border border-ink-600 hover:border-ink-400 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.icon}</span>
                      <div>
                        <div className="text-[12px] font-semibold">{t.name}</div>
                        <div className="text-[11px] text-zinc-500">{t.desc}</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => doExport(t.id)} className="h-8 px-3 rounded-lg bg-white text-black text-[11px] font-bold">
                      İndir
                    </button>
                  </div>
                ))}
                <div className="rounded-xl bg-gradient-to-br from-lime/10 to-violet/10 border border-lime/20 p-4">
                  <div className="text-[12px] font-bold">Export to Builders</div>
                  <div className="text-[11px] text-zinc-500 mt-1">Aracın formatında kopyalar; yapıştırman yeter.</div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {BUILDERS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          const fmt = b === "Cursor" || b === "Windsurf" ? "Cursor Rules" : b === "v0" ? "v0" : b === "Lovable" || b === "Bolt" ? "Lovable/Bolt" : "ChatGPT Markdown";
                          copy(buildMegaPrompt({ ...s, format: fmt }), `b:${b}`);
                        }}
                        className="h-9 rounded-lg bg-ink-950 border border-ink-600 text-[11px] font-medium hover:border-ink-400 flex items-center justify-center gap-1"
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
                        <Check className="w-3 h-3 text-lime" /> Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Kopyala
                      </>
                    )}
                  </button>
                </div>

                {isRefined && (
                  <div className="flex items-center justify-between rounded-lg bg-lime/10 border border-lime/20 px-3 py-2 text-[11px]">
                    <span className="text-lime flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Claude ile iyileştirilmiş sürüm
                    </span>
                    <button type="button" onClick={() => onClearRefined(activeExpert.id)} className="text-zinc-400 hover:text-white">
                      Orijinale dön
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {SECTIONS.map((sec) => {
                    const text = sectionOf(shownPrompt, sec.id);
                    return (
                      <div key={sec.id} className="rounded-xl bg-ink-800 border border-ink-600 overflow-hidden">
                        <div className={cx("h-8 px-3 flex items-center justify-between border-b border-ink-600", sec.tone)}>
                          <span className="text-[11px] font-bold tracking-widest flex items-center gap-1.5">
                            <span>{sec.icon}</span>
                            {sec.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => copy(text, `${activeExpert.id}:${sec.id}`)}
                            aria-label={`${sec.title} bölümünü kopyala`}
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
                    <FileText className="w-3 h-3" aria-hidden /> TAM PROMPT ÖNİZLEME
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
                  {refining ? "Claude iyileştiriyor..." : "Bu promptu iyileştir ✨"}
                </button>
              </div>
            ) : null}
          </div>

          <div className="p-3 border-t border-ink-600 flex items-center justify-between">
            <div className="text-[11px] text-zinc-500 flex items-center gap-2">
              <Users className="w-3 h-3" aria-hidden /> Team • {s.experts.length} uzman aktif
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onReset} className="h-8 px-3 rounded-lg bg-ink-800 border border-ink-600 text-[11px]">
                Sıfırla
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
