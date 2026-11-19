/**
 * Girdi Koçu / Input Coach — scores Studio step 1 (the idea) before anything is sent to AI.
 *
 * Pure and locale-free: it returns item keys, states and tip ids; the words live in studio-i18n.ts (`coach`).
 * It complements, and never replaces, `qualityScore()` (the 50–98 "Quality" meter over all four steps):
 * the coach looks only at step 1 content and points at what is missing; Enhance polishes the wording.
 * Weights add up to 100: name 10, pitch 25, description 20, audience 20 (role 10 + pain 10), competitors 10, USP 15.
 */
import type { StudioState } from "./types";

export type CoachState = "pass" | "warn" | "fail";
export type CoachKey = "name" | "pitch" | "description" | "audience" | "competitors" | "usp";
export type CoachTip =
  | "name.ok"
  | "name.missing"
  | "pitch.empty"
  | "pitch.short"
  | "pitch.buzz"
  | "pitch.medium"
  | "pitch.ok"
  | "description.empty"
  | "description.short"
  | "description.ok"
  | "audience.empty"
  | "audience.partial"
  | "audience.ok"
  | "competitors.none"
  | "competitors.one"
  | "competitors.ok"
  | "usp.empty"
  | "usp.generic"
  | "usp.ok";

export interface CoachItem {
  key: CoachKey;
  /** Points this item is worth when it fully passes. */
  weight: number;
  /** Points it earns right now (0…weight). */
  points: number;
  state: CoachState;
  tip: CoachTip;
}

export interface CoachResult {
  score: number;
  items: CoachItem[];
}

export type CoachInput = Pick<StudioState, "name" | "pitch" | "description" | "audience" | "competitors" | "usp">;

/** Marketing filler in either language: it says nothing about who, what or how. */
const BUZZ =
  /devrim|oyun[\s.-]?de[gğ]i[sş]tir|[cç][iı][gğ][iı]r[\s-]?a[cç]|yenilik[cç]i|e[sş]siz|benzersiz|game[\s-]?chang|next[\s-]?gen|cutting[\s-]?edge|state[\s-]?of[\s-]?the[\s-]?art|innovative|revolution|disrupt|world[\s-]?class|best[\s-]?in[\s-]?class|synerg|seamless/i;

/** A USP that is only an adjective ("daha iyi", "faster") says nothing a competitor could not say. */
const GENERIC_USP =
  /^(daha\s+)?(iyi|en\s+iyi|kolay|h[iı]zl[iı]|basit|ucuz|kaliteli|g[uü]venli|modern)\.?$|^(better|best|easy|easier|fast|faster|simple|simpler|cheap|cheaper|quality|secure|modern)\.?$/i;

const clean = (v: string | undefined | null) => (v ?? "").trim();

export function coachInput(s: CoachInput): CoachResult {
  const items: CoachItem[] = [];

  // 1) Project name — 10
  {
    const ok = clean(s.name).length > 2;
    items.push({ key: "name", weight: 10, points: ok ? 10 : 0, state: ok ? "pass" : "fail", tip: ok ? "name.ok" : "name.missing" });
  }

  // 2) One-line pitch — 25
  {
    const p = clean(s.pitch);
    let points: number;
    let state: CoachState;
    let tip: CoachTip;
    if (!p) [points, state, tip] = [0, "fail", "pitch.empty"];
    else if (p.length < 20) [points, state, tip] = [10, "warn", "pitch.short"];
    else if (BUZZ.test(p)) [points, state, tip] = [12, "warn", "pitch.buzz"];
    else if (p.length < 45) [points, state, tip] = [18, "warn", "pitch.medium"];
    else [points, state, tip] = [25, "pass", "pitch.ok"];
    items.push({ key: "pitch", weight: 25, points, state, tip });
  }

  // 3) Detailed description — 20
  {
    const d = clean(s.description);
    let points: number;
    let state: CoachState;
    let tip: CoachTip;
    if (d.length < 20) [points, state, tip] = [0, "fail", "description.empty"];
    else if (d.length < 90) [points, state, tip] = [10, "warn", "description.short"];
    else [points, state, tip] = [20, "pass", "description.ok"];
    items.push({ key: "description", weight: 20, points, state, tip });
  }

  // 4) Target audience — 20 (role 10 + pain 10; budget is optional)
  {
    const role = clean(s.audience?.role).length > 1;
    const pain = clean(s.audience?.pain).length > 1;
    const points = (role ? 10 : 0) + (pain ? 10 : 0);
    const state: CoachState = role && pain ? "pass" : role || pain ? "warn" : "fail";
    const tip: CoachTip = state === "pass" ? "audience.ok" : state === "warn" ? "audience.partial" : "audience.empty";
    items.push({ key: "audience", weight: 20, points, state, tip });
  }

  // 5) Competitors — 10
  {
    const filled = (s.competitors ?? []).filter((c) => clean(c).length > 0).length;
    const [points, state, tip]: [number, CoachState, CoachTip] =
      filled === 0 ? [0, "fail", "competitors.none"] : filled === 1 ? [6, "warn", "competitors.one"] : [10, "pass", "competitors.ok"];
    items.push({ key: "competitors", weight: 10, points, state, tip });
  }

  // 6) USP — 15
  {
    const u = clean(s.usp);
    const generic = u.length > 0 && (u.length < 8 || GENERIC_USP.test(u));
    const [points, state, tip]: [number, CoachState, CoachTip] = !u
      ? [0, "fail", "usp.empty"]
      : generic
        ? [6, "warn", "usp.generic"]
        : [15, "pass", "usp.ok"];
    items.push({ key: "usp", weight: 15, points, state, tip });
  }

  const score = Math.min(100, items.reduce((sum, it) => sum + it.points, 0));
  return { score, items };
}
