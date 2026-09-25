"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { DEFAULT_STATE, EMPTY_STATE } from "@/lib/data";
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

function loadSaved(): StudioState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioState>;
    return { ...DEFAULT_STATE, ...parsed, step: 1 };
  } catch {
    return null;
  }
}

export function useStudio() {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const skipSave = useRef(true);

  // Restore the visitor's last project (per-browser convenience until accounts arrive in Faz 2).
  useEffect(() => {
    const saved = loadSaved();
    if (saved) dispatch({ type: "replace", state: saved });
    setHydrated(true);
  }, []);

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
  const reset = useCallback((blank = false) => dispatch({ type: "replace", state: blank ? EMPTY_STATE : DEFAULT_STATE }), []);
  /** Replace the whole state (e.g. a project loaded from the library). */
  const load = useCallback((next: StudioState) => dispatch({ type: "replace", state: { ...DEFAULT_STATE, ...next } }), []);

  return { state, patch, toggle, setArray, reset, load, hydrated };
}

export type StudioApi = ReturnType<typeof useStudio>;
export type { ArrayKey };
