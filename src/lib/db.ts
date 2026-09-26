/** Row shapes for the Supabase tables used by the app (see supabase/migrations). */

import type { StudioState } from "./types";

export interface ProjectRow {
  id: string;
  owner_id: string;
  name: string;
  project_type: string;
  state: StudioState;
  created_at: string;
  updated_at: string;
}

export interface GenerationRow {
  id: string;
  project_id: string;
  owner_id: string;
  version: number;
  format: string;
  lang: "TR" | "EN";
  experts: string[];
  output: string;
  refined: Record<string, string> | null;
  token_estimate: number | null;
  created_at: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  project_type: string;
  updated_at: string;
  created_at: string;
  versions: number;
  latest_version: number | null;
}

/** AI credits: `used`/`limit` are today's (for Pro the daily fair-use cap); month fields are Pro-only. */
export interface CreditUsage {
  used: number;
  limit: number;
  monthUsed?: number | null;
  monthLimit?: number | null;
}

export interface MeResponse {
  user: { id: string; email: string | null } | null;
  plan: "free" | "pro" | null;
  /** Also filled for visitors (per-IP credits). */
  usage: CreditUsage | null;
  /** Credit cost of each AI action (admin-configurable). */
  costs?: { enhance: number; suggest: number; refine: number };
  /** Payment provider wired on the server, or null while Pro is "coming soon". */
  billing?: "lemonsqueezy" | null;
}
