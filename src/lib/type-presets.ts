import { EMPTY_STATE, STACK, STACK_SUGGESTIONS } from "./data";
import type { StudioState } from "./types";

/**
 * Per-project-type presets: recommended experts, features, payments, monetization and compliance.
 * Used by the SEO landing pages (/prompt/[slug]) and by Studio's `?type=<id>` quick start.
 * Kept apart from the page copy so the Studio bundle stays small.
 */
export interface TypePreset {
  experts: string[];
  features: string[];
  payments?: string[];
  monetization: string[];
  compliance?: string[];
}

export const TYPE_PRESETS: Record<string, TypePreset> = {
  "saas-dash": {
    experts: ["cto", "pm", "design", "security", "monet"],
    features: ["Email/Pass + Magic Link", "RBAC + Permissions", "Multi-tenancy", "Team Invite & Roles", "Dashboard + Command Palette", "Global Search (⌘K)", "Analytics Charts", "Billing & Subscriptions", "Audit Logs", "Admin Panel + Impersonate"],
    payments: ["stripe", "iyzico"],
    monetization: ["Subscription (MRR)", "Freemium"],
    compliance: ["KVKK/GDPR", "SOC2"],
  },
  "ai-wrapper": {
    experts: ["ai", "cto", "monet", "growth"],
    features: ["Email/Pass + Magic Link", "AI Assistant Copilot", "API Keys & Rate Limit", "Billing & Subscriptions", "Referral + Credits", "File Upload + CDN", "Analytics Charts"],
    payments: ["stripe", "paddle"],
    monetization: ["Hybrid / Credits", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR"],
  },
  "plg": {
    experts: ["growth", "pm", "cto", "copy", "data"],
    features: ["Social OAuth (Google/Github)", "In-app Onboarding Tour", "Referral + Credits", "Billing & Subscriptions", "Analytics Charts", "Notifications Center", "Webhooks & Events"],
    payments: ["stripe", "paddle"],
    monetization: ["Freemium", "Usage-Based"],
  },
  "chrome-ext": {
    experts: ["cto", "design", "security", "growth"],
    features: ["Email/Pass + Magic Link", "Social OAuth (Google/Github)", "Billing & Subscriptions", "API Keys & Rate Limit", "Notifications Center", "AI Assistant Copilot"],
    payments: ["stripe", "lemonsqueezy"],
    monetization: ["Freemium", "One-time + Lifetime"],
  },
  "headless": {
    experts: ["cto", "seo", "design", "devops"],
    features: ["Advanced CRUD + Bulk Ops", "Global Search (⌘K)", "File Upload + CDN", "Ratings & Reviews", "Notifications Center", "Analytics Charts", "Webhooks & Events"],
    payments: ["iyzico", "paytr", "stripe"],
    monetization: ["Commission %", "One-time + Lifetime"],
    compliance: ["KVKK/GDPR", "E-Fatura", "3D Secure"],
  },
  "marketplace": {
    experts: ["cto", "pm", "monet", "security", "seo"],
    features: ["RBAC + Permissions", "Multi-tenancy", "Advanced CRUD + Bulk Ops", "Ratings & Reviews", "Chat + Video Call", "Global Search (⌘K)", "Admin Panel + Impersonate", "Affiliate System"],
    payments: ["stripe", "iyzico"],
    monetization: ["Commission %", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR", "3D Secure"],
  },
  "d2c": {
    experts: ["pm", "monet", "growth", "cto"],
    features: ["Email/Pass + Magic Link", "Billing & Subscriptions", "Calendar & Scheduling", "Notifications Center", "Referral + Credits", "Ratings & Reviews", "Admin Panel + Impersonate"],
    payments: ["iyzico", "stripe"],
    monetization: ["Subscription (MRR)"],
    compliance: ["KVKK/GDPR", "3D Secure"],
  },
  "b2b": {
    experts: ["cto", "pm", "security", "data"],
    features: ["RBAC + Permissions", "Team Invite & Roles", "Advanced CRUD + Bulk Ops", "Audit Logs", "Webhooks & Events", "Analytics Charts", "Notifications Center"],
    payments: ["iyzico", "paytr"],
    monetization: ["Subscription (MRR)", "Commission %"],
    compliance: ["KVKK/GDPR", "E-Fatura"],
  },
  "neobank": {
    experts: ["security", "cto", "data", "design"],
    features: ["2FA & Passkeys", "RBAC + Permissions", "Audit Logs", "Analytics Charts", "Notifications Center", "Dashboard + Command Palette"],
    monetization: ["Subscription (MRR)", "Usage-Based"],
    compliance: ["KVKK/GDPR", "PCI DSS", "SOC2", "3D Secure"],
  },
  "crypto": {
    experts: ["cto", "data", "design", "security"],
    features: ["Social OAuth (Google/Github)", "Realtime Presence", "Notifications Center", "Analytics Charts", "API Keys & Rate Limit", "Global Search (⌘K)"],
    monetization: ["Freemium", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR"],
  },
  "invoice": {
    experts: ["cto", "pm", "security", "monet"],
    features: ["Email/Pass + Magic Link", "Team Invite & Roles", "Advanced CRUD + Bulk Ops", "Billing & Subscriptions", "Notifications Center", "Audit Logs", "Webhooks & Events"],
    payments: ["iyzico", "stripe"],
    monetization: ["Subscription (MRR)", "Freemium"],
    compliance: ["KVKK/GDPR", "E-Fatura"],
  },
  "social": {
    experts: ["cto", "growth", "design", "security"],
    features: ["Social OAuth (Google/Github)", "Realtime Presence", "Comments & Threads", "Notifications Center", "File Upload + CDN", "Global Search (⌘K)", "Admin Panel + Impersonate"],
    monetization: ["Freemium", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR"],
  },
  "creator": {
    experts: ["monet", "pm", "design", "growth"],
    features: ["Email/Pass + Magic Link", "Billing & Subscriptions", "File Upload + CDN", "Comments & Threads", "Affiliate System", "Analytics Charts", "Notifications Center"],
    payments: ["stripe", "lemonsqueezy", "iyzico"],
    monetization: ["Commission %", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR"],
  },
  "jobboard": {
    experts: ["pm", "seo", "cto", "monet"],
    features: ["Email/Pass + Magic Link", "Team Invite & Roles", "Kanban / Board View", "File Upload + CDN", "Global Search (⌘K)", "Billing & Subscriptions", "Notifications Center"],
    payments: ["stripe", "iyzico"],
    monetization: ["One-time + Lifetime", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR"],
  },
  "edtech": {
    experts: ["pm", "design", "cto", "monet"],
    features: ["Email/Pass + Magic Link", "RBAC + Permissions", "File Upload + CDN", "Comments & Threads", "Analytics Charts", "Billing & Subscriptions", "Calendar & Scheduling"],
    payments: ["iyzico", "stripe"],
    monetization: ["Subscription (MRR)", "One-time + Lifetime"],
    compliance: ["KVKK/GDPR"],
  },
  "health": {
    experts: ["security", "pm", "design", "cto", "qa"],
    features: ["Email/Pass + Magic Link", "2FA & Passkeys", "RBAC + Permissions", "Calendar & Scheduling", "Chat + Video Call", "Audit Logs", "Notifications Center", "File Upload + CDN"],
    payments: ["iyzico", "stripe"],
    monetization: ["Commission %", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR", "SOC2"],
  },
  "proptech": {
    experts: ["cto", "seo", "design", "pm"],
    features: ["Social OAuth (Google/Github)", "Advanced CRUD + Bulk Ops", "File Upload + CDN", "Global Search (⌘K)", "Notifications Center", "Chat + Video Call", "Analytics Charts"],
    payments: ["iyzico", "stripe"],
    monetization: ["Subscription (MRR)", "Commission %"],
    compliance: ["KVKK/GDPR"],
  },
  "logistics": {
    experts: ["cto", "devops", "pm", "data"],
    features: ["RBAC + Permissions", "Realtime Presence", "Notifications Center", "File Upload + CDN", "Analytics Charts", "Webhooks & Events", "Audit Logs"],
    monetization: ["Usage-Based", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR"],
  },
  "ondemand": {
    experts: ["cto", "pm", "design", "monet", "devops"],
    features: ["Social OAuth (Google/Github)", "Realtime Presence", "Chat + Video Call", "Ratings & Reviews", "Notifications Center", "Admin Panel + Impersonate", "Analytics Charts"],
    payments: ["iyzico", "stripe"],
    monetization: ["Commission %"],
    compliance: ["KVKK/GDPR", "3D Secure"],
  },
  "booking": {
    experts: ["pm", "cto", "design", "monet"],
    features: ["Email/Pass + Magic Link", "Team Invite & Roles", "Calendar & Scheduling", "Notifications Center", "Billing & Subscriptions", "Analytics Charts", "Webhooks & Events"],
    payments: ["iyzico", "stripe"],
    monetization: ["Subscription (MRR)", "Freemium"],
    compliance: ["KVKK/GDPR"],
  },
  "crm": {
    experts: ["cto", "pm", "data", "security"],
    features: ["RBAC + Permissions", "Team Invite & Roles", "Advanced CRUD + Bulk Ops", "Kanban / Board View", "Global Search (⌘K)", "Audit Logs", "Analytics Charts", "Webhooks & Events"],
    payments: ["iyzico", "stripe"],
    monetization: ["Subscription (MRR)"],
    compliance: ["KVKK/GDPR", "E-Fatura"],
  },
  "nocode": {
    experts: ["cto", "design", "devops", "monet"],
    features: ["Social OAuth (Google/Github)", "Multi-tenancy", "File Upload + CDN", "Realtime Presence", "Billing & Subscriptions", "API Keys & Rate Limit", "Analytics Charts"],
    payments: ["stripe", "lemonsqueezy"],
    monetization: ["Freemium", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR"],
  },
  "ai-agents": {
    experts: ["agents", "ai", "cto", "security", "automation"],
    features: ["Agent Memory & Tools (MCP)", "Scheduled Jobs & Triggers", "Human-in-the-loop Approvals", "Integrations (Slack/Notion/Sheets)", "Webhooks & Events", "Audit Logs", "API Keys & Rate Limit", "Analytics Charts"],
    payments: ["stripe", "lemonsqueezy"],
    monetization: ["Usage-Based", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR", "SOC2"],
  },
  automation: {
    experts: ["automation", "agents", "cto", "data"],
    features: ["Workflow Builder", "Scheduled Jobs & Triggers", "Webhooks & Events", "Integrations (Slack/Notion/Sheets)", "Human-in-the-loop Approvals", "Notifications Center", "Audit Logs"],
    payments: ["stripe"],
    monetization: ["Subscription (MRR)", "Usage-Based"],
    compliance: ["KVKK/GDPR"],
  },
  wordpress: {
    experts: ["design", "seo", "copy", "ads"],
    features: ["CMS & Blog", "Contact Forms & Lead Capture", "SEO Pages & Sitemap", "Multi-language (i18n)", "Ratings & Reviews", "Analytics Charts"],
    payments: ["iyzico", "stripe"],
    monetization: ["One-time + Lifetime"],
    compliance: ["KVKK/GDPR"],
  },
  landing: {
    experts: ["design", "copy", "motion", "ads", "seo"],
    features: ["Contact Forms & Lead Capture", "SEO Pages & Sitemap", "CMS & Blog", "Multi-language (i18n)", "Analytics Charts"],
    payments: ["lemonsqueezy"],
    monetization: ["One-time + Lifetime"],
    compliance: ["KVKK/GDPR"],
  },
  mobile: {
    experts: ["mobile", "cto", "design", "pm", "monet"],
    features: ["Email/Pass + Magic Link", "Social OAuth (Google/Github)", "Push Notifications", "Offline Mode & Sync", "In-app Purchases", "In-app Onboarding Tour", "Analytics Charts"],
    payments: ["stripe"],
    monetization: ["Freemium", "Subscription (MRR)"],
    compliance: ["KVKK/GDPR"],
  },
  "internal-tool": {
    experts: ["cto", "design", "security", "data"],
    features: ["RBAC + Permissions", "Advanced CRUD + Bulk Ops", "Audit Logs", "Global Search (⌘K)", "Kanban / Board View", "Analytics Charts", "Admin Panel + Impersonate"],
    monetization: [],
    compliance: ["KVKK/GDPR", "SOC2"],
  },
};

/** Fields of a StudioState that a preset fills in. */
export function presetPatch(id: string): Partial<StudioState> {
  const p = TYPE_PRESETS[id];
  if (!p) return {};
  return { projectType: id, experts: p.experts, features: p.features, payments: p.payments ?? [], monetization: p.monetization, compliance: p.compliance ?? [] };
}

/** Sensible default stack when a type has no curated suggestion. */
const FALLBACK_STACK = ["Next.js 15 (App Router)", "Hono + CF Workers", "Supabase", "Supabase Auth", "Resend"];

const STACK_KEYS = ["frontend", "backend", "database", "auth", "ai", "realtime", "search"] as const;

/** Recommended stack labels for a project type. */
export function stackFor(typeId: string): string[] {
  return STACK_SUGGESTIONS[typeId] ?? FALLBACK_STACK;
}

/** The recommended stack split into the StudioState buckets. */
export function stackPatch(typeId: string): Partial<StudioState> {
  const labels = stackFor(typeId);
  const patch: Partial<StudioState> = {};
  for (const key of STACK_KEYS) {
    patch[key] = (STACK[key] as readonly string[]).filter((x) => labels.includes(x));
  }
  return patch;
}

/** Blank project pre-filled with a type's experts, features, payments and stack (Studio `?type=<id>`). */
export function quickStartState(typeId: string): StudioState | null {
  if (!TYPE_PRESETS[typeId]) return null;
  return { ...EMPTY_STATE, ...presetPatch(typeId), ...stackPatch(typeId), step: 1 };
}
