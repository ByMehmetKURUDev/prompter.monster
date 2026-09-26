"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useLocale } from "@/components/site/LocaleProvider";
import { DEFAULT_STATE, DEFAULT_STATE_EN, EMPTY_STATE, EMPTY_STATE_EN } from "@/lib/data";
import type { StudioState } from "@/lib/types";

const STORAGE_KEY = "prompt-monster:studio:v1";

type ArrayKey = {
  [K in keyof StudioState]: StudioState[K] extends string[] ? K : never;
}[keyof StudioState];

type Action =
  | { type: "patch"; patch: Partial<StudioState> }
  | { type: "toggle"; key: ArrayKey; value: string }
  | { type: "setArray"; key: ArrayKey; value: string[] }
  | { type: "replace"; state: StudioState };

function reducer(s: StudioState, a: Action): StudioState {
  switch (a.type) {
    case "patch":
      return { ...s, ...a.patch };
    case "toggle": {
      const arr = s[a.key];
      const next = arr.includes(a.value) ? arr.filter((x) => x !== a.value) : [...arr, a.value];
      return { ...s, [a.key]: next };
    }
    case "setArray":
      return { ...s, [a.key]: a.value };
    case "replace":
      return a.state;
  }
}

/** The visitor's saved draft on top of `base` (a draft keeps its own `lang`). */
function loadSaved(base: StudioState): StudioState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    return { ...base, ...parsed, step: 1 };
  } catch {
    return null;
  }
}

export function useStudio() {
  // English pages (/en/studio) start from the English sample and blank project; Turkish pages as before.
  const en = useLocale() === "en";
  const base = en ? DEFAULT_STATE_EN : DEFAULT_STATE;
  const blank = en ? EMPTY_STATE_EN : EMPTY_STATE;
  const [state, dispatch] = useReducer(reducer, base);
  const [hydrated, setHydrated] = useState(false);
  const skipSave = useRef(true);

  // Restore the visitor's last project (per-browser convenience until accounts arrive in Faz 2).
  useEffect(() => {
    const saved = loadSaved(base);
    if (saved) dispatch({ type: "replace", state: saved });
    setHydrated(true);
  }, [base]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [state, hydrated]);

  const patch = useCallback((p: Partial<StudioState>) => dispatch({ type: "patch", patch: p }), []);
  const toggle = useCallback((key: ArrayKey, value: string) => dispatch({ type: "toggle", key, value }), []);
  const setArray = useCallback((key: ArrayKey, value: string[]) => dispatch({ type: "setArray", key, value }), []);
  const reset = useCallback((toBlank = false) => dispatch({ type: "replace", state: toBlank ? blank : base }), [base, blank]);
  /** Replace the whole state (e.g. a project loaded from the library). */
  const load = useCallback((next: StudioState) => dispatch({ type: "replace", state: { ...base, ...next } }), [base]);

  return { state, patch, toggle, setArray, reset, load, hydrated };
}

export type StudioApi = ReturnType<typeof useStudio>;
export type { ArrayKey };
