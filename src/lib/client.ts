"use client";

import type { StudioState } from "./types";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Credit meter info returned by every AI route (JSON body and X-Credits-* headers). */
export interface CreditInfo {
  cost: number;
  remaining: number;
  limit: number;
  monthUsed?: number | null;
  monthLimit?: number | null;
  plan?: string;
}

/** UI language for server messages (English pages live under /en). */
function uiLocale(): "tr" | "en" {
  if (typeof window === "undefined") return "tr";
  return window.location.pathname === "/en" || window.location.pathname.startsWith("/en/") ? "en" : "tr";
}

function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "x-pm-locale": uiLocale() };
}

function creditsFromHeaders(h: Headers): CreditInfo | null {
  const remaining = h.get("x-credits-remaining");
  if (remaining == null) return null;
  const n = (k: string) => (h.get(k) == null ? null : Number(h.get(k)));
  return {
    cost: Number(h.get("x-credits-cost") ?? 1),
    remaining: Number(remaining),
    limit: Number(h.get("x-credits-limit") ?? 0),
    monthUsed: n("x-credits-month-used"),
    monthLimit: n("x-credits-month-limit"),
    plan: h.get("x-plan") ?? undefined,
  };
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = uiLocale() === "en" ? `Request failed (${res.status})` : `İstek başarısız (${res.status})`;
    let code = "http_error";
    try {
      const j = (await res.json()) as { error?: string; code?: string };
      msg = j.error ?? msg;
      code = j.code ?? code;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(code, msg, res.status);
  }
  return (await res.json()) as T;
}

export function enhanceDescription(s: StudioState) {
  return post<{ text: string; remaining: number; credits?: CreditInfo }>("/api/enhance", {
    name: s.name,
    pitch: s.pitch,
    description: s.description,
    projectType: s.projectType,
    lang: s.lang,
  });
}

export function suggestStack(s: StudioState) {
  return post<{ picks: Record<string, string[]>; why: string; remaining: number; credits?: CreditInfo }>("/api/suggest", {
    name: s.name,
    pitch: s.pitch,
    description: s.description,
    projectType: s.projectType,
    features: s.features,
  });
}

/** Streams the refined prompt; `onChunk` receives the accumulated text, `onCredits` the meter update. */
export async function refinePrompt(
  args: { prompt: string; expertRole: string; lang: StudioState["lang"]; format: StudioState["format"] },
  onChunk: (acc: string) => void,
  signal?: AbortSignal,
  onCredits?: (c: CreditInfo) => void,
): Promise<string> {
  const res = await fetch("/api/refine", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(args),
    signal,
  });
  if (!res.ok || !res.body) {
    let msg = uiLocale() === "en" ? `Request failed (${res.status})` : `İstek başarısız (${res.status})`;
    let code = "http_error";
    try {
      const j = (await res.json()) as { error?: string; code?: string };
      msg = j.error ?? msg;
      code = j.code ?? code;
    } catch {
      /* ignore */
    }
    throw new ApiError(code, msg, res.status);
  }
  const credits = creditsFromHeaders(res.headers);
  if (credits) onCredits?.(credits);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let acc = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    acc += dec.decode(value, { stream: true });
    onChunk(acc);
  }
  return acc;
}

export function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
