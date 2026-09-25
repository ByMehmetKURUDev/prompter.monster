"use client";

import { ChevronRight, History, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXPERTS } from "@/lib/data";
import type { MeResponse } from "@/lib/db";
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
import { Toast, cx } from "./ui";
import { useStudio } from "./useStudio";

type VersionRow = { id: string; version: number; format: string; lang: string; experts: string[]; created_at: string };

export function Studio({ dailyLimit }: { dailyLimit: number }) {
  const { state: s, patch, toggle, reset, setArray, load, hydrated } = useStudio();
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

  // Account & library
  const [me, setMe] = useState<MeResponse | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const lastSaved = useRef<string>("");

  const quality = useMemo(() => qualityScore(s), [s]);
  const tokens = useMemo(() => estimateTokens(s), [s]);

  const say = useCallback((m: string, ms = 2500) => {
    setToast(m);
    window.setTimeout(() => setToast(null), ms);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch("/api/me", { cache: "no-store" });
      if (r.ok) setMe((await r.json()) as MeResponse);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  // Track unsaved changes once a project is loaded/saved.
  useEffect(() => {
    if (!hydrated) return;
    const now = JSON.stringify(s);
    setDirty(now !== lastSaved.current);
  }, [s, hydrated]);

  const loadProject = useCallback(
    async (id: string, version?: number | null) => {
      try {
        const r = await fetch(`/api/projects/${id}${version ? `?version=${version}` : ""}`, { cache: "no-store" });
        if (!r.ok) {
          say(r.status === 401 ? "Bu projeyi açmak için giriş yapın." : "Proje yüklenemedi.", 3500);
          return;
        }
        const data = (await r.json()) as {
          project: { id: string; state: StudioState };
          versions: VersionRow[];
          generation: { refined: Record<string, string> | null; version: number } | null;
        };
        load(data.project.state);
        lastSaved.current = JSON.stringify({ ...data.project.state });
        setProjectId(data.project.id);
        setVersions(data.versions);
        setDirty(false);
        if (data.generation) {
          setRefined(data.generation.refined ?? {});
          setActiveVersion(data.generation.version);
          setReleased(true);
          setOutTab(data.project.state.experts[0] ?? "mega");
        } else {
          setActiveVersion(null);
          setReleased(false);
          setRefined({});
        }
        say(`Proje yüklendi: ${data.project.state.name || "Adsız"}${data.generation ? ` • v${data.generation.version}` : ""}`);
      } catch {
        say("Proje yüklenemedi.", 3000);
      }
    },
    [load, say],
  );

  /** Public share → a fresh, unsaved copy of that project in my Studio. */
  const forkShared = useCallback(
    async (slug: string) => {
      try {
        const r = await fetch(`/api/share/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!r.ok) {
          say("Paylaşım bulunamadı ya da kaldırılmış.", 3500);
          return;
        }
        const data = (await r.json()) as { name: string; state: StudioState };
        load({ ...data.state, step: 1 });
        setProjectId(null);
        setVersions([]);
        setActiveVersion(null);
        setReleased(false);
        setRefined({});
        lastSaved.current = "";
        const url = new URL(window.location.href);
        url.searchParams.delete("fork");
        window.history.replaceState(null, "", url.toString());
        say(`"${data.name || "Adsız"}" çatallandı — artık senin kopyan, istediğin gibi değiştir.`, 4000);
      } catch {
        say("Paylaşım yüklenemedi.", 3000);
      }
    },
    [load, say],
  );

  // ?project=<id>&version=<n>  |  ?new=1  |  ?fork=<slug>
  useEffect(() => {
    if (!hydrated) return;
    const sp = new URLSearchParams(window.location.search);
    const id = sp.get("project");
    const v = Number(sp.get("version"));
    const fork = sp.get("fork");
    if (id) loadProject(id, Number.isFinite(v) && v > 0 ? v : null);
    else if (fork) forkShared(fork);
    else if (sp.get("new") === "1") {
      reset(true);
      setProjectId(null);
      setVersions([]);
    }
    // Back from checkout: the webhook flips the plan within seconds — poll until it lands.
    if (sp.get("upgraded") === "1") {
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      window.history.replaceState(null, "", url.toString());
      say("Ödeme alındı 🎉 Pro birkaç saniye içinde aktif olur…", 6000);
      let tries = 0;
      const timer = window.setInterval(async () => {
        tries += 1;
        try {
          const r = await fetch("/api/me", { cache: "no-store" });
          const j = (await r.json()) as MeResponse;
          setMe(j);
          if (j.plan === "pro") {
            window.clearInterval(timer);
            say("Monster Pro aktif — 12 uzman ve günde 200 AI çağrısı senin 👹", 6000);
          }
        } catch {
          /* retry */
        }
        if (tries >= 15) window.clearInterval(timer);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  /** Create/copy the public link for the active version. */
  const [sharing, setSharing] = useState(false);
  const share = useCallback(async () => {
    if (sharing || !projectId || !activeVersion) return;
    setSharing(true);
    try {
      const r = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, version: activeVersion }),
      });
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string; created?: boolean };
      if (!r.ok || !j.url) {
        say(j.error ?? "Paylaşım bağlantısı oluşturulamadı.", 3500);
        return;
      }
      const ok = await navigator.clipboard.writeText(j.url).then(() => true, () => false);
      say(ok ? `Herkese açık bağlantı kopyalandı: ${j.url}` : `Herkese açık bağlantı: ${j.url}`, 6000);
      window.open(j.url, "_blank", "noopener");
    } catch {
      say("Paylaşım bağlantısı oluşturulamadı.", 3000);
    } finally {
      setSharing(false);
    }
  }, [sharing, projectId, activeVersion, say]);

  const save = useCallback(
    async (snapshot: boolean) => {
      if (saving) return null;
      if (!me?.user) {
        say("Kaydetmek için giriş yapın — sağ üstteki Giriş düğmesi.", 3500);
        return null;
      }
      setSaving(true);
      try {
        const r = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: projectId ?? undefined, state: s, snapshot, refined: snapshot ? refined : undefined }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          say(j.error ?? "Kaydedilemedi.", 3500);
          return null;
        }
        const data = (await r.json()) as { id: string; version: number | null };
        setProjectId(data.id);
        lastSaved.current = JSON.stringify(s);
        setDirty(false);
        if (data.version) {
          setActiveVersion(data.version);
          setVersions((prev) => [
            { id: `local-${data.version}`, version: data.version!, format: s.format, lang: s.lang, experts: s.experts, created_at: new Date().toISOString() },
            ...prev,
          ]);
        }
        const url = new URL(window.location.href);
        url.searchParams.set("project", data.id);
        url.searchParams.delete("new");
        window.history.replaceState(null, "", url.toString());
        say(data.version ? `Kaydedildi • v${data.version}` : "Proje kaydedildi");
        return data;
      } catch {
        say("Kaydedilemedi.", 3000);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [me, projectId, refined, s, saving, say],
  );

  const onApiError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError) {
        if (e.code === "rate_limited") setUsedToday(dailyLimit);
        say(e.message, 4000);
      } else say("Beklenmeyen bir hata oldu.", 3000);
      refreshMe();
    },
    [dailyLimit, say, refreshMe],
  );

  const trackRemaining = useCallback(
    (remaining: number) => {
      setUsedToday(Math.max(0, dailyLimit - remaining));
      refreshMe();
    },
    [dailyLimit, refreshMe],
  );

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
      refreshMe();
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
    window.setTimeout(async () => {
      setGenerating(false);
      setReleased(true);
      setOutTab(s.experts[0] ?? "cto");
      if (me?.user) await save(true); // her üretim bir versiyon olarak saklanır
    }, 1400);
  };

  const onNew = () => {
    reset(true);
    setReleased(false);
    setRefined({});
    setAiPicks(null);
    setAiWhy("");
    setProjectId(null);
    setVersions([]);
    setActiveVersion(null);
    lastSaved.current = "";
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    url.searchParams.delete("version");
    window.history.replaceState(null, "", url.toString());
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

  useEffect(() => {
    if (outTab !== "mega" && outTab !== "export" && !s.experts.includes(outTab)) {
      setOutTab(s.experts[0] ?? "mega");
    }
  }, [s.experts, outTab]);

  const toggleStack = (key: "frontend" | "backend" | "database" | "auth" | "ai" | "realtime" | "search", v: string) => toggle(key, v);

  const usage = me?.usage ?? { used: usedToday, limit: dailyLimit };

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <Nav active={navTab} onTab={onNavTab} me={me} onSave={() => save(false)} saving={saving} dirty={dirty} />
      <Toast message={toast} />

      <div className="flex">
        <Sidebar
          projectType={s.projectType}
          onProjectType={(id) => patch({ projectType: id })}
          onNew={onNew}
          onTemplate={onTemplate}
          usedToday={usage.used}
          dailyLimit={usage.limit}
          signedIn={Boolean(me?.user)}
          plan={me?.plan ?? null}
        />

        <main className="flex-1 min-w-0 bg-ink-950">
          <StepBar step={s.step} onStep={setStep} quality={quality} />

          {projectId && versions.length > 0 && (
            <div className="px-4 lg:px-8 pt-4 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-zinc-500 flex items-center gap-1">
                <History className="w-3 h-3" aria-hidden /> Versiyonlar:
              </span>
              {versions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => loadProject(projectId, v.version)}
                  title={`${v.format} • ${v.lang} • ${new Date(v.created_at).toLocaleString("tr-TR")}`}
                  className={cx(
                    "h-6 px-2 rounded-full border font-mono",
                    activeVersion === v.version ? "bg-lime text-black border-lime" : "bg-ink-800 border-ink-600 text-zinc-400 hover:text-white",
                  )}
                >
                  v{v.version}
                </button>
              ))}
              {activeVersion && (
                <button
                  type="button"
                  onClick={share}
                  disabled={sharing}
                  title="Bu versiyonu herkese açık bir sayfa olarak paylaş"
                  className="ml-auto h-7 px-3 rounded-full border border-ink-600 bg-ink-800 text-zinc-300 hover:text-white flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Share2 className="w-3 h-3" aria-hidden /> Paylaş v{activeVersion}
                </button>
              )}
            </div>
          )}

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
