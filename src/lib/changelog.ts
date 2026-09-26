/**
 * Product changelog — shown in /admin/system so every deploy's changes are visible in the panel.
 * Add an entry at the top with each release (newest first).
 */
export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  title: string;
  items: string[];
  /** Setting keys introduced with this release (rendered as quick links in the panel). */
  settings?: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "4.4",
    date: "2026-09-26",
    title: "Public API + MCP sunucusu — Prompt.Monster editörlerin içinde",
    items: [
      "MCP sunucusu (/api/mcp, Streamable HTTP): Claude Code, Cursor, VS Code, Windsurf, Claude Desktop. Araçlar: generate_build_prompt, list_project_types, get_type_preset, list_experts, export_files (Pro), get_shared_prompt, refine_prompt (kredi). Claude Code'da /mcp__prompt-monster__new_project komutu.",
      "REST API (/api/v1): types, types/{id}, generate, refine, shared/{slug} + OpenAPI 3.1 şeması (ChatGPT GPT Actions ile uyumlu).",
      "Kullanıcı API anahtarları: /account/api (en fazla 5 aktif; anahtar bir kez gösterilir, yalnız özeti saklanır; iptal edilebilir). Studio menüsünde 'API ve MCP'.",
      "Pro proje dosyaları (API/MCP): AGENTS.md, CLAUDE.md, .claude/agents/*.md (uzman başına alt ajan), .cursor/rules/*.mdc, .cursorrules, .github/copilot-instructions.md, Task Master prd.txt, prompt-monster.json.",
      "Anahtarsız kullanım Free sınırlarıyla çalışır (3 uzman, 2 format). Hız sınırı: anahtarla 30/dk, anahtarsız 10/dk — Ayarlar → Entegrasyon.",
      "Yeni admin sayfası: API ve MCP (günlük çağrılar, uç nokta/araç dağılımı, kaynağa göre AI kredisi, tüm anahtarlar).",
      "Herkese açık geliştirici sayfası: /developers ve /en/developers; llms.txt API/MCP bölümüyle güncellendi.",
    ],
    settings: ["api_enabled", "mcp_enabled", "api_rate_per_minute", "api_anon_rate_per_minute"],
  },
  {
    version: "4.3",
    date: "2026-09-26",
    title: "İngilizce arayüz (/en) — Product Hunt'a hazırlık",
    items: [
      "Tüm herkese açık sayfaların İngilizcesi: /en (ana sayfa), /en/studio, /en/pricing, /en/docs, /en/prompt + 22 proje tipi sayfası, /en/login, /en/library, /en/legal/*.",
      "Studio tamamen iki dilli (146 metin); İngilizce Studio İngilizce örnek projeyle ve EN çıktı diliyle açılır.",
      "Uzman görevlerinin İngilizcesi eklendi: EN çıktıda artık Türkçe görev metni yok. EN çıktı + Türkçe girdi için uyarı.",
      "Dil düğmesi (TR/EN) seçimi hatırlar; İngilizce seçen ziyaretçi Türkçe bağlantılardan İngilizce sayfaya yönlenir. Türkçe olmayan tarayıcılara 'English' önerisi.",
      "hreflang (tr/en/x-default), İngilizce sitemap girdileri, İngilizce meta açıklamaları.",
      "Duyuru şeridinin İngilizcesi için yeni ayar: announcement_en.",
    ],
    settings: ["announcement_en"],
  },
  {
    version: "4.2",
    date: "2026-09-26",
    title: "Kredi sistemi, gerçek maliyet takibi, kanal/indirim bağlantıları, güvenlik düzeltmesi",
    items: [
      "GÜVENLİK: kullanıcılar kendi profilinde plan/rol alanını değiştiremez (0006_security.sql; RLS + tetikleyici).",
      "Kredi sistemi: enhance 1, stack 1, iyileştir 3 kredi. Ziyaretçi günde 3, Free günde 5, Pro ayda 1.000 (günde ≤150) — hepsi Ayarlar → Krediler'den.",
      "Plana göre model: Free/ziyaretçi Claude Haiku 4.5, Pro Claude Sonnet 5 (Ayarlar → AI). Model kalkarsa otomatik Sonnet 5'e düşer.",
      "Her AI çağrısının gerçek token sayısı ve modeli kaydedilir; Kullanım sayfası gerçek maliyeti gösterir. Başarısız çağrıda kredi iade edilir.",
      "?code=KOD bağlantıları: kod 30 gün saklanır ve Lemon Squeezy ödemesine otomatik uygulanır; lansman kuponu ayarı da otomatik uygulanır.",
      "Kanal takibi: utm_source / ref / dış site ilk ziyarette kaydedilir, kayıtta profile yazılır. Yeni admin sayfası: Kanallar (+ kampanya bağlantısı oluşturucu).",
      "Fiyat sayfası ayarlardan beslenir (krediler, model, kupon), İngilizce metinleri hazır.",
    ],
    settings: ["free_credits_per_day", "pro_credits_per_month", "credit_cost_refine", "ai_model_free", "ai_model_pro", "launch_coupon"],
  },
  {
    version: "4.1",
    date: "2026-09-26",
    title: "Yasal sayfalar, çerez izni, İngilizce altyapısı",
    items: [
      "/legal/terms, /legal/privacy (KVKK aydınlatma), /legal/cookies, /legal/refund — Türkçe + İngilizce (/en/legal/…).",
      "İşletmeci adı, e-posta, adres ve vergi bilgisi admin ayarlarından (Yasal grubu) değiştirilebilir; sayfalara otomatik yansır.",
      "Çerez bandı: GA4 / Google Ads / Meta Pixel yalnızca izin verilirse yüklenir (Consent Mode v2). Etiket tanımlı değilse bant görünmez.",
      "Dönüşüm olayları izin kategorisine göre gönderilir (analitik ↔ reklam).",
      "Tüm alt bilgilere ve giriş formuna yasal bağlantılar eklendi; fiyat sayfasına güvenli ödeme + 14 gün iade notu.",
      "i18n altyapısı: /en yolları, dil düğmesi (yalnızca İngilizcesi olan sayfalarda görünür), pm_lang çerezi.",
    ],
    settings: ["legal_name", "legal_email", "legal_address", "legal_registry"],
  },
  {
    version: "4.0",
    date: "2026-09-26",
    title: "Admin paneli, çalışma zamanı ayarları, dokümantasyon",
    items: [
      "/admin: genel bakış KPI'ları, kullanıcılar (plan/rol/ban), abonelikler, kullanım grafikleri, paylaşım moderasyonu, ayarlar, sistem.",
      "Ayarlar veritabanından okunur: AI kill switch, model, günlük/aylık kotalar, bakım modu, duyuru şeridi, lansman kuponu.",
      "Kota fonksiyonları (consume_ai_call) artık admin ayarlarını kullanır; Pro için aylık tavan eklendi.",
      "/docs: Studio'ya içerik girme rehberi + /llms.txt (AI ajanları için).",
      "Analitik: GA4 / Google Ads / Meta Pixel etiketleri ortam değişkeniyle açılır; dönüşüm olayları (sign_up, generate, begin_checkout, purchase).",
      "Siteden GitHub bağlantıları kaldırıldı.",
    ],
    settings: ["maintenance_mode", "ai_enabled", "ai_model", "pro_ai_per_month", "announcement", "launch_coupon"],
  },
  {
    version: "3.2",
    date: "2026-09-26",
    title: "Monster Pro, Free/Pro ayrımı, programmatic SEO",
    items: [
      "Lemon Squeezy ile $29/ay – $290/yıl abonelik; webhook ile plan güncellemesi; müşteri portalı.",
      "Free: 3 uzman + 2 format; Pro: 12 uzman, Mega Chain, 5 format, Export to Builders.",
      "22 proje tipi için /prompt/<slug> landing sayfaları ve /prompt hub'ı; Studio ?type= hızlı başlangıç.",
    ],
  },
  {
    version: "3.1",
    date: "2026-09-25",
    title: "Paylaşılabilir prompt sayfaları",
    items: ["/p/<slug> herkese açık sayfa, çatallama, sitemap, Open Graph.", "Şifre sıfırlama ve hesap sayfası."],
  },
  {
    version: "2.0",
    date: "2026-09-24",
    title: "Hesaplar ve kütüphane",
    items: ["Supabase Auth, proje kütüphanesi, versiyon geçmişi, hesaba bağlı günlük AI hakkı, Resend SMTP."],
  },
];
