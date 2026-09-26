/**
 * Programmatic SEO content: one landing page per project type (/prompt/[slug]).
 * Text is Turkish (first launch market); ids match PROJECT_CATEGORIES in data.ts.
 * Experts / features / payments per type live in type-presets.ts (shared with Studio).
 */

import type { Locale } from "./i18n";
import { COPY_EN } from "./seo-types-en";
import { TYPE_PRESETS, type TypePreset } from "./type-presets";

export interface TypePageCopy {
  id: string;
  slug: string;
  /** Short product name used in titles. */
  name: string;
  /** <title> / H1 */
  title: string;
  /** Meta description (≤160 chars). */
  description: string;
  /** Two short paragraphs. */
  intro: [string, string];
  /** Who typically builds this. */
  audience: string;
  /** Example one-line pitch used for the sample prompt. */
  samplePitch: string;
  /** Example description used for the sample prompt. */
  sampleDescription: string;
  faq: { q: string; a: string }[];
  keywords: string[];
}

export type TypePage = TypePageCopy & TypePreset;

const COPY: TypePageCopy[] = [
  {
    id: "saas-dash",
    slug: "saas-dashboard",
    name: "SaaS Dashboard",
    title: "SaaS Dashboard için master build prompt",
    description: "Çok kiracılı SaaS dashboard'unu Claude Code, Cursor veya v0'a tek seferde yaptıran build prompt: auth, RBAC, faturalandırma, analitik ve ⌘K arama dahil.",
    intro: [
      "SaaS dashboard, çoğu B2B ürünün omurgasıdır: ekipler, roller, abonelik ve kullanım verisi tek ekranda birleşir. AI kodlama araçlarına \"bana bir dashboard yap\" demek yetmez; multi-tenancy, RBAC, faturalandırma ve audit log gibi kararlar önceden verilmemişse araç her seferinde farklı bir mimari uydurur.",
      "Prompt.Monster bu kararları senin yerine sorar, 12 uzman personanın bakış açısıyla birleştirir ve Claude Code, Cursor, v0, Lovable veya Bolt'a doğrudan yapıştırılacak bir master build prompt üretir.",
    ],
    audience: "B2B SaaS kuran indie hacker'lar, ajanslar ve ürün ekipleri",
    samplePitch: "Küçük ekipler için Linear hızında, çok kiracılı bir SaaS yönetim paneli",
    sampleDescription: "Takımlar projelerini, üyelerini ve aboneliklerini tek panelden yönetir. Rol tabanlı yetki, ⌘K arama, gerçek zamanlı bildirimler ve kullanım bazlı faturalandırma. İlk hedef 100 ödeyen takım.",
    faq: [
      { q: "Multi-tenancy için hangi yaklaşım öneriliyor?", a: "Prompt, Postgres üzerinde tenant_id + Row Level Security modelini ve Clerk/Supabase Auth ile organizasyon kavramını ister; her sorgunun tenant filtresiyle yazılmasını kısıt olarak ekler." },
      { q: "Faturalandırma promptun içinde mi?", a: "Evet. Seçtiğin sağlayıcı (Stripe, Iyzico, Paddle…) için abonelik, webhook ve müşteri portalı akışı 'Auth & Billing' adımında ayrı bir görev bloğu olarak yer alır." },
    ],
    keywords: ["saas dashboard prompt", "saas admin panel build prompt", "cursor saas dashboard", "claude code saas"],
  },
  {
    id: "ai-wrapper",
    slug: "ai-saas-wrapper",
    name: "AI SaaS Wrapper",
    title: "AI SaaS Wrapper için master build prompt",
    description: "LLM tabanlı bir SaaS'ı (chat, RAG, ajan) kredili kota, streaming ve maliyet kontrolüyle kurduran build prompt. Claude, GPT-4o, Groq ve vektör DB seçimleri dahil.",
    intro: [
      "AI wrapper ürünlerde fark, modelde değil çevresindeki üründe: kota ve kredi sistemi, streaming arayüz, RAG kalitesi, maliyet başına marj ve kötüye kullanım koruması. Bunları prompt'a yazmazsan AI kodlama aracı sadece bir chat kutusu üretir.",
      "Bu sayfadaki prompt şablonu AI Engineer ve Monetization uzmanlarını öne çıkarır: model seçimi, vektör veritabanı, token bütçesi, kredi tabanlı fiyatlandırma ve değerlendirme (eval) planı tek metinde.",
    ],
    audience: "AI ürünü çıkarmak isteyen kurucular ve vibe-coder'lar",
    samplePitch: "Belgelerini yükle, Türkçe soru sor: KOBİ'ler için RAG tabanlı bilgi asistanı",
    sampleDescription: "Kullanıcı PDF ve Word yükler; sistem parçalara böler, vektör DB'ye yazar ve Claude ile kaynak göstererek yanıtlar. Kredi bazlı kota, takım paylaşımı, streaming yanıt ve yanıt kalitesi puanlama.",
    faq: [
      { q: "Hangi modelle başlamalıyım?", a: "Prompt, kalite için Claude 3.5 Sonnet'i, hız/maliyet için Groq Llama 3'ü önerir ve ikisini soyutlayan bir sağlayıcı katmanı ister; böylece sonradan model değiştirmek tek dosya işidir." },
      { q: "RAG için vektör veritabanı şart mı?", a: "Küçük veri için Postgres + pgvector yeterlidir; prompt bunu varsayılan yapar ve Qdrant/Pinecone'a geçiş noktasını mimaride işaretler." },
    ],
    keywords: ["ai saas prompt", "rag uygulaması build prompt", "chatgpt wrapper saas", "claude api saas"],
  },
  {
    id: "plg",
    slug: "plg-product",
    name: "PLG Product",
    title: "Product-Led Growth (PLG) ürünü için master build prompt",
    description: "Kayıtsız deneme, self-serve onboarding, referral ve kullanım bazlı yükseltme akışlarıyla büyüyen bir PLG ürününün build prompt'u.",
    intro: [
      "PLG ürünlerde satış ekibi yoktur; ürünün kendisi satar. Bu yüzden onboarding turu, 'aha' anına giden en kısa yol, referral kredileri ve kullanım limitine takılınca çıkan yükseltme ekranı ilk günden tasarlanmalıdır.",
      "Growth Architect ve Product Manager personaları bu prompt'ta aktivasyon metriklerini, deney altyapısını ve fiyat basamaklarını tanımlar; CTO personası bunları event takibi ve feature flag'lerle mimariye bağlar.",
    ],
    audience: "Self-serve büyüme modeli kuran SaaS ekipleri",
    samplePitch: "Ekipler için ücretsiz başlayıp kullanımla büyüyen görev otomasyonu aracı",
    sampleDescription: "Kayıtsız ilk otomasyon, e-posta ile kaydet, 3 dakikalık onboarding, kullanım limitinde yükseltme, davet eden herkese kredi. Aktivasyon ve genişleme metrikleri ürünün içinde ölçülür.",
    faq: [
      { q: "PLG için hangi metrikler prompt'a giriyor?", a: "Aktivasyon oranı, ilk değer süresi (TTV), haftalık aktif takım ve genişleme MRR'ı; prompt bunların event şemasını ve dashboard'unu ister." },
      { q: "Freemium mu, ücretsiz deneme mi?", a: "Monetization uzmanı ürün tipine göre gerekçeli öneri verir; PLG sayfasında varsayılan freemium + kullanım bazlı yükseltmedir." },
    ],
    keywords: ["plg saas prompt", "product led growth build prompt", "self-serve saas onboarding"],
  },
  {
    id: "chrome-ext",
    slug: "chrome-extension",
    name: "Chrome Extension + App",
    title: "Chrome Eklentisi + Web App için master build prompt",
    description: "Manifest V3 Chrome eklentisi ve eşlik eden web uygulamasını (hesap, senkron, faturalandırma) birlikte kurduran build prompt.",
    intro: [
      "Eklenti ürünleri iki parçadır: tarayıcıdaki Manifest V3 eklentisi ve hesap/faturalandırma/senkron işlerini taşıyan web uygulaması. Aralarındaki kimlik doğrulama, mesajlaşma ve sürüm uyumu en çok hata yapılan yerdir.",
      "Bu prompt, service worker/content script sınırlarını, Chrome Web Store izin gerekçelerini ve web app ile paylaşılan oturum modelini açıkça tarif eder.",
    ],
    audience: "Tarayıcı içi verimlilik ve AI araçları yapan geliştiriciler",
    samplePitch: "Her web sayfasını tek tıkla özetleyen ve notlara kaydeden Chrome eklentisi",
    sampleDescription: "Content script sayfa metnini alır, service worker API'ye gönderir, web app'te notlar senkronize edilir. Ücretsiz 10 özet/gün, Pro sınırsız. Chrome Web Store inceleme kurallarına uygun izin seti.",
    faq: [
      { q: "Manifest V3 kısıtları prompt'ta var mı?", a: "Evet: uzaktan kod yasağı, service worker yaşam döngüsü, host permission gerekçeleri ve declarativeNetRequest kullanımı kısıtlar bölümünde yer alır." },
      { q: "Eklenti ile web app oturumu nasıl paylaşılır?", a: "Prompt, web app'ten alınan kısa ömürlü token'ın chrome.storage'da tutulmasını ve yenileme akışını tanımlar." },
    ],
    keywords: ["chrome extension build prompt", "manifest v3 eklenti prompt", "chrome eklentisi saas"],
  },
  {
    id: "headless",
    slug: "headless-e-ticaret",
    name: "Headless E-Ticaret",
    title: "Headless E-Ticaret sitesi için master build prompt",
    description: "Next.js + headless commerce mimarisiyle hızlı, SEO'lu bir e-ticaret vitrini: ürün kataloğu, sepet, Iyzico/PayTR ödeme ve arama. Build prompt hazır.",
    intro: [
      "Headless e-ticarette vitrin ve arka uç ayrılır: katalog, stok ve sipariş bir API'den gelir; vitrin Next.js ile saniyeler değil milisaniyeler içinde açılır. Türkiye'de Iyzico, PayTR ve e-fatura entegrasyonu işin kritik parçasıdır.",
      "Prompt, ürün-varyant modelini, sepet/ödeme durum makinesini, arama (Algolia/Typesense) ve SEO gereksinimlerini (yapılandırılmış veri, sitemap, Core Web Vitals) tek metinde birleştirir.",
    ],
    audience: "Markalar, ajanslar ve Shopify'dan headless'a geçen ekipler",
    samplePitch: "Türkiye için hızlı, SEO odaklı headless moda vitrini",
    sampleDescription: "Katalog ve stok headless API'den; vitrin Next.js ISR ile. Varyantlı ürünler, kampanya kuralları, Iyzico 3D Secure, e-fatura webhook'u, Typesense arama ve LCP < 1.5 s hedefi.",
    faq: [
      { q: "Ödeme sağlayıcısı olarak kimi seçmeliyim?", a: "Türkiye satışı için Iyzico veya PayTR, yurt dışı için Stripe; prompt ikisini de aynı soyutlama katmanına bağlar." },
      { q: "SEO için neler prompt'ta?", a: "Ürün şeması (JSON-LD), kanonik URL'ler, sitemap, görsel optimizasyonu ve Core Web Vitals hedefleri SEO/AEO uzmanının görev bloğundadır." },
    ],
    keywords: ["headless e-ticaret prompt", "next.js e-ticaret build prompt", "iyzico entegrasyon prompt"],
  },
  {
    id: "marketplace",
    slug: "multi-vendor-marketplace",
    name: "Multi-Vendor Marketplace",
    title: "Çok satıcılı pazar yeri (marketplace) için master build prompt",
    description: "Satıcı onboarding'i, komisyon, split ödeme, sipariş yönetimi ve arama içeren çok satıcılı pazar yerinin build prompt'u.",
    intro: [
      "Pazar yerinde üç taraf vardır: alıcı, satıcı ve platform. Satıcı onboarding'i, komisyon ve bölünmüş ödemeler, ihtilaf yönetimi ve arama kalitesi, ürünün başarısını belirleyen karmaşık parçalardır.",
      "Bu prompt satıcı paneli, platform admini ve alıcı deneyimini ayrı roller olarak tanımlar; ödeme sağlayıcısının split/escrow yeteneklerini ve KVKK yükümlülüklerini kısıtlara ekler.",
    ],
    audience: "Niş pazar yeri kuran girişimciler",
    samplePitch: "Yerel zanaatkârlar için komisyon modelli el yapımı ürün pazar yeri",
    sampleDescription: "Satıcı başvurusu ve onayı, mağaza sayfası, sipariş ve kargo takibi, alıcı-satıcı mesajlaşma, %8 komisyonla split ödeme, değerlendirme sistemi ve ihtilaf akışı.",
    faq: [
      { q: "Split ödeme nasıl çözülüyor?", a: "Prompt, Stripe Connect veya Iyzico Pazaryeri modelini ister; ödeme, komisyon kesintisi ve satıcıya aktarım adımlarını durum makinesi olarak tanımlar." },
      { q: "Satıcı onboarding'i ne kadar detaylı?", a: "Başvuru, belge doğrulama, mağaza kurulumu ve ilk ürün adımları PM personasının kullanıcı hikâyelerinde yer alır." },
    ],
    keywords: ["marketplace build prompt", "pazar yeri yazılımı prompt", "multi vendor saas"],
  },
  {
    id: "d2c",
    slug: "d2c-abonelik-kutusu",
    name: "D2C Subscription Box",
    title: "D2C abonelik kutusu için master build prompt",
    description: "Aylık kutu aboneliği, tercih anketi, teslimat takvimi ve churn azaltma akışlarıyla D2C abonelik e-ticaretinin build prompt'u.",
    intro: [
      "Abonelik kutusu işinde teknik zorluk katalog değil, yinelenen ödeme ve lojistik takvimidir: dönem atlama, adres değişikliği, kutu kişiselleştirme ve iptal önleme akışları gelirin büyük kısmını belirler.",
      "Prompt, abonelik yaşam döngüsünü (deneme → aktif → duraklatılmış → iptal) ve her geçişte tetiklenecek e-posta/bildirimleri açıkça tanımlar.",
    ],
    audience: "D2C markalar ve kutu abonelik girişimleri",
    samplePitch: "Kahve tutkunları için aylık kişiselleştirilmiş kavurma kutusu aboneliği",
    sampleDescription: "Damak anketi ile kişiselleştirme, aylık yenileme, dönem atlama, kargo takibi, kutu değerlendirmesi ve arkadaş davetiyle ücretsiz kutu. İptal öncesi indirim teklifi akışı.",
    faq: [
      { q: "Yinelenen ödeme Türkiye'de nasıl çalışır?", a: "Iyzico'nun kart saklama ve abonelik ürünü prompt'ta varsayılan; Stripe alternatif olarak soyutlama katmanına eklenir." },
      { q: "Churn azaltma akışı prompt'ta var mı?", a: "Evet, Growth personası iptal nedeni anketi, duraklatma seçeneği ve geri kazanım kampanyasını görev bloğuna yazar." },
    ],
    keywords: ["abonelik kutusu yazılımı", "d2c subscription build prompt", "aylık kutu e-ticaret"],
  },
  {
    id: "b2b",
    slug: "b2b-toptan-portal",
    name: "B2B Wholesale Portal",
    title: "B2B toptan satış portalı için master build prompt",
    description: "Bayi hesapları, müşteriye özel fiyat listeleri, cari hesap, sipariş onayı ve ERP entegrasyonu içeren B2B portalın build prompt'u.",
    intro: [
      "B2B portalda her müşteri farklı fiyat, ödeme vadesi ve onay zinciri görür. Cari hesap, teklif-sipariş dönüşümü ve ERP senkronu B2C e-ticaretten tamamen farklı bir veri modeli gerektirir.",
      "Prompt; müşteri grupları, fiyat listeleri, minimum sipariş kuralları, vade/limit takibi ve ERP webhook'larını tek mimaride toplar.",
    ],
    audience: "Toptancılar, distribütörler ve üreticiler",
    samplePitch: "Bayiler için müşteriye özel fiyatlı, cari hesaplı toptan sipariş portalı",
    sampleDescription: "Bayi onayı, fiyat listesi grupları, minimum sipariş, vade ve kredi limiti kontrolü, sipariş onay zinciri, e-fatura ve ERP (Logo/Netsis) senkronu, satış temsilcisi paneli.",
    faq: [
      { q: "ERP entegrasyonu nasıl ele alınıyor?", a: "Prompt, ERP'yi tek doğruluk kaynağı kabul eden bir senkron servisi ve idempotent webhook tüketicisi ister." },
      { q: "Müşteriye özel fiyat modeli karmaşık mı?", a: "Fiyat listesi + müşteri grubu + miktar kademesi modeli veri şemasında hazır gelir; CTO personası örnek tablo yapısını verir." },
    ],
    keywords: ["b2b portal yazılımı", "toptan satış portalı prompt", "b2b e-ticaret build prompt"],
  },
  {
    id: "neobank",
    slug: "neobank-dashboard",
    name: "Neobank Dashboard",
    title: "Neobank / fintech dashboard için master build prompt",
    description: "Hesap, kart, transfer ve harcama analitiği içeren neobank arayüzünün güvenlik ve uyum kısıtlarıyla yazılmış build prompt'u.",
    intro: [
      "Fintech ürünlerde en pahalı hata güvenliktir: KYC, 2FA, işlem limitleri, denetim izi ve PCI kapsamı ilk sürümde düşünülmezse sonradan yeniden yazılır.",
      "Prompt, Security & Compliance ve Data personalarını öne çıkarır: hassas verinin şifrelenmesi, işlem defteri (ledger) modeli, çift kayıt muhasebe ve şüpheli işlem kuralları tanımlanır.",
    ],
    audience: "Fintech girişimleri ve banka inovasyon ekipleri",
    samplePitch: "Freelancer'lar için gelir-gider ve vergi takibi yapan neobank paneli",
    sampleDescription: "Açık bankacılık ile hesap bağlama, harcama kategorileme, fatura ve vergi tahmini, kart limitleri, 2FA/passkey, işlem denetim izi ve anomali uyarıları.",
    faq: [
      { q: "Ledger modeli neden önemli?", a: "Bakiyeyi tek bir sayı olarak tutmak yerine çift kayıtlı işlem defteri prompt'ta zorunlu kısıt; böylece mutabakat ve denetim mümkün olur." },
      { q: "PCI kapsamını nasıl küçültürüm?", a: "Kart verisini asla saklamamak ve sağlayıcının tokenizasyonunu kullanmak kısıtlar bölümünde açıkça yazılır." },
    ],
    keywords: ["fintech dashboard prompt", "neobank build prompt", "finans uygulaması yazılımı"],
  },
  {
    id: "crypto",
    slug: "crypto-defi-tracker",
    name: "Crypto/DeFi Tracker",
    title: "Kripto / DeFi portföy takip uygulaması için master build prompt",
    description: "Cüzdan bağlama, çoklu zincir portföy, fiyat uyarıları ve DeFi pozisyon takibi içeren uygulamanın build prompt'u.",
    intro: [
      "Kripto takip uygulamalarında zorluk veri tarafındadır: çoklu zincir, on-chain veri sağlayıcıları, fiyat kaynakları ve oran limitleri. Gerçek zamanlı güncelleme ve önbellekleme stratejisi olmadan ürün ya yavaş ya da pahalı olur.",
      "Prompt, veri sağlayıcı soyutlaması, WebSocket fiyat akışı, uyarı motoru ve portföy hesaplamalarının (maliyet bazı, PnL) doğruluk kısıtlarını tanımlar.",
    ],
    audience: "Web3 geliştiricileri ve yatırım araçları yapan ekipler",
    samplePitch: "Çoklu zincir cüzdanları tek panelde izleyen, uyarı gönderen portföy aracı",
    sampleDescription: "Cüzdan adresi ekleme, Ethereum/Solana/BSC bakiyeleri, DeFi pozisyonları, fiyat ve likidasyon uyarıları, PnL grafikleri, vergi raporu dışa aktarma. Sağlayıcı oran limitlerine dayanıklı önbellek.",
    faq: [
      { q: "Hangi veri sağlayıcıları öneriliyor?", a: "Prompt, sağlayıcıyı soyutlayan bir katman ister; örnek olarak CoinGecko fiyat, Alchemy/Helius on-chain veri ve WebSocket akışı verilir." },
      { q: "Yatırım tavsiyesi riski?", a: "Kısıtlar bölümü ürünün bilgi amaçlı olduğunu vurgulayan metinleri ve yasal uyarıları zorunlu kılar." },
    ],
    keywords: ["kripto portföy uygulaması prompt", "defi tracker build prompt", "web3 dashboard"],
  },
  {
    id: "invoice",
    slug: "fatura-abonelik-saas",
    name: "Invoice & Billing SaaS",
    title: "Fatura ve abonelik yönetimi SaaS'ı için master build prompt",
    description: "Fatura oluşturma, e-fatura, tahsilat takibi, yinelenen faturalar ve müşteri portalı içeren faturalandırma SaaS'ının build prompt'u.",
    intro: [
      "Faturalandırma ürünlerinde doğruluk her şeydir: KDV hesaplamaları, para birimi yuvarlama, e-fatura/e-arşiv entegrasyonu ve tahsilat mutabakatı. Küçük bir hata muhasebe kaosu demektir.",
      "Prompt, fatura durum makinesini, vergi ve yuvarlama kurallarını, GİB entegratör webhook'larını ve müşteri portalını (görüntüle, öde, indir) tek mimaride tanımlar.",
    ],
    audience: "Serbest çalışanlar ve KOBİ'ler için araç yapan girişimler",
    samplePitch: "Freelancer ve ajanslar için e-fatura destekli, tahsilat takipli faturalama aracı",
    sampleDescription: "Müşteri kartları, teklif → fatura dönüşümü, yinelenen faturalar, e-fatura/e-arşiv gönderimi, online ödeme linki, gecikme hatırlatmaları ve gelir raporları.",
    faq: [
      { q: "E-fatura entegrasyonu prompt'ta nasıl geçiyor?", a: "GİB özel entegratör API'si (ör. bir entegratör sağlayıcısı) için gönderim, durum sorgulama ve hata yeniden deneme akışı ayrı bir görev olarak yer alır." },
      { q: "Para ve yuvarlama kuralları?", a: "Tutarlar kuruş cinsinden tamsayı tutulur; KDV satır bazında hesaplanır — bunlar kısıtlar bölümünde zorunludur." },
    ],
    keywords: ["fatura yazılımı prompt", "invoice saas build prompt", "e-fatura entegrasyon saas"],
  },
  {
    id: "social",
    slug: "sosyal-ag",
    name: "Social Network",
    title: "Sosyal ağ / topluluk uygulaması için master build prompt",
    description: "Akış, takip, gerçek zamanlı bildirim, moderasyon ve içerik önerisi içeren sosyal ağ uygulamasının build prompt'u.",
    intro: [
      "Sosyal ürünlerde zorluk ilk 100 kullanıcıyı tutmaktır: akış sıralaması, bildirim ritmi, moderasyon ve içerik kalitesi. Teknik tarafta fan-out, önbellek ve gerçek zamanlı güncellemeler ölçek sorunlarını erken çıkarır.",
      "Prompt, akış mimarisini (fan-out on write/read), moderasyon araçlarını, raporlama akışını ve büyüme döngülerini (davet, paylaşım) tanımlar.",
    ],
    audience: "Niş topluluk ve sosyal uygulama kuran ekipler",
    samplePitch: "Yerel koşucular için rota paylaşımı ve etkinlik tabanlı sosyal ağ",
    sampleDescription: "Profil, takip, rota gönderileri (GPX + fotoğraf), yorum ve beğeni, etkinlik oluşturma, gerçek zamanlı bildirim, moderasyon paneli ve raporlama. Davetle büyüme döngüsü.",
    faq: [
      { q: "Akış sıralaması nasıl tanımlanıyor?", a: "Başlangıçta kronolojik + takip ağırlıklı basit skor; prompt sonraki adımda etkileşim tabanlı sıralamaya geçiş noktasını işaretler." },
      { q: "Moderasyon prompt'ta var mı?", a: "Raporlama, otomatik filtre, moderatör kuyruğu ve kullanıcı yaptırımları Security personasının görev bloğundadır." },
    ],
    keywords: ["sosyal ağ uygulaması prompt", "topluluk platformu build prompt", "social app saas"],
  },
  {
    id: "creator",
    slug: "creator-economy",
    name: "Creator Economy",
    title: "Creator economy platformu için master build prompt",
    description: "İçerik üreticileri için abonelik, dijital ürün satışı, üyelik katmanları ve ödeme dağıtımı içeren platformun build prompt'u.",
    intro: [
      "Üretici platformlarında iki müşteri vardır: üretici ve hayran. Üyelik katmanları, ödeme dağıtımı, içerik erişim kontrolü ve keşif akışı aynı anda çalışmalıdır.",
      "Prompt, Substack/Gumroad benzeri modelleri tek üründe birleştirir: sayfa oluşturucu, katmanlı abonelik, dijital ürün teslimi, komisyon ve ödeme dağıtımı.",
    ],
    audience: "Üretici araçları ve üyelik platformu kuranlar",
    samplePitch: "Türkçe podcast ve bülten üreticileri için üyelik ve dijital ürün platformu",
    sampleDescription: "Üretici sayfası, ücretsiz/ücretli katmanlar, bölüm ve yazı erişim kontrolü, dijital ürün satışı (PDF, ders), %10 komisyon, aylık ödeme dağıtımı, üretici analitiği.",
    faq: [
      { q: "Ödeme dağıtımı nasıl çözülüyor?", a: "Platform komisyonu düşülerek üreticiye aktarım için Stripe Connect / Iyzico alt üye modeli ve aylık mutabakat prompt'ta tanımlıdır." },
      { q: "İçerik erişim kontrolü?", a: "Katman bazlı yetkilendirme, imzalı medya URL'leri ve önizleme kuralları CTO ve Security görevlerinde yer alır." },
    ],
    keywords: ["creator platform prompt", "üyelik platformu build prompt", "substack clone"],
  },
  {
    id: "jobboard",
    slug: "job-board-ats",
    name: "Job Board ATS",
    title: "İş ilanı sitesi + ATS için master build prompt",
    description: "İlan yayınlama, başvuru yönetimi, aday takibi (ATS), işveren paketleri ve SEO'lu ilan sayfaları içeren ürünün build prompt'u.",
    intro: [
      "İş ilanı ürünlerinde iki taraf dengelenir: işverenler ilan ve aday yönetimi ister, adaylar hızlı başvuru ve görünürlük. Programmatic SEO ilan sayfaları organik trafiğin motorudur.",
      "Prompt, ilan yaşam döngüsünü, başvuru pipeline'ını (Kanban), işveren paket/faturalandırmasını ve ilan sayfalarının yapılandırılmış verisini (JobPosting şeması) tanımlar.",
    ],
    audience: "Niş iş ilanı siteleri ve İK araçları yapanlar",
    samplePitch: "Uzaktan çalışan yazılımcılar için Türkçe iş ilanı sitesi ve mini ATS",
    sampleDescription: "İşveren kaydı, ilan paketi satın alma, ilan yayınlama, aday başvurusu ve CV yükleme, Kanban aday takibi, e-posta bildirimleri, JobPosting şemalı SEO sayfaları.",
    faq: [
      { q: "SEO ilan sayfaları prompt'ta nasıl?", a: "Her ilan için kanonik URL, JobPosting JSON-LD, sitemap ve süresi dolan ilanların işlenmesi SEO/AEO personasının görevidir." },
      { q: "Aday verisi ve KVKK?", a: "Saklama süresi, silme talebi ve aydınlatma metni kısıtlar bölümünde zorunlu tutulur." },
    ],
    keywords: ["iş ilanı sitesi prompt", "ats yazılımı build prompt", "job board saas"],
  },
  {
    id: "edtech",
    slug: "edtech-lms",
    name: "EdTech LMS",
    title: "EdTech LMS / online kurs platformu için master build prompt",
    description: "Kurs oluşturma, video dersler, quiz, ilerleme takibi, sertifika ve abonelik içeren LMS'in build prompt'u.",
    intro: [
      "Online eğitim ürünlerinde içerik yönetimi kadar öğrenme deneyimi önemlidir: ilerleme takibi, quiz ve geri bildirim, sertifika ve topluluk. Video barındırma ve koruma da maliyet kalemidir.",
      "Prompt, kurs-modül-ders hiyerarşisini, video teslim (imzalı URL, HLS), quiz motorunu, sertifika üretimini ve eğitmen gelir paylaşımını tanımlar.",
    ],
    audience: "Eğitim girişimleri, eğitmenler ve kurumsal akademiler",
    samplePitch: "Yazılımcılar için proje tabanlı Türkçe kurs platformu",
    sampleDescription: "Eğitmen kurs oluşturur, video ders ve quiz ekler; öğrenci ilerleme kaydı, sertifika, soru-cevap, aylık abonelik veya tek kurs satın alma; eğitmen gelir paylaşımı ve analitik.",
    faq: [
      { q: "Video barındırma için ne öneriliyor?", a: "Cloudflare Stream veya Mux ile imzalı oynatma; prompt indirmeyi zorlaştıran kısıtları ve maliyet tahminini içerir." },
      { q: "Sertifika üretimi?", a: "Tamamlama kriterleri ve PDF sertifika üretimi (doğrulama linkiyle) PM ve CTO görevlerinde yer alır." },
    ],
    keywords: ["lms yazılımı prompt", "online kurs platformu build prompt", "edtech saas"],
  },
  {
    id: "health",
    slug: "telemedicine",
    name: "HealthTech Telemedicine",
    title: "Telemedicine / online sağlık platformu için master build prompt",
    description: "Randevu, görüntülü görüşme, hasta kayıtları, e-reçete ve ödeme içeren telemedicine ürününün gizlilik kısıtlarıyla yazılmış build prompt'u.",
    intro: [
      "Sağlık ürünlerinde veri gizliliği ve erişim kontrolü tasarımın merkezindedir. Randevu, görüntülü görüşme kalitesi ve klinik kayıtların doğruluğu kullanıcı güvenini belirler.",
      "Prompt, hasta-hekim rollerini, randevu ve görüşme akışını, kayıt şifrelemesini, erişim denetim izini ve KVKK özel nitelikli veri yükümlülüklerini tanımlar.",
    ],
    audience: "Sağlık girişimleri, klinik zincirleri ve dijital sağlık ekipleri",
    samplePitch: "Diyetisyen ve psikologlar için randevulu görüntülü danışmanlık platformu",
    sampleDescription: "Uzman profili ve takvimi, randevu ve ödeme, görüntülü görüşme (WebRTC), seans notları ve dosya paylaşımı, hatırlatmalar, özel nitelikli veri için şifreleme ve erişim kaydı.",
    faq: [
      { q: "Özel nitelikli sağlık verisi nasıl korunuyor?", a: "Uygulama katmanında şifreleme, en az yetki ilkesi, erişim denetim izi ve veri saklama süreleri kısıtlar bölümünde zorunludur." },
      { q: "Görüntülü görüşme için ne öneriliyor?", a: "Daily/Twilio gibi WebRTC sağlayıcıları veya self-hosted LiveKit; prompt kalite/maliyet dengesini gerekçeli sunar." },
    ],
    keywords: ["telemedicine yazılımı prompt", "online sağlık platformu build prompt", "healthtech saas"],
  },
  {
    id: "proptech",
    slug: "proptech-emlak",
    name: "PropTech Real Estate",
    title: "PropTech / emlak platformu için master build prompt",
    description: "İlan listeleme, harita araması, sanal tur, danışman CRM'i ve kiralama akışı içeren emlak platformunun build prompt'u.",
    intro: [
      "Emlak platformlarında keşif deneyimi belirleyicidir: harita üzerinde filtreleme, kaydedilen aramalar, fiyat uyarıları ve yüksek kaliteli medya. Danışman tarafında ise ilan yönetimi ve lead takibi gerekir.",
      "Prompt, coğrafi arama (PostGIS), medya işleme, ilan doğrulama, lead yönlendirme ve SEO'lu ilan/mahalle sayfalarını tanımlar.",
    ],
    audience: "Emlak girişimleri ve danışmanlık ağları",
    samplePitch: "Öğrenciler için doğrulanmış kiralık oda ve ev ilanları platformu",
    sampleDescription: "Harita tabanlı arama ve filtreler, ilan doğrulama, fotoğraf/sanal tur, kaydedilen aramalar ve fiyat uyarıları, ev sahibi-kiracı mesajlaşma, danışman paketleri ve mahalle SEO sayfaları.",
    faq: [
      { q: "Harita araması nasıl kuruluyor?", a: "PostGIS ile sınırlayıcı kutu/yarıçap sorguları ve kümeleme; prompt sorgu performansı için indeks kısıtlarını verir." },
      { q: "Mahalle sayfaları SEO'ya nasıl katkı sağlar?", a: "Programmatic SEO ile her mahalle için otomatik oluşturulan içerik ve yapılandırılmış veri SEO personasının görevidir." },
    ],
    keywords: ["emlak platformu prompt", "proptech build prompt", "kiralık ilan sitesi yazılımı"],
  },
  {
    id: "logistics",
    slug: "lojistik-takip",
    name: "Logistics Tracking",
    title: "Lojistik ve kargo takip platformu için master build prompt",
    description: "Gönderi oluşturma, kurye/araç takibi, rota optimizasyonu, teslimat kanıtı ve müşteri bildirimleri içeren lojistik ürününün build prompt'u.",
    intro: [
      "Lojistik yazılımlarında gerçek zamanlı konum, durum geçişleri ve istisna yönetimi (adres bulunamadı, hasar) ürünün kalbidir. Saha uygulaması ile operasyon paneli aynı veriyi paylaşmalıdır.",
      "Prompt, gönderi durum makinesini, sürücü mobil akışını, rota optimizasyonunu, teslimat kanıtı (fotoğraf/imza) ve müşteri takip sayfasını tanımlar.",
    ],
    audience: "Kargo, kurye ve saha operasyonu ekipleri",
    samplePitch: "Şehir içi kurye ağları için canlı takip ve teslimat kanıtı platformu",
    sampleDescription: "Gönderi oluşturma ve etiket, kurye atama, canlı konum, rota önerisi, teslimat fotoğrafı/imza, müşteri takip linki ve SMS bildirimleri, istisna yönetimi ve operasyon raporları.",
    faq: [
      { q: "Canlı konum için mimari ne?", a: "Mobil istemciden aralıklı konum gönderimi, WebSocket ile operasyon paneline yayın ve zaman serisi tablo; prompt pil ve veri tüketimi kısıtlarını ekler." },
      { q: "Rota optimizasyonu dahil mi?", a: "Başlangıçta harici API (ör. Mapbox Optimization) ile; prompt kendi çözücüne geçiş noktasını işaretler." },
    ],
    keywords: ["kargo takip yazılımı prompt", "lojistik platformu build prompt", "kurye takip saas"],
  },
  {
    id: "ondemand",
    slug: "on-demand-uber-benzeri",
    name: "On-Demand Uber-like",
    title: "On-demand (Uber benzeri) hizmet uygulaması için master build prompt",
    description: "Müşteri, hizmet veren ve operatör rolleriyle eşleştirme, canlı takip, ödeme ve puanlama içeren on-demand uygulamanın build prompt'u.",
    intro: [
      "On-demand uygulamalarda üç uygulama vardır: müşteri, hizmet veren ve operasyon paneli. Eşleştirme algoritması, gerçek zamanlı konum ve ödeme/komisyon akışı ürünün en zor parçalarıdır.",
      "Prompt, talep-eşleştirme durum makinesini, sürücü/hizmet veren onboarding'ini, canlı takip ve ödeme dağıtımını mobil-öncelikli bir mimariyle tanımlar.",
    ],
    audience: "Yerel hizmet pazar yerleri kuran girişimler",
    samplePitch: "Evde bakım ve temizlik hizmetleri için on-demand eşleştirme uygulaması",
    sampleDescription: "Müşteri talep açar, yakın hizmet verenlerle eşleşir, canlı takip ve mesajlaşma, kartla ödeme ve komisyon, çift taraflı puanlama, operasyon paneli ve anlaşmazlık akışı.",
    faq: [
      { q: "Eşleştirme algoritması nasıl başlıyor?", a: "Mesafe + müsaitlik + puan ağırlıklı basit skorlama; prompt zamanla öğrenen modele geçiş için veri toplama kısıtlarını ekler." },
      { q: "Mobil uygulama mı, web mi?", a: "React Native Expo ile tek kod tabanı varsayılan; prompt web operasyon panelini Next.js ile ayrı tanımlar." },
    ],
    keywords: ["uber benzeri uygulama prompt", "on-demand hizmet uygulaması build prompt", "eşleştirme platformu"],
  },
  {
    id: "booking",
    slug: "booking-rezervasyon-saas",
    name: "Booking SaaS",
    title: "Randevu ve rezervasyon SaaS'ı için master build prompt",
    description: "Takvim, müsaitlik kuralları, online rezervasyon sayfası, hatırlatmalar ve ödeme/ön ödeme içeren booking SaaS'ının build prompt'u.",
    intro: [
      "Randevu ürünlerinde karmaşıklık takvimdedir: saat dilimleri, tampon süreler, kaynak/oda çakışmaları, iptal politikaları ve Google Takvim senkronu. Yanlış çözülürse çifte rezervasyon kaçınılmazdır.",
      "Prompt, müsaitlik motorunu, rezervasyon durum makinesini, hatırlatma ve no-show akışını, ön ödeme/iptal kurallarını ve işletme başına herkese açık rezervasyon sayfasını tanımlar.",
    ],
    audience: "Kuaför, klinik, stüdyo ve danışmanlık işletmeleri için araç yapanlar",
    samplePitch: "Güzellik salonları için çalışan bazlı takvim ve online randevu sayfası",
    sampleDescription: "Hizmet ve çalışan tanımı, müsaitlik kuralları, herkese açık randevu sayfası, SMS/e-posta hatırlatma, ön ödeme ve iptal politikası, Google Takvim senkronu, işletme raporları.",
    faq: [
      { q: "Çifte rezervasyon nasıl engelleniyor?", a: "Veritabanı seviyesinde çakışma kısıtı (exclusion constraint) ve iyimser kilitleme prompt'ta zorunlu kısıttır." },
      { q: "Saat dilimi yönetimi?", a: "Tüm zamanlar UTC saklanır, işletme ve müşteri saat dilimi ayrı tutulur; prompt bunu veri modelinde açıkça belirtir." },
    ],
    keywords: ["randevu sistemi prompt", "booking saas build prompt", "online rezervasyon yazılımı"],
  },
  {
    id: "crm",
    slug: "crm-erp",
    name: "CRM/ERP",
    title: "CRM / hafif ERP için master build prompt",
    description: "Müşteri kartları, satış hattı, teklif-sipariş-fatura akışı, görevler ve raporlar içeren CRM/ERP ürününün build prompt'u.",
    intro: [
      "CRM/ERP ürünlerinde veri modeli ve yetki matrisi işin yarısıdır: müşteri, fırsat, teklif, sipariş, fatura ve stok birbirine bağlıdır; her rol farklı görür ve düzenler.",
      "Prompt, çekirdek varlık modelini, satış hattı (pipeline) akışını, özelleştirilebilir alanları, toplu işlemleri, raporlama ve içe/dışa aktarma gereksinimlerini tanımlar.",
    ],
    audience: "KOBİ'ler için dikey CRM/ERP kuran ekipler",
    samplePitch: "Yapı malzemesi bayileri için teklif-sipariş-fatura odaklı hafif CRM/ERP",
    sampleDescription: "Müşteri ve firma kartları, fırsat Kanban'ı, teklif oluşturma ve sipariş dönüşümü, stok ve fiyat listeleri, e-fatura, görev ve hatırlatmalar, satış raporları, Excel içe/dışa aktarma.",
    faq: [
      { q: "Özelleştirilebilir alanlar nasıl modelleniyor?", a: "JSONB tabanlı esnek alan şeması + doğrulama kuralları; prompt raporlanabilirlik için indeksleme kısıtlarını verir." },
      { q: "Mevcut Excel verisi nasıl taşınır?", a: "İçe aktarma sihirbazı, eşleme ve hata raporu PM personasının kullanıcı hikâyelerinde yer alır." },
    ],
    keywords: ["crm yazılımı prompt", "erp build prompt", "kobi crm saas"],
  },
  {
    id: "nocode",
    slug: "no-code-builder",
    name: "No-Code Builder",
    title: "No-code / site & form oluşturucu için master build prompt",
    description: "Sürükle-bırak editör, şablonlar, yayınlama, özel alan adı ve abonelik içeren no-code oluşturucunun build prompt'u.",
    intro: [
      "No-code ürünlerde editör deneyimi ürünün kendisidir: blok modeli, geri alma, gerçek zamanlı önizleme ve yayınlama hattı. Özel alan adı ve SSL otomasyonu da altyapı tarafında ciddi iştir.",
      "Prompt, blok/şema tabanlı içerik modelini, editör mimarisini, yayınlama (statik üretim + CDN), özel alan adı akışını ve plan bazlı limitleri tanımlar.",
    ],
    audience: "Site, form veya uygulama oluşturucu yapan ürün ekipleri",
    samplePitch: "Küçük işletmeler için 10 dakikada Türkçe web sitesi kuran no-code oluşturucu",
    sampleDescription: "Şablon seçimi, blok tabanlı editör, gerçek zamanlı önizleme, formlar ve gönderi bildirimleri, tek tıkla yayın, özel alan adı ve otomatik SSL, plan limitleri ve site analitiği.",
    faq: [
      { q: "Yayınlama mimarisi nasıl?", a: "Statik çıktı + CDN (Cloudflare) ve her yayın için sürüm; prompt geri alma ve önbellek temizleme akışını ister." },
      { q: "Özel alan adı ve SSL?", a: "CNAME doğrulama ve otomatik sertifika (Cloudflare for SaaS) DevOps personasının görevidir." },
    ],
    keywords: ["no-code builder prompt", "site oluşturucu saas build prompt", "website builder yazılımı"],
  },
];

export const TYPE_PAGES: TypePage[] = COPY.map((p) => {
  const preset = TYPE_PRESETS[p.id];
  if (!preset) throw new Error(`Missing TYPE_PRESETS entry for ${p.id}`);
  return { ...p, ...preset };
});

export const TYPE_PAGE_BY_SLUG = new Map(TYPE_PAGES.map((p) => [p.slug, p]));
export const TYPE_PAGE_BY_ID = new Map(TYPE_PAGES.map((p) => [p.id, p]));

/* English pages (/en/prompt/[slug]) — same ids/slugs, English copy, same presets. */
export const TYPE_PAGES_EN: TypePage[] = COPY_EN.map((p) => ({ ...p, ...TYPE_PRESETS[p.id] }));
const BY_SLUG_EN = new Map(TYPE_PAGES_EN.map((p) => [p.slug, p]));

export function typePages(locale: Locale = "tr"): TypePage[] {
  return locale === "en" ? TYPE_PAGES_EN : TYPE_PAGES;
}

export function typePageBySlug(slug: string, locale: Locale = "tr"): TypePage | undefined {
  return locale === "en" ? BY_SLUG_EN.get(slug) : TYPE_PAGE_BY_SLUG.get(slug);
}
