"use client";

import { ChevronRight, History, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/site/LocaleProvider";
import { EXPERTS } from "@/lib/data";
import type { MeResponse } from "@/lib/db";
import { ApiError, type CreditInfo, enhanceDescription, refinePrompt, suggestStack } from "@/lib/client";
import { lhref, type Locale } from "@/lib/i18n";
import { type PlanId, limitsFor } from "@/lib/plans";
import { buildExpertPrompt, estimateTokens, projectTypeName, qualityScore } from "@/lib/prompt";
import type { StudioText } from "@/lib/studio-i18n";
import { track } from "@/lib/track";
import { quickStartState } from "@/lib/type-presets";
import type { StudioState, TeamRules } from "@/lib/types";
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
import { useCatalog } from "./useCatalog";
import { useStudio } from "./useStudio";
import { useT } from "./useT";

type VersionRow = { id: string; version: number; format: string; lang: string; experts: string[]; created_at: string };

/**
 * Toast for a failed /api/projects or /api/share call. Those routes answer in Turkish only, so English pages
 * show their own text for the error code (or the fallback) instead of the server's message.
 */
function failText(locale: Locale, t: StudioText["studio"], j: { error?: string; code?: string }, fallback: string): string {
  return (locale === "en" ? t.apiErrors[j.code ?? ""] : j.error) ?? fallback;
}

/* ---- Autosave (signed-in users): edits go to the library 2 s after typing stops, at least every 10 s. ---- */
const AUTOSAVE_DELAY = 2000;
const AUTOSAVE_MAX_WAIT = 10000;
const AUTOSAVE_RETRY = [5000, 15000, 30000, 60000];
/** off: signed out · idle: nothing to save yet · pending: waiting for a pause · saving · saved · error (retrying). */
export type AutosaveStatus = "off" | "idle" | "pending" | "saving" | "saved" | "error";
/** Remembers which library project the browser's draft belongs to, so reopening /studio keeps editing it. */
const LAST_PROJECT_KEY = "prompt-monster:studio:last-project";

function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, canon(o[k])]));
  }
  return v;
}
/** What counts as a change: the project content — not the wizard step, render-time team rules or key order. */
function snap(st: StudioState): string {
  const { step: _step, team: _team, ...rest } = st;
  void _step;
  void _team;
  return JSON.stringify(canon(rest));
}
/** FNV-1a, enough to tell "this draft is that project's last saved state". */
function hash(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

type SaveJob = { ctx: number; state: StudioState; snapshot: boolean; silent: boolean; keepalive?: boolean };
type SaveResult = { id: string; version: number | null } | null;

export function Studio({ dailyLimit }: { dailyLimit: number }) {
  const locale = useLocale();
  const t = useT().studio;
  const pricing = lhref("/pricing", locale);
  const { state: s, patch, toggle, reset, setArray, load, hydrated } = useStudio();
  // Only the user's own edits start an autosave — not a loaded project, a fork, a quick start or the Free-plan trim.
  const editedRef = useRef(false);
  const uPatch = useCallback((p: Partial<StudioState>) => {
    editedRef.current = true;
    patch(p);
  }, [patch]);
  const uToggle = useCallback<typeof toggle>((key, value) => {
    editedRef.current = true;
    toggle(key, value);
  }, [toggle]);
  const uSetArray = useCallback<typeof setArray>((key, value) => {
    editedRef.current = true;
    setArray(key, value);
  }, [setArray]);
  // Admin-managed experts / project types; URL actions (?type=, ?project=) wait for it so custom types resolve.
  const catalog = useCatalog();
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
  const [autosave, setAutosave] = useState<{ status: AutosaveStatus; at: number | null }>({ status: "off", at: null });
  // Latest values for timers, listeners and the save queue.
  const stateRef = useRef(s);
  stateRef.current = s;
  const refinedRef = useRef<Record<string, string>>({});
  const meRef = useRef<MeResponse | null>(null);
  /** Each loaded / new / forked project is a "context"; saves started in an old context don't touch the screen. */
  const ctxRef = useRef(0);
  const idByCtx = useRef(new Map<number, string>());
  const projectIdRef = useRef<string | null>(null);
  const resyncRef = useRef(false);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const timerRef = useRef<number | null>(null);
  const firstDirtyAt = useRef(0);
  const retryRef = useRef(0);
  const authWarned = useRef(false);
  const autosaveRef = useRef<(keepalive?: boolean) => void>(() => {});
  const rememberLastRef = useRef<(id: string, st: StudioState) => void>(() => {});

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
  meRef.current = me;
  refinedRef.current = refined;

  // Team conventions (0021): fetched once per signed-in user; appended to the prompts at render time only.
  const [teamRules, setTeamRules] = useState<TeamRules | null>(null);
  const meId = me?.user?.id ?? null;
  useEffect(() => {
    if (!meId) {
      setTeamRules(null);
      return;
    }
    let alive = true;
    fetch("/api/team/rules", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { rules?: TeamRules | null } | null) => {
        if (alive) setTeamRules(j?.rules ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [meId]);
  /** What the outputs, exports and refine see: the project + the team conventions unless this project switched them off. */
  const outState = useMemo<StudioState>(() => (teamRules && s.useTeamRules !== false ? { ...s, team: teamRules } : s), [s, teamRules]);
  const toggleTeamRules = useCallback(() => uPatch({ useTeamRules: s.useTeamRules === false }), [uPatch, s.useTeamRules]);

  // Unsaved changes + autosave scheduling. A freshly loaded project becomes the saved baseline (resync).
  const signedIn = Boolean(me?.user);
  useEffect(() => {
    if (!hydrated) return;
    if (resyncRef.current) {
      resyncRef.current = false;
      lastSaved.current = snap(s);
      setDirty(false);
      if (projectIdRef.current) rememberLastRef.current(projectIdRef.current, s);
      return;
    }
    const isDirty = snap(s) !== lastSaved.current;
    setDirty(isDirty);
    if (!signedIn) {
      setAutosave((a) => (a.status === "off" ? a : { status: "off", at: null }));
      return;
    }
    if (!isDirty || !editedRef.current) {
      setAutosave((a) =>
        a.status === "off" ? { status: projectIdRef.current ? "saved" : "idle", at: null } : a.status === "pending" ? { ...a, status: projectIdRef.current ? "saved" : "idle" } : a,
      );
      return;
    }
    if (!firstDirtyAt.current) firstDirtyAt.current = Date.now();
    const wait = Math.max(0, Math.min(AUTOSAVE_DELAY, firstDirtyAt.current + AUTOSAVE_MAX_WAIT - Date.now()));
    setAutosave((a) => (a.status === "saving" || a.status === "pending" ? a : { ...a, status: "pending" }));
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      autosaveRef.current();
    }, wait);
  }, [s, hydrated, signedIn]);

  /* ---- plan entitlements (Free vs Pro) ---- */
  const plan: PlanId = me?.plan === "pro" ? "pro" : "free";
  const limits = useMemo(() => limitsFor(plan), [plan]);

  // A type quick start (?type=) has just shown its own toast: trim quietly instead of stacking a second one.
  const quietTrimUntil = useRef(0);

  // Once we know the plan, bring a loaded/forked/default state within the Free limits.
  useEffect(() => {
    if (!hydrated || !me) return; // wait for /api/me so a Pro user is never trimmed
    if (plan === "pro") return;
    const fixes: Partial<StudioState> = {};
    if (s.experts.length > limits.experts) fixes.experts = s.experts.slice(0, limits.experts);
    if (!limits.formats.includes(s.format)) fixes.format = "Claude XML";
    if (Object.keys(fixes).length) {
      patch(fixes);
      if (Date.now() > quietTrimUntil.current) say(`${t.freeTrimmed(limits.experts, limits.formats.length)} ${t.upgradeHint(pricing)}`, 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, me, plan, s.experts.length, s.format]);

  /** Expert toggle with the plan cap applied. */
  const toggleExpert = useCallback(
    (id: string) => {
      if (!s.experts.includes(id) && s.experts.length >= limits.experts) {
        say(plan === "pro" ? t.maxExperts(limits.experts) : `${t.freeMaxExperts(limits.experts)} ${t.upgradeHint(pricing)}`, 4500);
        return;
      }
      uToggle("experts", id);
    },
    [s.experts, limits.experts, plan, say, uToggle, t, pricing],
  );

  /** Format change with the plan gate applied. */
  const setFormat = useCallback(
    (format: StudioState["format"]) => {
      if (!limits.formats.includes(format)) {
        say(`${t.formatProOnly(format)} ${t.upgradeHint(pricing)}`, 4500);
        return;
      }
      uPatch({ format });
    },
    [limits.formats, uPatch, say, t, pricing],
  );

  /* ---- Saving: one queue for manual saves, versions (generate) and autosave, so saves never race. ---- */
  const setProject = useCallback((id: string | null) => {
    projectIdRef.current = id;
    setProjectId(id);
  }, []);

  const rememberLast = useCallback((id: string, st: StudioState) => {
    const uid = meRef.current?.user?.id;
    if (!uid) return;
    try {
      localStorage.setItem(LAST_PROJECT_KEY, JSON.stringify({ uid, id, h: hash(snap(st)) }));
    } catch {
      /* storage unavailable */
    }
  }, []);
  rememberLastRef.current = rememberLast;
  const forgetLast = useCallback(() => {
    try {
      localStorage.removeItem(LAST_PROJECT_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const runJob = useCallback(
    async (job: SaveJob): Promise<SaveResult> => {
      const current = () => job.ctx === ctxRef.current;
      if (job.silent && current()) setAutosave((a) => ({ ...a, status: "saving" }));
      const post = (id: string | null) =>
        fetch("/api/projects", {
          method: "POST",
          keepalive: job.keepalive,
          headers: { "Content-Type": "application/json", "x-pm-locale": locale },
          body: JSON.stringify({ id: id ?? undefined, state: job.state, snapshot: job.snapshot, refined: job.snapshot ? refinedRef.current : undefined }),
        });
      let status = 0;
      try {
        const known = idByCtx.current.get(job.ctx) ?? null;
        let r = await post(known);
        // Deleted meanwhile (another tab, the library): keep the work as a new project instead of losing it.
        if (r.status === 404 && known) {
          idByCtx.current.delete(job.ctx);
          r = await post(null);
        }
        status = r.status;
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string; code?: string };
          if (!job.silent) say(failText(locale, t, j, t.saveFailed), 3500);
          throw new Error(j.code ?? "save_failed");
        }
        const data = (await r.json()) as { id: string; version: number | null };
        idByCtx.current.set(job.ctx, data.id);
        if (current()) {
          setProject(data.id);
          lastSaved.current = snap(job.state);
          const still = snap(stateRef.current) !== lastSaved.current;
          setDirty(still);
          firstDirtyAt.current = 0;
          retryRef.current = 0;
          authWarned.current = false;
          setAutosave({ status: still ? "pending" : "saved", at: Date.now() });
          rememberLast(data.id, job.state);
          if (data.version) {
            setActiveVersion(data.version);
            setVersions((prev) => [
              { id: `local-${data.version}`, version: data.version!, format: job.state.format, lang: job.state.lang, experts: job.state.experts, created_at: new Date().toISOString() },
              ...prev,
            ]);
          }
          const url = new URL(window.location.href);
          if (url.searchParams.get("project") !== data.id || url.searchParams.has("new")) {
            url.searchParams.set("project", data.id);
            url.searchParams.delete("new");
            window.history.replaceState(null, "", url.toString());
          }
        }
        if (!job.silent) say(data.version ? t.savedVersion(data.version) : t.saved);
        return data;
      } catch {
        if (!current()) return null;
        setAutosave((a) => ({ ...a, status: "error" }));
        if (!job.silent && status === 0) say(t.saveFailed, 3000);
        if (job.silent) {
          if (status === 401) {
            // Signed out in another tab or the session expired: say it once, don't retry until the next edit.
            if (!authWarned.current) say(t.signInToSave, 5000);
            authWarned.current = true;
          } else {
            const delay = AUTOSAVE_RETRY[Math.min(retryRef.current, AUTOSAVE_RETRY.length - 1)];
            retryRef.current += 1;
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
              timerRef.current = null;
              autosaveRef.current();
            }, delay);
          }
        }
        return null;
      }
    },
    [locale, t, say, setProject, rememberLast],
  );

  const enqueue = useCallback(
    (job: SaveJob): Promise<SaveResult> => {
      const p = queueRef.current.then(() => runJob(job));
      queueRef.current = p.catch(() => null);
      return p;
    },
    [runJob],
  );

  /** Save the user's unsaved edits now (silently). The state and project are captured at this moment. */
  autosaveRef.current = (keepalive = false) => {
    if (!meRef.current?.user || !editedRef.current) return;
    if (snap(stateRef.current) === lastSaved.current) return;
    void enqueue({ ctx: ctxRef.current, state: stateRef.current, snapshot: false, silent: true, keepalive });
  };
  const flushPending = useCallback(() => {
    if (!timerRef.current) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    autosaveRef.current();
  }, []);

  // Leaving the page or the tab: write pending edits right away (keepalive survives the unload).
  useEffect(() => {
    const flush = () => {
      if (!timerRef.current) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      autosaveRef.current(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  /**
   * Switch to another project (loaded: `id`, or a new unsaved one: null). Pending edits of the project we leave
   * are saved first; `resync` makes the next state the saved baseline (a project just read from the library).
   */
  const switchContext = useCallback(
    (id: string | null, resync: boolean) => {
      flushPending();
      ctxRef.current += 1;
      if (id) idByCtx.current.set(ctxRef.current, id);
      setProject(id);
      editedRef.current = false;
      firstDirtyAt.current = 0;
      retryRef.current = 0;
      resyncRef.current = resync;
      if (!resync) lastSaved.current = "";
      setAutosave((a) => (a.status === "off" ? a : { status: id ? "saved" : "idle", at: null }));
      if (!id) forgetLast();
    },
    [flushPending, setProject, forgetLast],
  );

  const loadProject = useCallback(
    async (id: string, version?: number | null, opts?: { quiet?: boolean }) => {
      try {
        // Our own pending edits first, so the project we read back includes them.
        flushPending();
        await queueRef.current;
        const r = await fetch(`/api/projects/${id}${version ? `?version=${version}` : ""}`, { cache: "no-store" });
        if (!r.ok) {
          if (opts?.quiet) forgetLast();
          else say(r.status === 401 ? t.signInToOpen : t.loadFailed, 3500);
          return;
        }
        const data = (await r.json()) as {
          project: { id: string; state: StudioState };
          versions: VersionRow[];
          generation: { refined: Record<string, string> | null; version: number } | null;
        };
        switchContext(data.project.id, true);
        load(data.project.state);
        setVersions(data.versions);
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
        say(t.projectLoaded(data.project.state.name || t.untitled, data.generation ? data.generation.version : null));
      } catch {
        if (!opts?.quiet) say(t.loadFailed, 3000);
      }
    },
    [load, say, t, flushPending, switchContext, forgetLast],
  );

  /** Public share → a fresh, unsaved copy of that project in my Studio. */
  const forkShared = useCallback(
    async (slug: string) => {
      try {
        const r = await fetch(`/api/share/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!r.ok) {
          say(t.shareNotFound, 3500);
          return;
        }
        const data = (await r.json()) as { name: string; state: StudioState };
        switchContext(null, false);
        load({ ...data.state, step: 1 });
        setVersions([]);
        setActiveVersion(null);
        setReleased(false);
        setRefined({});
        const url = new URL(window.location.href);
        url.searchParams.delete("fork");
        window.history.replaceState(null, "", url.toString());
        say(t.forked(data.name || t.untitled), 4000);
      } catch {
        say(t.shareLoadFailed, 3000);
      }
    },
    [load, say, t, switchContext],
  );

  // Team library (0020): open a teammate's shared project as my own unsaved copy.
  const copyTeamProject = useCallback(
    async (id: string) => {
      try {
        const r = await fetch(`/api/team/library/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (!r.ok) {
          say(r.status === 401 ? t.signInToOpen : t.teamProjectNotFound, 4000);
          return;
        }
        const data = (await r.json()) as { name: string; state: StudioState; owner: string | null };
        switchContext(null, false);
        load({ ...data.state, step: 1 });
        setVersions([]);
        setActiveVersion(null);
        setReleased(false);
        setRefined({});
        say(t.teamCopied(data.name || t.untitled, data.owner), 5000);
      } catch {
        say(t.loadFailed, 3000);
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("teamProject");
        window.history.replaceState(null, "", url.toString());
      }
    },
    [load, say, t, switchContext],
  );

  // ?project=<id>&version=<n>  |  ?new=1  |  ?fork=<slug>  |  ?teamProject=<id>  |  ?type=<projectType> (from /prompt/[slug])
  useEffect(() => {
    if (!hydrated || !catalog.ready) return;
    const sp = new URLSearchParams(window.location.search);
    const id = sp.get("project");
    const v = Number(sp.get("version"));
    const fork = sp.get("fork");
    const teamProject = sp.get("teamProject");
    const type = sp.get("type");
    const preset = type ? quickStartState(type, locale === "en" ? "EN" : "TR") : null;
    if (id) loadProject(id, Number.isFinite(v) && v > 0 ? v : null);
    else if (fork) forkShared(fork);
    else if (teamProject) copyTeamProject(teamProject);
    else if (preset) {
      switchContext(null, false);
      load(locale === "en" ? { ...preset, lang: "EN" } : preset);
      setVersions([]);
      setActiveVersion(null);
      setReleased(false);
      setRefined({});
      const url = new URL(window.location.href);
      url.searchParams.delete("type");
      window.history.replaceState(null, "", url.toString());
      quietTrimUntil.current = Date.now() + 8000;
      track("quick_start", { project_type: preset.projectType });
      say(t.quickStart(projectTypeName(preset.projectType)), 5000);
    } else if (sp.get("new") === "1") {
      switchContext(null, false);
      reset(true);
      setVersions([]);
    }
    // Back from checkout: the webhook flips the plan within seconds — poll until it lands.
    if (sp.get("upgraded") === "1") {
      const boughtPlan = sp.get("plan") === "yearly" ? "yearly" : "monthly";
      track("purchase", { value: boughtPlan === "yearly" ? 290 : 29, currency: "USD", plan: boughtPlan, transaction_id: `${Date.now()}` });
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      url.searchParams.delete("plan");
      window.history.replaceState(null, "", url.toString());
      say(t.paymentReceived, 6000);
      let tries = 0;
      const timer = window.setInterval(async () => {
        tries += 1;
        try {
          const r = await fetch("/api/me", { cache: "no-store" });
          const j = (await r.json()) as MeResponse;
          setMe(j);
          if (j.plan === "pro") {
            window.clearInterval(timer);
            say(t.proActive(j.usage?.monthLimit ?? 1000), 6000);
          }
        } catch {
          /* retry */
        }
        if (tries >= 15) window.clearInterval(timer);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, catalog.ready]);

  // Reopening /studio: if the browser's draft is exactly this user's last saved project, keep editing that project
  // (re-read from the library) instead of starting a copy. A draft with other content stays a new, unsaved project.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !hydrated || !catalog.ready || !me) return;
    restoredRef.current = true;
    const uid = me.user?.id;
    if (!uid || projectIdRef.current) return;
    const sp = new URLSearchParams(window.location.search);
    if (["project", "fork", "teamProject", "type", "new"].some((k) => sp.has(k))) return;
    try {
      const last = JSON.parse(localStorage.getItem(LAST_PROJECT_KEY) ?? "null") as { uid?: string; id?: string; h?: string } | null;
      if (last?.id && last.uid === uid && last.h === hash(snap(stateRef.current))) void loadProject(last.id, null, { quiet: true });
    } catch {
      /* storage unavailable */
    }
  }, [hydrated, catalog.ready, me, loadProject]);

  /** Create/copy the public link for the active version. */
  const [sharing, setSharing] = useState(false);
  const share = useCallback(async () => {
    if (sharing || !projectId || !activeVersion) return;
    setSharing(true);
    try {
      const r = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pm-locale": locale },
        body: JSON.stringify({ project_id: projectId, version: activeVersion }),
      });
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string; code?: string; created?: boolean };
      if (!r.ok || !j.url) {
        say(failText(locale, t, j, t.shareFailed), 3500);
        return;
      }
      const ok = await navigator.clipboard.writeText(j.url).then(() => true, () => false);
      say(ok ? t.linkCopied(j.url) : t.linkShown(j.url), 6000);
      window.open(j.url, "_blank", "noopener");
    } catch {
      say(t.shareFailed, 3000);
    } finally {
      setSharing(false);
    }
  }, [sharing, projectId, activeVersion, say, locale, t]);

  /** Save button (snapshot=false) and every generation (snapshot=true → a new version). */
  const save = useCallback(
    async (snapshot: boolean) => {
      if (saving) return null;
      if (!me?.user) {
        say(t.signInToSave, 3500);
        return null;
      }
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setSaving(true);
      try {
        return await enqueue({ ctx: ctxRef.current, state: stateRef.current, snapshot, silent: false });
      } finally {
        setSaving(false);
      }
    },
    [me, saving, say, t, enqueue],
  );

  const onApiError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError) {
        if (e.code === "rate_limited") setUsedToday(dailyLimit);
        say(e.message, e.code === "rate_limited" ? 6000 : 4000);
      } else say(t.unexpectedError, 3000);
      refreshMe();
    },
    [dailyLimit, say, refreshMe, t],
  );

  /** Updates the credit meter right away from the AI response, then re-syncs with the server. */
  const applyCredits = useCallback(
    (c: CreditInfo | undefined, remaining?: number) => {
      if (c) {
        const used = Math.max(0, c.limit - c.remaining);
        setUsedToday(used);
        setMe((prev) => (prev ? { ...prev, usage: { used, limit: c.limit, monthUsed: c.monthUsed ?? null, monthLimit: c.monthLimit ?? null } } : prev));
      } else if (typeof remaining === "number") {
        setUsedToday(Math.max(0, dailyLimit - remaining));
      }
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
      uPatch({ description: r.text });
      applyCredits(r.credits, r.remaining);
      say(t.enhanced);
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
        if (r.picks[k].length) uSetArray(key, r.picks[k]);
      });
      applyCredits(r.credits, r.remaining);
      say(t.stackSuggested);
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
        { prompt: buildExpertPrompt(outState, expertId), expertRole: e.role, lang: s.lang, format: s.format },
        (acc) => setRefined((prev) => ({ ...prev, [expertId]: acc })),
        ac.signal,
        (c) => applyCredits(c),
      );
      refreshMe();
      say(t.refined);
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
      track("generate", { project_type: s.projectType, experts: s.experts.length, format: s.format, plan });
      if (me?.user) await save(true); // every generation is stored as a version
    }, 1400);
  };

  const onNew = () => {
    switchContext(null, false);
    reset(true);
    setReleased(false);
    setRefined({});
    setAiPicks(null);
    setAiWhy("");
    setVersions([]);
    setActiveVersion(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    url.searchParams.delete("version");
    window.history.replaceState(null, "", url.toString());
    say(t.newProject);
  };

  const onTemplate = (name: string) => {
    uPatch({ name: name.replace(" Clone", ""), pitch: `${name} — ${s.pitch || t.templatePitch}`, step: 1 });
    say(t.templateApplied(name));
  };

  const onNavTab = (tab: string) => {
    setNavTab(tab);
    say(tab === "Studio" ? t.studioActive : t.comingSoon(tab));
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

  const toggleStack = (key: "frontend" | "backend" | "database" | "auth" | "ai" | "realtime" | "search", v: string) => uToggle(key, v);

  const usage = me?.usage ?? { used: usedToday, limit: dailyLimit };
  const costs = me?.costs ?? { enhance: 1, suggest: 1, refine: 3 };

  return (
    <div className="min-h-screen bg-ink-950 text-zinc-100">
      <Nav active={navTab} onTab={onNavTab} me={me} onSave={() => save(false)} saving={saving} dirty={dirty} autosave={autosave} />
      <Toast message={toast} />

      <div className="flex">
        <Sidebar
          projectType={s.projectType}
          onProjectType={(id) => uPatch({ projectType: id })}
          onNew={onNew}
          onTemplate={onTemplate}
          usedToday={usage.used}
          dailyLimit={usage.limit}
          monthUsed={usage.monthUsed ?? null}
          monthLimit={usage.monthLimit ?? null}
          signedIn={Boolean(me?.user)}
          plan={me?.plan ?? null}
        />

        <main className="flex-1 min-w-0 bg-ink-950">
          <h1 className="sr-only">Prompt.Monster Studio</h1>
          <StepBar step={s.step} onStep={setStep} quality={quality} />

          {projectId && versions.length > 0 && (
            <div className="px-4 lg:px-8 pt-4 flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-zinc-500 flex items-center gap-1">
                <History className="w-3 h-3" aria-hidden /> {t.versions}
              </span>
              {versions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => loadProject(projectId, v.version)}
                  title={`${v.format} • ${v.lang} • ${new Date(v.created_at).toLocaleString(locale === "en" ? "en-US" : "tr-TR")}`}
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
                  title={t.shareTitle}
                  className="ml-auto h-7 px-3 rounded-full border border-ink-600 bg-ink-800 text-zinc-300 hover:text-white flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Share2 className="w-3 h-3" aria-hidden /> {t.shareVersion(activeVersion)}
                </button>
              )}
            </div>
          )}

          <div className="px-4 lg:px-8 py-6 max-w-[900px]">
            {s.step === 1 && (
              <Step1Idea s={s} patch={uPatch} toggle={uToggle} onEnhance={enhance} enhancing={enhancing} cost={costs.enhance} onNotify={say} />
            )}
            {s.step === 2 && <Step2Stack s={s} toggle={toggleStack} onSuggest={suggest} suggesting={suggesting} aiPicks={aiPicks} aiWhy={aiWhy} cost={costs.suggest} />}
            {s.step === 3 && <Step3Features s={s} toggle={uToggle} />}
            {s.step === 4 && (
              <Step4Experts s={s} onToggleExpert={toggleExpert} onFormat={setFormat} patch={uPatch} onGenerate={generate} generating={generating} tokens={tokens} plan={plan} limits={limits} />
            )}

            <div className="mt-8 flex items-center justify-between border-t border-ink-600 pt-6">
              <button
                type="button"
                onClick={() => setStep(Math.max(1, s.step - 1) as StudioState["step"])}
                disabled={s.step === 1}
                className="h-10 px-5 rounded-xl bg-ink-800 border border-ink-600 text-[13px] disabled:opacity-40"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={() => setStep(Math.min(4, s.step + 1) as StudioState["step"])}
                disabled={s.step === 4}
                className="h-10 px-5 rounded-xl bg-white text-black font-semibold text-[13px] disabled:opacity-40 flex items-center gap-1"
              >
                {t.next} <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* Output on smaller screens */}
          <div className="xl:hidden border-t border-ink-600 bg-ink-900">
            <div className="flex flex-col max-h-[80vh]">
              <OutputPanel
                s={outState}
                team={teamRules}
                onToggleTeam={toggleTeamRules}
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
                refineCost={costs.refine}
                refined={refined}
                onClearRefined={clearRefined}
                toast={say}
                plan={plan}
                limits={limits}
              />
            </div>
          </div>

          <Footer />
        </main>

        <aside className="hidden xl:flex w-[400px] shrink-0 flex-col border-l border-ink-600 bg-ink-900 h-[calc(100vh-56px)] sticky top-[56px]">
          <OutputPanel
            s={outState}
            team={teamRules}
            onToggleTeam={toggleTeamRules}
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
            refineCost={costs.refine}
            refined={refined}
            onClearRefined={clearRefined}
            toast={say}
            plan={plan}
            limits={limits}
          />
        </aside>
      </div>
    </div>
  );
}
