export type Badge = "HOT" | "NEW" | "";

export interface ProjectType {
  id: string;
  name: string;
  icon: string;
  badge: Badge;
}

export interface ProjectCategory {
  cat: string;
  items: ProjectType[];
}

export interface FeatureGroup {
  cat: string;
  items: string[];
}

export interface PaymentProvider {
  id: string;
  name: string;
  fee: string;
  best: string;
  tr: boolean;
  color: string;
}

export interface Expert {
  id: string;
  emoji: string;
  role: string;
  org: string;
  spec: string;
  years: number;
  color: string;
  /** Expert-specific task block injected into the prompt. */
  task: string;
  /** English task block, used when the prompt's output language is EN (falls back to `task`). */
  taskEn?: string;
}

export type OutputLang = "TR" | "EN";

export type OutputFormat =
  | "ChatGPT Markdown"
  | "Claude XML"
  | "Cursor Rules"
  | "v0"
  | "Lovable/Bolt";

export interface Audience {
  role: string;
  pain: string;
  budget: string;
}

/** Everything the Studio wizard collects. Serialisable → will be stored per project in Faz 2. */
export interface StudioState {
  step: 1 | 2 | 3 | 4;
  projectType: string;
  name: string;
  pitch: string;
  description: string;
  audience: Audience;
  competitors: string[];
  usp: string;
  monetization: string[];
  frontend: string[];
  backend: string[];
  database: string[];
  auth: string[];
  ai: string[];
  realtime: string[];
  search: string[];
  features: string[];
  payments: string[];
  compliance: string[];
  experts: string[];
  lang: OutputLang;
  format: OutputFormat;
  /** false = leave the team conventions out of this project's prompts (default: include them). Saved with the project. */
  useTeamRules?: boolean;
  /**
   * Render-time only: the active team's conventions (0021) to append to the prompts. Set by the Studio / API right
   * before building; never saved, never sent to the share pages.
   */
  team?: TeamRules | null;
}

/** A team's shared conventions (migration 0021): appended to every master prompt of the team's members. */
export interface TeamRules {
  name: string;
  stack: string;
  code: string;
  voice: string;
}

export type OutputTab = string; // expert id | "mega" | "export"
