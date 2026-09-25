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
}

export type OutputTab = string; // expert id | "mega" | "export"
