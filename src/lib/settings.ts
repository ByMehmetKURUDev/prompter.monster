/**
 * Runtime settings registry — the single list of everything the admin panel can change without a deploy.
 *
 * How it works: each entry here has a default. The admin panel (/admin/settings) renders this list
 * automatically, so a setting added in code shows up in the panel on the next deploy ("YENİ" badge for 14 days).
 * Overrides live in the `app_settings` table (Supabase); the database quota functions and the app read them.
 */

export type SettingType = "boolean" | "number" | "string" | "text";

export interface SettingDef {
  key: string;
  label: string;
  description: string;
  type: SettingType;
  default: boolean | number | string;
  group: "Genel" | "AI" | "Krediler" | "Planlar" | "Ödeme" | "Duyuru" | "Yasal";
  /** Exposed to anonymous clients via public_settings() (never put secrets here). */
  isPublic?: boolean;
  /** ISO date the setting was introduced — drives the "YENİ" badge. */
  since: string;
  min?: number;
  max?: number;
}

export const SETTINGS_REGISTRY: SettingDef[] = [
  // Genel
  { key: "maintenance_mode", label: "Bakım modu", description: "Açıkken sitede bakım şeridi görünür; AI çağrıları ve ödeme kapanır (sayfalar okunabilir kalır).", type: "boolean", default: false, group: "Genel", isPublic: true, since: "2026-09-26" },
  { key: "signup_enabled", label: "Yeni kayıt", description: "Kapalıyken giriş sayfası yalnız mevcut hesaplara izin verir (Supabase tarafında da kapatılabilir).", type: "boolean", default: true, group: "Genel", isPublic: true, since: "2026-09-26" },
  { key: "share_enabled", label: "Paylaşım sayfaları", description: "Kapalıyken yeni /p/<slug> bağlantısı üretilemez; mevcutlar açık kalır.", type: "boolean", default: true, group: "Genel", isPublic: true, since: "2026-09-26" },

  // Duyuru
  { key: "announcement", label: "Duyuru şeridi", description: "Boş değilse sitenin üstünde görünür (örn. 'Product Hunt lansmanı: yıllık planda %30 — kod PH30').", type: "text", default: "", group: "Duyuru", isPublic: true, since: "2026-09-26" },
  { key: "announcement_url", label: "Duyuru bağlantısı", description: "Şeride tıklanınca gidilecek adres (boş bırakılabilir).", type: "string", default: "", group: "Duyuru", isPublic: true, since: "2026-09-26" },

  // AI
  { key: "ai_enabled", label: "AI özellikleri", description: "Kill switch: kapalıyken Enhance / stack öner / iyileştir çağrıları 503 döner, kredi harcanmaz.", type: "boolean", default: true, group: "AI", isPublic: true, since: "2026-09-26" },
  { key: "ai_model_free", label: "Model — Free ve ziyaretçi", description: "Ücretsiz plan ve giriş yapmamış ziyaretçiler için Anthropic model kimliği. Model kullanımdan kalkarsa sistem otomatik olarak claude-sonnet-5'e düşer. Sistem sayfasındaki 'AI testi' ile doğrula.", type: "string", default: "claude-haiku-4-5", group: "AI", since: "2026-09-26" },
  { key: "ai_model_pro", label: "Model — Pro", description: "Pro plan için model kimliği (örn. claude-sonnet-5, claude-opus-5-5). Pahalı model seçersen kredi maliyetlerini de artır.", type: "string", default: "claude-sonnet-5", group: "AI", since: "2026-09-26" },
  { key: "refine_max_tokens", label: "İyileştir — en fazla çıktı token'ı", description: "Tek bir 'iyileştir' yanıtının üst sınırı (maliyet tavanı). 4.000 token ≈ 3.000 kelime.", type: "number", default: 4000, group: "AI", since: "2026-09-26", min: 500, max: 16000 },

  // Krediler (her AI işlemi kredi harcar; kotalar veritabanında uygulanır)
  { key: "anon_credits_per_day", label: "Ziyaretçi — günlük kredi", description: "Giriş yapmamış ziyaretçiler için IP başına günlük kredi.", type: "number", default: 3, group: "Krediler", isPublic: true, since: "2026-09-26", min: 0, max: 1000 },
  { key: "free_credits_per_day", label: "Free — günlük kredi", description: "Ücretsiz hesaplar için günlük kredi (her gün 00:00 UTC'de yenilenir).", type: "number", default: 5, group: "Krediler", isPublic: true, since: "2026-09-26", min: 0, max: 1000 },
  { key: "pro_credits_per_month", label: "Pro — aylık kredi", description: "Pro hesapların takvim ayı başına toplam kredisi (fiyat sayfasında gösterilir).", type: "number", default: 1000, group: "Krediler", isPublic: true, since: "2026-09-26", min: 0, max: 100000 },
  { key: "pro_credits_per_day", label: "Pro — günlük üst sınır", description: "Pro hesaplar için günlük adil kullanım sınırı (tek günde ayın tamamının harcanmasını önler).", type: "number", default: 150, group: "Krediler", isPublic: true, since: "2026-09-26", min: 0, max: 10000 },
  { key: "credit_cost_enhance", label: "Kredi — açıklamayı güçlendir", description: "Enhance işleminin kredi maliyeti.", type: "number", default: 1, group: "Krediler", isPublic: true, since: "2026-09-26", min: 1, max: 50 },
  { key: "credit_cost_suggest", label: "Kredi — stack öner", description: "Stack önerisinin kredi maliyeti.", type: "number", default: 1, group: "Krediler", isPublic: true, since: "2026-09-26", min: 1, max: 50 },
  { key: "credit_cost_refine", label: "Kredi — promptu iyileştir", description: "İyileştir işleminin kredi maliyeti (en uzun yanıt; en pahalı işlem).", type: "number", default: 3, group: "Krediler", isPublic: true, since: "2026-09-26", min: 1, max: 50 },

  // Ödeme
  { key: "checkout_enabled", label: "Pro satın alma", description: "Kapalıyken /pricing'de 'Pro'ya geç' yerine 'yakında' görünür (mağaza bakımı, canlı moda geçiş anı).", type: "boolean", default: true, group: "Ödeme", isPublic: true, since: "2026-09-26" },
  { key: "launch_coupon", label: "Lansman kuponu", description: "Doluysa fiyat sayfasında gösterilir ve her Pro ödemesine otomatik uygulanır (kod Lemon Squeezy → Discounts'ta tanımlı olmalı; geçersizse ödeme kodsuz devam eder). ?code= bağlantısıyla gelen kod önceliklidir. Boş = kapalı.", type: "string", default: "", group: "Ödeme", isPublic: true, since: "2026-09-26" },
  { key: "launch_coupon_text", label: "Kupon açıklaması", description: "Örn. 'İlk 100 kullanıcıya yıllık planda %30'.", type: "string", default: "", group: "Ödeme", isPublic: true, since: "2026-09-26" },

  // Yasal (Kullanım Koşulları, Gizlilik/KVKK, Çerez ve İade sayfalarına otomatik yansır)
  { key: "legal_name", label: "İşletmeci / veri sorumlusu", description: "Yasal sayfalarda görünen ad veya şirket unvanı (örn. şahıs şirketi kurarsan unvanını yaz).", type: "string", default: "Mehmet Kuru", group: "Yasal", isPublic: true, since: "2026-09-26" },
  { key: "legal_email", label: "İletişim e-postası", description: "KVKK başvuruları, iade ve destek için gösterilen adres. Bu adrese gelen postayı alabildiğinden emin ol (Cloudflare Email Routing).", type: "string", default: "hello@prompter.monster", group: "Yasal", isPublic: true, since: "2026-09-26" },
  { key: "legal_address", label: "Açık adres", description: "KVKK aydınlatma metninde veri sorumlusu adresi olarak gösterilir. Boşsa gösterilmez.", type: "string", default: "", group: "Yasal", isPublic: true, since: "2026-09-26" },
  { key: "legal_registry", label: "Vergi / sicil bilgisi", description: "Örn. 'Vergi Dairesi: Kadıköy, VKN: 1234567890' veya MERSİS no. Boşsa gösterilmez.", type: "string", default: "", group: "Yasal", isPublic: true, since: "2026-09-26" },
];

