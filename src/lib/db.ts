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

export interface MeResponse {
  user: { id: string; email: string | null } | null;
  plan: "free" | "pro" | null;
  usage: { used: number; limit: number } | null;
  /** Payment provider wired on the server, or null while Pro is "coming soon". */
  billing?: "lemonsqueezy" | null;
}
