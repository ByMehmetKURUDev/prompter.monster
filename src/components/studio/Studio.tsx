"use client";

import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXPERTS } from "@/lib/data";
import { ApiError, enhanceDescription, refinePrompt, suggestStack } from "@/lib/client";
import { buildExpertPrompt, estimateTokens, qualityScore } from "@/lib/prompt";
import type { StudioState } from "@/lib/types";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { OutputPanel } from "./OutputPanel";
import { Sidebar } from "./Sidebar";
import { Step1Idea } from "./Step1Idea";
import { Step2Stack } from "./Step2Stack";
import { Step3Features } from "./Step3Features";
import { Step4Experts } from "./Step4Experts";
import { StepBar } from "./StepBar";
import { Toast } from "./ui";
import { useStudio } from "./useStudio";

export function Studio({ dailyLimit }: { dailyLimit: number }) {
  const { state: s, patch, toggle, reset, setArray } = useStudio();
  const [navTab, setNavTab] = useState("Studio");
  const [toast, setToast] = useState<string | null>(null);
  const [released, setReleased] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [outTab, setOutTab] = useState<string>("cto");
  const [enhancing, setEnhancing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [aiPicks, setAiPicks] = useState<string[] | null>(null);
  const [aiWhy, setAiWhy] = useState("");
  const [refining, setRefining] = useState(false);
  const [refined, setRefined] = useState<Record<string, string>>({});
  const [usedToday, setUsedToday] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const quality = useMemo(() => qualityScore(s), [s]);
  const tokens = useMemo(() => estimateTokens(s), [s]);

  const say = useCallback((m: string, ms = 2500) => {
    setToast(m);
    window.setTimeout(() => setToast(null), ms);
  }, []);

  const onApiError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError) {
        if (e.code === "rate_limited") setUsedToday(dailyLimit);
        say(e.message, 4000);
      } else say("Beklenmeyen bir hata oldu.", 3000);
    },
    [dailyLimit, say],
  );

  const trackRemaining = useCallback((remaining: number) => setUsedToday(Math.max(0, dailyLimit - remaining)), [dailyLimit]);

  /* ---- AI actions ---- */
  const enhance = async () => {
    if (enhancing) return;
    setEnhancing(true);
    try {
      const r = await enhanceDescription(s);
      patch({ description: r.text });
      trackRemaining(r.remaining);
      say("Açıklama Claude ile güçlendirildi ✨");
    } catch (e) {
      onApiError(e);
    } finally {
      setEnhancing(false);
    }
  };

  const suggest = async () => {
    if (suggesting) return;
    setSuggesting(true);
    try {
      const r = await suggestStack(s);
      const all = Object.values(r.picks).flat();
      setAiPicks(all);
      setAiWhy(r.why);
      (Object.keys(r.picks) as Array<keyof typeof r.picks>).forEach((k) => {
        const key = k as "frontend" | "backend" | "database" | "auth" | "ai" | "realtime" | "search";
        if (r.picks[k].length) setArray(key, r.picks[k]);
      });
      trackRemaining(r.remaining);
      say("Stack Claude tarafından önerildi — istediğini değiştirebilirsin.");
    } catch (e) {
      onApiError(e);
    } finally {
      setSuggesting(false);
    }
  };

  const refine = async (expertId: string) => {
    if (refining) return;
    const e = EXPERTS.find((x) => x.id === expertId);
    if (!e) return;
    setRefining(true);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await refinePrompt(
        { prompt: buildExpertPrompt(s, expertId), expertRole: e.role, lang: s.lang, format: s.format },
        (acc) => setRefined((prev) => ({ ...prev, [expertId]: acc })),
        ac.signal,
      );
      setUsedToday((n) => Math.min(dailyLimit, n + 1));
      say("Prompt iyileştirildi ✨");
    } catch (err) {
      setRefined((prev) => {
        const next = { ...prev };
        delete next[expertId];
        return next;
      });
      onApiError(err);
    } finally {
      setRefining(false);
    }
  };

  /* ---- wizard actions ---- */
  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setGenerating(false);
      setReleased(true);
      setOutTab(s.experts[0] ?? "cto");
    }, 1400);
  };

  const onNew = () => {
    reset(true);
    setReleased(false);
    setRefined({});
    setAiPicks(null);
    setAiWhy("");
    say("Yeni canavar — boş proje açıldı");
  };

  const onTemplate = (name: string) => {
    patch({ name: name.replace(" Clone", ""), pitch: `${name} — ${s.pitch || "kendi pazarın için yeniden düşün"}`, step: 1 });
    say(`Şablon uygulandı: ${name}`);
  };

  const onNavTab = (t: string) => {
    setNavTab(t);
    say(t === "Studio" ? "Studio aktif • Canavar fabrikası açık 👹" : `${t} çok yakında • Studio aktif`);
  };

  const setStep = (n: 1 | 2 | 3 | 4) => patch({ step: n });

  const clearRefined = useCallback((id: string) => {
    setRefined((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // If the active output tab's expert gets deselected, fall back to the first selected expert.
  useEffect(() => {
    if (outTab !== "mega" && outTab !== "export" && !s.experts.includes(outTab)) {
      setOutTab(s.experts[0] ?? "mega");
    }
  }, [s.experts, outTab]);

  const toggleStack = (key: "frontend" | "backend" | "database" | "auth" | "ai" | "realtime" | "search", v: string) => toggle(key, v);

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <Nav active={navTab} onTab={onNavTab} />
      <Toast message={toast} />

      <div className="flex">
        <Sidebar
          projectType={s.projectType}
          onProjectType={(id) => patch({ projectType: id })}
          onNew={onNew}
          onTemplate={onTemplate}
          usedToday={usedToday}
          dailyLimit={dailyLimit}
        />

        <main className="flex-1 min-w-0 bg-ink-950">
          <StepBar step={s.step} onStep={setStep} quality={quality} />

          <div className="px-4 lg:px-8 py-6 max-w-[900px]">
            {s.step === 1 && <Step1Idea s={s} patch={patch} toggle={toggle} onEnhance={enhance} enhancing={enhancing} />}
            {s.step === 2 && <Step2Stack s={s} toggle={toggleStack} onSuggest={suggest} suggesting={suggesting} aiPicks={aiPicks} aiWhy={aiWhy} />}
            {s.step === 3 && <Step3Features s={s} toggle={toggle} />}
            {s.step === 4 && <Step4Experts s={s} toggle={toggle} patch={patch} onGenerate={generate} generating={generating} tokens={tokens} />}

            <div className="mt-8 flex items-center justify-between border-t border-ink-600 pt-6">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, s.step - 1) as StudioState["step"])}
                disabled={s.step === 1}
                className="h-10 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[13px] disabled:opacity-40"
              >
                ← Geri
              </button>
              <button
                type="button"
                onClick={() => setStep(Math.min(4, s.step + 1) as StudioState["step"])}
                disabled={s.step === 4}
                className="h-10 px-5 rounded-xl bg-white text-black font-semibold text-[13px] disabled:opacity-40 flex items-center gap-1"
              >
                İleri <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* Output on smaller screens */}
          <div className="xl:hidden border-t border-ink-600 bg-ink-900">
            <div className="flex flex-col max-h-[80vh]">
              <OutputPanel
                s={s}
                released={released}
                tab={outTab}
                onTab={setOutTab}
                quality={quality}
                tokens={tokens}
                onReset={() => {
                  setReleased(false);
                  setRefined({});
                }}
                onRefine={refine}
                refining={refining}
                refined={refined}
                onClearRefined={clearRefined}
                toast={say}
              />
            </div>
          </div>

          <Footer />
        </main>

        <aside className="hidden xl:flex w-[400px] shrink-0 flex-col border-l border-ink-600 bg-ink-900 h-[calc(100vh-56px)] sticky top-[56px]">
          <OutputPanel
            s={s}
            released={released}
            tab={outTab}
            onTab={setOutTab}
            quality={quality}
            tokens={tokens}
            onReset={() => {
              setReleased(false);
              setRefined({});
            }}
            onRefine={refine}
            refining={refining}
            refined={refined}
            onClearRefined={clearRefined}
            toast={say}
          />
        </aside>
      </div>
    </div>
  );
}