export const SETTINGS_BY_KEY = new Map(SETTINGS_REGISTRY.map((s) => [s.key, s]));

export type SettingsMap = Record<string, boolean | number | string>;

/** Registry defaults merged with overrides (unknown keys ignored, wrong types dropped). */
export function mergeSettings(overrides: Record<string, unknown> | null | undefined): SettingsMap {
  const out: SettingsMap = {};
  for (const def of SETTINGS_REGISTRY) {
    const v = overrides?.[def.key];
    out[def.key] = coerce(def, v) ?? def.default;
  }
  return out;
}

export function coerce(def: SettingDef, v: unknown): boolean | number | string | null {
  if (v === undefined || v === null) return null;
  switch (def.type) {
    case "boolean":
      return typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : null;
    case "number": {
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n)) return null;
      const lo = def.min ?? -Infinity;
      const hi = def.max ?? Infinity;
      return Math.min(hi, Math.max(lo, Math.round(n)));
    }
    case "string":
    case "text":
      return typeof v === "string" ? v.slice(0, def.type === "text" ? 2000 : 500) : null;
  }
}

export function isNew(def: SettingDef, days = 14): boolean {
  return Date.now() - new Date(def.since).getTime() < days * 86400000;
}

/** Keys the public endpoint may expose. */
export const PUBLIC_SETTING_KEYS = SETTINGS_REGISTRY.filter((s) => s.isPublic).map((s) => s.key);

export interface PublicSettings {
  maintenance_mode: boolean;
  signup_enabled: boolean;
  share_enabled: boolean;
  announcement: string;
  announcement_url: string;
  ai_enabled: boolean;
  anon_credits_per_day: number;
  free_credits_per_day: number;
  pro_credits_per_month: number;
  pro_credits_per_day: number;
  credit_cost_enhance: number;
  credit_cost_suggest: number;
  credit_cost_refine: number;
  checkout_enabled: boolean;
  launch_coupon: string;
  launch_coupon_text: string;
  legal_name: string;
  legal_email: string;
  legal_address: string;
  legal_registry: string;
}

/** Default values of every public setting (used when the database is unreachable and for static pages). */
export const DEFAULT_PUBLIC = (): PublicSettings => publicSubset(mergeSettings(null));

export type AiEndpoint = "enhance" | "suggest" | "refine";

/** Credit cost per AI action from a settings map. */
export function creditCosts(s: Pick<PublicSettings, "credit_cost_enhance" | "credit_cost_suggest" | "credit_cost_refine">): Record<AiEndpoint, number> {
  return { enhance: s.credit_cost_enhance, suggest: s.credit_cost_suggest, refine: s.credit_cost_refine };
}

export function publicSubset(all: SettingsMap): PublicSettings {
  const o: Record<string, boolean | number | string> = {};
  for (const k of PUBLIC_SETTING_KEYS) o[k] = all[k];
  return o as unknown as PublicSettings;
}
