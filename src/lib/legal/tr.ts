import type { LegalDoc, LegalInfo, LegalSlug } from "./types";

/** Turkish legal texts. Internal links use Turkish paths; the renderer localizes them. */

function controller(i: LegalInfo): string {
  return `**${i.name}**${i.address ? ` (${i.address})` : ""}`;
}

function registry(i: LegalInfo): string[] {
  return i.registry ? [`Sicil / vergi bilgisi: ${i.registry}.`] : [];
}

function mail(i: LegalInfo): string {
  return `[${i.email}](mailto:${i.email})`;
}

const LS = "Lemon Squeezy (işleten şirket: Link, LLC — eski adıyla Lemon Squeezy LLC, ABD)";

export function trDoc(slug: LegalSlug, i: LegalInfo): LegalDoc {
  switch (slug) {
    case "terms":
      return {
        slug,
        title: "Kullanım Koşulları",
        short: "Kullanım Koşulları",
        description: "Prompt.Monster'ı kullanma koşulları: hesap, planlar ve ödeme, içerik hakları, kabul edilebilir kullanım, sorumluluk ve uyuşmazlıklar.",
        intro: [
          `Bu koşullar; Prompt.Monster web sitesinin (${i.site}), Studio'nun, API ve entegrasyonların (birlikte "Hizmet") kullanımını düzenler. Hizmet'i kullanarak veya hesap oluşturarak bu koşulları kabul etmiş olursun. Kabul etmiyorsan lütfen Hizmet'i kullanma.`,
        ],
        sections: [
          {
            id: "saglayici",
            h: "1. Hizmet sağlayıcı",
            blocks: [{ p: `Hizmet, ${controller(i)} tarafından işletilir. İletişim: ${mail(i)}.` }, ...registry(i).map((p) => ({ p }))],
          },
          {
            id: "hizmet",
            h: "2. Hizmetin tanımı",
            blocks: [
              { p: "Prompt.Monster; proje fikrini uzman persona şablonları ve yapay zekâ desteğiyle Claude Code, Cursor, v0, Lovable, Bolt gibi araçlara verilecek build prompt'larına dönüştüren bir yazılım hizmetidir. Bazı özellikler, girdiğin metni üçüncü taraf bir yapay zekâ modeline (Anthropic Claude) göndererek çalışır." },
              { p: "Yapay zekâ çıktıları hatalı, eksik veya güncel olmayan bilgi içerebilir. Üretilen prompt'ları ve bunlarla oluşturduğun kodu kullanmadan önce gözden geçirmek, test etmek ve güvenliğini sağlamak senin sorumluluğundadır. Hizmet; hukuki, mali, tıbbi veya güvenlik danışmanlığı değildir." },
            ],
          },
          {
            id: "hesap",
            h: "3. Hesap",
            blocks: [
              {
                ul: [
                  "Kayıt olurken doğru bir e-posta adresi vermelisin. Hesabının ve şifrenin güvenliğinden sen sorumlusun; yetkisiz bir kullanım fark edersen bize hemen bildir.",
                  "Hesaplar kişiseldir. Bir hesabı birden fazla kişiyle paylaşmak veya kullanım limitlerini aşmak için birden fazla hesap açmak yasaktır.",
                  "Hizmet'i kullanmak için en az 16 yaşında olmalısın. Ücretli planlar için 18 yaşını doldurmuş olmalı veya veli/vasi onayına sahip olmalısın.",
                  "Studio'nun temel özelliklerini hesap açmadan da kullanabilirsin; kaydetme, paylaşım ve bazı yapay zekâ özellikleri hesap gerektirir.",
                ],
              },
            ],
          },
          {
            id: "odeme",
            h: "4. Planlar, ödeme ve yenileme",
            blocks: [
              {
                ul: [
                  "Free plan ücretsizdir ve kullanım limitleri içerir. Güncel limitler ve fiyatlar [Fiyatlandırma](/pricing) sayfasındadır.",
                  "Monster Pro aylık veya yıllık abonelik olarak sunulur ve iptal edilmedikçe her dönemin sonunda aynı süre için otomatik olarak yenilenir.",
                  `Ödemeler, yetkili satıcı (Merchant of Record) sıfatıyla ${LS} tarafından tahsil edilir. Satın alma işlemi ayrıca Lemon Squeezy'nin alıcı koşullarına tabidir; faturan ve vergiler (KDV vb.) Lemon Squeezy tarafından düzenlenir. Kart bilgilerin bize iletilmez.`,
                  "Aboneliğini istediğin zaman iptal edebilirsin. İptal, bir sonraki yenilemeyi durdurur; Pro erişimin ödenmiş dönemin sonuna kadar devam eder, ardından hesabın Free plana geçer ve projelerin silinmez.",
                  "Pro plan, kötüye kullanımı ve aşırı maliyeti önlemek için adil kullanım sınırları (günlük ve aylık yapay zekâ kullanım hakları) içerir. Bu sınırlar fiyat sayfasında gösterilir.",
                  "Fiyat değişiklikleri mevcut abonelere en az 30 gün önceden bildirilir ve bildirimden sonraki ilk yenileme döneminden itibaren uygulanır.",
                  "İade koşulları [İade Politikası](/legal/refund)'nda açıklanmıştır.",
                ],
              },
            ],
          },
          {
            id: "icerik",
            h: "5. İçerik ve çıktıların sahipliği",
            blocks: [
              {
                ul: [
                  "Studio'ya girdiğin metinler (proje fikri, açıklamalar, seçimler) ve Hizmet'in senin için ürettiği prompt'lar, yürürlükteki hukukun izin verdiği ölçüde sana aittir. Onları ticari projeler dahil dilediğin gibi kullanabilirsin.",
                  "Hizmet'i sunabilmemiz için (saklama, görüntüleme, yapay zekâ modeline iletme, yedekleme) içeriğini işlememize yönelik sınırlı, dünya çapında ve ücretsiz bir lisans vermiş olursun. Bu lisans, içeriği sildiğinde veya hesabını kapattığında sona erer (yedeklerden makul sürede silinmesi hariç).",
                  "İçeriğini yapay zekâ modellerini eğitmek için kullanmayız. Kullandığımız model sağlayıcısı da API üzerinden iletilen içerikleri kendi ticari koşulları gereği model eğitiminde kullanmaz.",
                  "Paylaş özelliğiyle oluşturduğun /p/… sayfaları herkese açıktır: bağlantıya sahip herkes görüntüleyebilir ve sayfa arama motorlarında listelenebilir. Paylaşmak istemediğin bilgileri bu sayfalara koyma; paylaşımı istediğin zaman kaldırabilirsin.",
                  "Prompt'lara şifre, API anahtarı, kişisel veri veya gizli ticari bilgi yazmamanı öneririz.",
                  "Girdiğin içeriğin hukuka uygun olmasından ve üçüncü kişilerin haklarını ihlal etmemesinden sen sorumlusun.",
                ],
              },
            ],
          },
          {
            id: "kullanim",
            h: "6. Kabul edilebilir kullanım",
            blocks: [
              { p: "Hizmet'i şu amaçlarla kullanamazsın:" },
              {
                ul: [
                  "Hukuka aykırı içerik üretmek veya üçüncü kişilerin telif, marka, kişilik ya da diğer haklarını ihlal etmek",
                  "Kötü amaçlı yazılım, dolandırıcılık, oltalama (phishing), spam veya siber saldırı aracı geliştirmek",
                  "Kullanım limitlerini, ödeme sistemini veya güvenlik önlemlerini aşmaya çalışmak; Hizmet'e otomatik araçlarla aşırı yük bindirmek",
                  "Hizmet'i izinsiz yeniden satmak, API erişimini üçüncü kişilere kiralamak veya rakip bir ürün oluşturmak için sistematik veri toplamak",
                  "Yapay zekâ sağlayıcısının kullanım politikalarını ihlal eden taleplerde bulunmak",
                ],
              },
              { p: "Bu kurallara aykırılık hâlinde ilgili içeriği kaldırabilir, hesabı askıya alabilir veya kapatabiliriz." },
            ],
          },
          {
            id: "api",
            h: "7. API ve entegrasyonlar",
            blocks: [
              { p: "Hizmet'e API, MCP sunucusu, tarayıcı eklentisi gibi entegrasyonlarla erişiyorsan sana verilen anahtarları gizli tutmak ve oran sınırlarına uymak senin sorumluluğundadır. Anahtarlarının kötüye kullanıldığını fark edersen bize hemen bildir; anahtarı iptal edip yenisini oluşturabilirsin." },
            ],
          },
          {
            id: "fikri-mulkiyet",
            h: "8. Fikri mülkiyet",
            blocks: [
              { p: "Prompt.Monster adı, logosu, arayüzü, uzman persona metinleri, şablonları ve yazılımı bize veya lisans verenlerimize aittir. Yazılımın açık kaynak lisansıyla yayımlanan bölümleri için ilgili lisans hükümleri geçerlidir. Bu koşullar sana, Hizmet'i bu koşullara uygun olarak kullanman için kişisel, devredilemez ve münhasır olmayan bir kullanım hakkı dışında bir hak vermez." },
            ],
          },
          {
            id: "degisiklik-kesinti",
            h: "9. Hizmetteki değişiklikler ve kesintiler",
            blocks: [
              { p: "Hizmet'i geliştirmek için özellik ekleyebilir, değiştirebilir veya kaldırabiliriz. Bakım, üçüncü taraf sağlayıcı arızaları veya mücbir sebepler nedeniyle geçici kesintiler olabilir. Ücretli planın temel özelliklerini önemli ölçüde kısıtlayan bir değişiklik yaparsak bunu önceden bildirir ve dilersen aboneliğini iptal etmene imkân tanırız." },
            ],
          },
          {
            id: "sorumluluk",
            h: "10. Garanti reddi ve sorumluluğun sınırlandırılması",
            blocks: [
              { p: "Hizmet \"olduğu gibi\" ve \"mevcut olduğu şekilde\" sunulur. Yürürlükteki hukukun izin verdiği azami ölçüde; Hizmet'in kesintisiz veya hatasız olacağını, yapay zekâ çıktılarının doğru ya da belirli bir amaca uygun olacağını garanti etmeyiz." },
              { p: "Kasıt ve ağır kusur hâlleri ile tüketici mevzuatından doğan emredici sorumluluklar saklı kalmak kaydıyla; dolaylı zararlardan, kâr veya veri kaybından sorumlu olmayız ve toplam sorumluluğumuz, talebe konu olaydan önceki 12 ay içinde Hizmet için ödediğin tutarla sınırlıdır." },
            ],
          },
          {
            id: "fesih",
            h: "11. Fesih",
            blocks: [
              { p: `Hesabını istediğin zaman kapatabilirsin; bunun için ${mail(i)} adresine yazman yeterli. Bu koşulları ihlal etmen hâlinde hesabını askıya alabilir veya kapatabiliriz; ciddi ihlaller dışında önce seni bilgilendirmeye çalışırız. Fesih hâlinde, [İade Politikası](/legal/refund)'nda belirtilen durumlar dışında peşin ödenmiş ücretler iade edilmez.` },
            ],
          },
          {
            id: "hukuk",
            h: "12. Uygulanacak hukuk ve uyuşmazlıklar",
            blocks: [
              { p: "Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketiciler, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki haklarını saklı tutar ve uyuşmazlıklarda parasal sınırlar dahilinde Tüketici Hakem Heyetlerine veya Tüketici Mahkemelerine başvurabilir. Avrupa Birliği'nde yerleşik tüketiciler, yerleşim yerlerindeki emredici tüketici koruma kurallarından yararlanmaya devam eder." },
            ],
          },
          {
            id: "guncelleme",
            h: "13. Koşullardaki değişiklikler",
            blocks: [
              { p: "Bu koşulları zaman zaman güncelleyebiliriz. Önemli değişiklikleri yürürlüğe girmeden makul bir süre önce site üzerinden veya e-postayla duyururuz. Değişiklikten sonra Hizmet'i kullanmaya devam etmen, güncel koşulları kabul ettiğin anlamına gelir." },
            ],
          },
          {
            id: "iletisim",
            h: "14. İletişim",
            blocks: [{ p: `Sorular ve bildirimler için: ${mail(i)}` }],
          },
        ],
      };

    case "privacy":
      return {
        slug,
        title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
        short: "Gizlilik (KVKK)",
        description: "Prompt.Monster'ın hangi kişisel verileri hangi amaç ve hukuki sebeple işlediği; aktarımlar, saklama süreleri ve KVKK/GDPR kapsamındaki hakların.",
        intro: [
          "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") madde 10 ve AB Genel Veri Koruma Tüzüğü (\"GDPR\") kapsamında, Prompt.Monster'ı kullanırken kişisel verilerinin nasıl işlendiğini açıklar. Kişisel verilerini satmayız.",
        ],
        sections: [
          {
            id: "veri-sorumlusu",
            h: "1. Veri sorumlusu",
            blocks: [{ p: `Veri sorumlusu: ${controller(i)}. İletişim: ${mail(i)}.` }, ...registry(i).map((p) => ({ p }))],
          },
          {
            id: "veriler",
            h: "2. İşlediğimiz kişisel veriler",
            blocks: [
              {
                table: {
                  head: ["Kategori", "Örnekler", "Kaynak"],
                  rows: [
                    ["Kimlik ve iletişim", "E-posta adresi, (verirsen) adın", "Kayıt formu, ödeme sağlayıcısı"],
                    ["Hesap güvenliği", "Şifre (yalnızca hash'lenmiş olarak, kimlik doğrulama sağlayıcımızda), oturum bilgileri", "Kayıt ve giriş"],
                    ["İçerik", "Proje fikirleri, açıklamalar, seçimler, üretilen prompt'lar, versiyonlar, paylaşım sayfaları", "Studio'ya girdiğin bilgiler"],
                    ["Kullanım ve işlem", "Yapay zekâ kullanım kayıtları (özellik, zaman, model, token sayısı), plan ve abonelik durumu, geldiğin kampanya kaynağı", "Otomatik"],
                    ["Ödeme", "Sipariş ve abonelik numarası, plan, ülke, fatura e-postası (kart bilgileri bize ulaşmaz)", "Lemon Squeezy"],
                    ["Teknik", "IP adresi, tarayıcı ve cihaz bilgisi, hata kayıtları", "Otomatik"],
                    ["Yazışmalar", "Bize gönderdiğin e-postalar ve destek talepleri", "Sen"],
                    ["Çerez verileri (yalnızca izin verirsen)", "Analitik ve reklam ölçüm verileri", "Çerezler — bkz. [Çerez Politikası](/legal/cookies)"],
                  ],
                },
              },
            ],
          },
          {
            id: "amaclar",
            h: "3. İşleme amaçları ve hukuki sebepler",
            blocks: [
              {
                table: {
                  head: ["Amaç", "Hukuki sebep (KVKK md. 5 / GDPR md. 6)"],
                  rows: [
                    ["Hesap oluşturma, giriş, Hizmet'in sunulması, projelerinin saklanması", "Sözleşmenin kurulması ve ifası (KVKK 5/2-c; GDPR 6/1-b)"],
                    ["Yapay zekâ özelliklerinin çalıştırılması (girdiğin metnin modele iletilmesi)", "Sözleşmenin ifası (KVKK 5/2-c; GDPR 6/1-b)"],
                    ["Abonelik, ödeme, faturalandırma ve iade süreçleri", "Sözleşmenin ifası ve hukuki yükümlülük (KVKK 5/2-c, 5/2-ç; GDPR 6/1-b, 6/1-c)"],
                    ["İşlemsel e-postalar (doğrulama, şifre sıfırlama, ödeme bildirimleri)", "Sözleşmenin ifası (KVKK 5/2-c; GDPR 6/1-b)"],
                    ["Güvenlik, kötüye kullanım ve dolandırıcılığın önlenmesi, kullanım limitleri", "Meşru menfaat (KVKK 5/2-f; GDPR 6/1-f)"],
                    ["Hizmet'in geliştirilmesi, toplu istatistikler, kampanya kaynağı ölçümü (kişiye özel profil çıkarılmadan)", "Meşru menfaat (KVKK 5/2-f; GDPR 6/1-f)"],
                    ["Analitik ve reklam çerezleri, reklam dönüşüm ölçümü", "Açık rıza (KVKK 5/1; GDPR 6/1-a) — dilediğin an geri alabilirsin"],
                    ["Hukuki taleplere yanıt verilmesi, uyuşmazlıklar", "Bir hakkın tesisi, kullanılması veya korunması; hukuki yükümlülük (KVKK 5/2-e, 5/2-ç)"],
                  ],
                },
              },
              { p: "Sana pazarlama e-postası göndermiyoruz. İleride gönderirsek yalnızca ayrıca onay vermen hâlinde göndereceğiz ve her iletide çıkış bağlantısı olacak." },
            ],
          },
          {
            id: "toplama",
            h: "4. Toplama yöntemi",
            blocks: [
              { p: "Kişisel verilerini; web sitesi ve Studio formları, API ve entegrasyon istekleri, çerezler ve benzeri teknolojiler ile ödeme sağlayıcımızdan gelen bildirimler aracılığıyla, kısmen veya tamamen otomatik yollarla topluyoruz." },
            ],
          },
          {
            id: "aktarim",
            h: "5. Aktarılan taraflar",
            blocks: [
              { p: "Hizmet'i sunmak için kişisel verilerini yalnızca aşağıdaki hizmet sağlayıcılarla ve yalnızca gerekli olduğu ölçüde paylaşırız:" },
              {
                table: {
                  head: ["Sağlayıcı", "Amaç", "Konum"],
                  rows: [
                    ["Cloudflare, Inc.", "Barındırma, içerik dağıtımı, güvenlik, oran sınırlama", "ABD / küresel ağ"],
                    ["Supabase, Inc.", "Veritabanı ve kimlik doğrulama", "ABD merkezli; sunucu bölgesi proje ayarına göre"],
                    ["Anthropic, PBC", "Yapay zekâ işleme (Claude)", "ABD"],
                    ["Resend, Inc.", "İşlemsel e-posta gönderimi", "ABD"],
                    ["Lemon Squeezy (Link, LLC)", "Ödeme, abonelik, fatura ve vergi (satıcı kaydı / Merchant of Record — ödeme verilerini kendi politikası uyarınca bağımsız veri sorumlusu olarak işler)", "ABD"],
                    ["Google LLC / Google Ireland Ltd.", "Analitik ve reklam ölçümü (yalnızca iznin varsa)", "ABD / AB"],
                    ["Meta Platforms Ireland Ltd.", "Reklam ölçümü (yalnızca iznin varsa)", "AB / ABD"],
                  ],
                },
              },
              { p: "Bunun dışında kişisel verilerini yalnızca kanunen yetkili kamu kurum ve kuruluşlarının talebi veya yasal zorunluluk hâlinde paylaşırız." },
            ],
          },
          {
            id: "yurt-disi",
            h: "6. Yurt dışına aktarım",
            blocks: [
              { p: "Yukarıdaki sağlayıcıların sunucuları Türkiye dışında (ağırlıklı olarak ABD ve AB'de) bulunduğundan kişisel verilerin yurt dışına aktarılır. Bu aktarımlar KVKK'nın 9. maddesinde ve GDPR'da öngörülen aktarım şartlarına uygun olarak, sağlayıcıların veri işleme sözleşmeleri ve standart sözleşme hükümleri gibi güvenceler çerçevesinde gerçekleştirilir." },
            ],
          },
          {
            id: "saklama",
            h: "7. Saklama süreleri",
            blocks: [
              {
                ul: [
                  "Hesap ve içerik verileri: hesabın açık olduğu sürece. Hesabını kapattığında 30 gün içinde silinir veya anonim hâle getirilir; yedeklerden silinmesi 30 gün daha sürebilir.",
                  "Paylaşım sayfaları: sen kaldırana veya hesabın silinene kadar.",
                  "Yapay zekâ kullanım kayıtları: hesabınla ilişkilendirilmiş hâliyle hesabın açık olduğu sürece; hesap kapatıldığında kimliğinden ayrılarak yalnızca anonim istatistik olarak tutulur.",
                  "IP adresi: oran sınırlama ve güvenlik için en fazla 48 saat; kullanım istatistiklerinde yalnızca geri döndürülemez şekilde özetlenmiş (hash) hâliyle en fazla 12 ay.",
                  "Ödeme ve fatura kayıtları: vergi ve ticaret mevzuatının öngördüğü süre boyunca (Türkiye'de genellikle 10 yıl). Fatura kayıtlarının asıl tutucusu Lemon Squeezy'dir.",
                  "Destek yazışmaları: talep sonuçlandıktan sonra en fazla 2 yıl.",
                  "Çerezler: [Çerez Politikası](/legal/cookies)'nda belirtilen süreler.",
                ],
              },
            ],
          },
          {
            id: "guvenlik",
            h: "8. Güvenlik",
            blocks: [
              { p: "Veriler aktarım sırasında TLS ile şifrelenir. Veritabanında satır düzeyi güvenlik (RLS) uygulanır; her kullanıcı yalnızca kendi verisine erişebilir. Şifreler yalnızca hash'lenmiş olarak saklanır ve yönetim erişimi en az yetki ilkesiyle sınırlıdır. Hiçbir sistem %100 güvenli değildir; bir veri ihlali olursa mevzuatın öngördüğü şekilde Kişisel Verileri Koruma Kurulu'na ve etkilenen kişilere bildirimde bulunuruz." },
            ],
          },
          {
            id: "haklar",
            h: "9. Hakların",
            blocks: [
              { p: "KVKK madde 11 uyarınca şu haklara sahipsin:" },
              {
                ul: [
                  "Kişisel verilerinin işlenip işlenmediğini öğrenme ve işlenmişse buna ilişkin bilgi talep etme",
                  "İşlenme amacını ve verilerin amacına uygun kullanılıp kullanılmadığını öğrenme",
                  "Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme",
                  "Eksik veya yanlış işlenmişse düzeltilmesini, KVKK madde 7 çerçevesinde silinmesini veya yok edilmesini isteme ve bu işlemlerin aktarılan üçüncü kişilere bildirilmesini talep etme",
                  "Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonucun ortaya çıkmasına itiraz etme",
                  "Kanuna aykırı işleme nedeniyle zarara uğraman hâlinde zararın giderilmesini talep etme",
                ],
              },
              { p: "AB/AEA'da bulunuyorsan GDPR kapsamında ayrıca veri taşınabilirliği, işlemenin kısıtlanması, itiraz ve bulunduğun ülkedeki denetim makamına şikâyet hakların vardır. Açık rızaya dayanan işlemler için rızanı dilediğin zaman geri alabilirsin; çerez tercihlerini [Çerez Politikası](/legal/cookies) sayfasından değiştirebilirsin." },
            ],
          },
          {
            id: "basvuru",
            h: "10. Başvuru yöntemi",
            blocks: [
              { p: `Haklarını kullanmak için, sistemimizde kayıtlı e-posta adresinden ${mail(i)} adresine yazabilirsin. Kimliğini doğrulamak için ek bilgi isteyebiliriz. Başvurunu en geç 30 gün içinde ücretsiz olarak sonuçlandırırız; işlemin ayrıca bir maliyet gerektirmesi hâlinde Kurul'ca belirlenen tarifedeki ücret talep edilebilir. Yanıtımızdan memnun kalmazsan Kişisel Verileri Koruma Kurulu'na şikâyette bulunabilirsin.` },
            ],
          },
          {
            id: "otomatik-karar",
            h: "11. Otomatik karar alma",
            blocks: [{ p: "Hakkında hukuki sonuç doğuran ve yalnızca otomatik işlemeye dayanan kararlar almayız. Kullanım limitleri gibi teknik kontroller otomatik olarak uygulanır." }],
          },
          {
            id: "cocuklar",
            h: "12. Çocuklar",
            blocks: [{ p: "Hizmet 16 yaşından küçüklere yönelik değildir ve bu yaştaki kişilerden bilerek kişisel veri toplamayız." }],
          },
          {
            id: "degisiklikler",
            h: "13. Değişiklikler",
            blocks: [{ p: "Bu metni güncelleyebiliriz; önemli değişiklikleri sitede duyururuz. Güncel sürüm her zaman bu sayfadadır." }],
          },
        ],
      };

    case "cookies":
      return {
        slug,
        title: "Çerez Politikası",
        short: "Çerezler",
        description: "Prompt.Monster'da hangi çerezlerin hangi amaçla ve ne kadar süreyle kullanıldığı ve çerez tercihlerini nasıl yöneteceğin.",
        intro: [
          "Çerezler, bir web sitesini ziyaret ettiğinde tarayıcına kaydedilen küçük metin dosyalarıdır. Prompt.Monster'da varsayılan olarak yalnızca Hizmet'in çalışması için gerekli çerezleri kullanırız. Analitik ve reklam çerezleri yalnızca izin verirsen etkinleşir ve iznini istediğin zaman geri alabilirsin.",
          i.tracking ? "Tercihlerini aşağıdaki düğmeyle istediğin zaman değiştirebilirsin." : "**Şu anda sitede analitik veya reklam etiketi etkin değildir; yalnızca zorunlu çerezler kullanılmaktadır.** Bu etiketler ileride etkinleştirilirse sana önceden izin soran bir bant gösterilir.",
        ],
        sections: [
          {
            id: "zorunlu",
            h: "1. Zorunlu çerezler ve tarayıcı depolaması",
            blocks: [
              { p: "Bu çerezler Hizmet'in çalışması, güvenliği veya senin açıkça istediğin bir işlevi yerine getirmek için gereklidir ve izne tabi değildir." },
              {
                table: {
                  head: ["Ad", "Amaç", "Süre"],
                  rows: [
                    ["sb-…-auth-token", "Oturumunu açık tutar (Supabase kimlik doğrulama)", "Çıkış yapana kadar, en fazla 400 gün"],
                    ["pm_consent", "Çerez tercihlerini hatırlar", "6 ay"],
                    ["pm_lang", "Dil tercihini hatırlar (dil düğmesini kullanırsan)", "1 yıl"],
                    ["pm_code", "İndirim bağlantısıyla geldiysen kodu ödeme adımına taşır", "30 gün"],
                    ["pm_src", "Hangi kampanya bağlantısıyla geldiğini (ör. utm_source) kaydeder; kişisel veri içermez, yalnızca toplu kanal istatistiği için kullanılır ve üçüncü taraflarla paylaşılmaz", "90 gün"],
                    ["__cf_bm, cf_clearance", "Cloudflare bot koruması ve güvenlik (gerektiğinde)", "30 dakika – 1 yıl"],
                    ["localStorage: prompt-monster:studio:v1", "Studio taslağını tarayıcında saklar (sunucuya gönderilmez)", "Sen silene kadar"],
                    ["sessionStorage: pm:notice:dismissed", "Kapattığın duyuru şeridini gizli tutar", "Sekme kapanana kadar"],
                  ],
                },
              },
            ],
          },
          {
            id: "analitik",
            h: "2. Analitik çerezler (izne tabi)",
            blocks: [
              {
                table: {
                  head: ["Ad", "Sağlayıcı ve amaç", "Süre"],
                  rows: [["_ga, _ga_<ID>", "Google Analytics 4 — ziyaret ve kullanım istatistikleri (IP anonimleştirme açık)", "2 yıl"]],
                },
              },
            ],
          },
          {
            id: "reklam",
            h: "3. Reklam ve pazarlama çerezleri (izne tabi)",
            blocks: [
              {
                table: {
                  head: ["Ad", "Sağlayıcı ve amaç", "Süre"],
                  rows: [
                    ["_gcl_au, _gcl_aw", "Google Ads — reklamdan gelen kayıt ve satın alma ölçümü", "90 gün"],
                    ["_fbp, _fbc", "Meta Pixel — reklamdan gelen kayıt ve satın alma ölçümü", "90 gün"],
                  ],
                },
              },
            ],
          },
          {
            id: "yonetim",
            h: "4. Tercihlerini yönetme",
            blocks: [
              { p: "İlk ziyaretinde gösterilen bantta \"Tümünü kabul et\", \"Reddet\" veya \"Tercihler\" seçeneklerinden birini seçebilirsin. Kararını istediğin zaman değiştirebilirsin; izni geri aldığında ilgili çerezleri tarayıcından sileriz. Tarayıcı ayarlarından da çerezleri silebilir veya engelleyebilirsin; zorunlu çerezleri engellersen oturum açma gibi özellikler çalışmayabilir." },
              { cookieButton: true },
            ],
          },
          {
            id: "ucuncu-taraf",
            h: "5. Üçüncü taraf politikaları",
            blocks: [
              {
                ul: [
                  "[Google Gizlilik Politikası](https://policies.google.com/privacy)",
                  "[Meta Gizlilik Politikası](https://www.facebook.com/privacy/policy/)",
                  "[Cloudflare Çerez Politikası](https://www.cloudflare.com/cookie-policy/)",
                  "[Supabase Gizlilik Politikası](https://supabase.com/privacy)",
                ],
              },
              { p: `Kişisel verilerinin işlenmesiyle ilgili ayrıntılar için [Gizlilik Politikası ve KVKK Aydınlatma Metni](/legal/privacy)'ne bakabilir, sorularını ${mail(i)} adresine iletebilirsin.` },
            ],
          },
        ],
      };

    case "refund":
      return {
        slug,
        title: "İade Politikası",
        short: "İade",
        description: "Monster Pro için 14 gün koşulsuz iade, yenileme iadeleri, iptal ve iade talebi adımları.",
        intro: ["Monster Pro'yu risksiz denemeni istiyoruz. Bu politika, Lemon Squeezy üzerinden satın alınan Pro abonelikleri için geçerlidir."],
        sections: [
          {
            id: "14-gun",
            h: "1. 14 gün koşulsuz iade",
            blocks: [{ p: "İlk Pro satın alımından (aylık veya yıllık) itibaren **14 gün içinde**, gerekçe göstermeden tam iade isteyebilirsin." }],
          },
          {
            id: "yenileme",
            h: "2. Yenilemeler",
            blocks: [
              {
                ul: [
                  "Aboneliğin, iptal etmediğin sürece dönem sonunda otomatik olarak yenilenir; yenilemeden önce istediğin zaman iptal edebilirsin.",
                  "Bir yenileme ücretinin iadesini, yenileme tarihinden itibaren 7 gün içinde ve o dönemde Pro yapay zekâ özelliklerini kullanmamışsan isteyebilirsin.",
                  "Bu durumlar dışında kısmi dönem iadesi yapılmaz. İptal ettiğinde Pro erişimin ödenmiş dönemin sonuna kadar devam eder.",
                ],
              },
            ],
          },
          {
            id: "nasil",
            h: "3. Nasıl iade isterim?",
            blocks: [
              { p: `Satın alırken kullandığın e-posta adresinden ${mail(i)} adresine yaz ve sipariş numaranı (Lemon Squeezy makbuzunda yer alır) ekle. Uygun talepleri 3 iş günü içinde onaylarız. İade, Lemon Squeezy tarafından ödemeyi yaptığın yönteme gerçekleştirilir; bankana bağlı olarak hesabına yansıması 5–10 iş günü sürebilir.` },
            ],
          },
          {
            id: "iptal",
            h: "4. Aboneliği iptal etme",
            blocks: [
              { p: "[Fiyatlandırma](/pricing) sayfasındaki \"Aboneliği yönet\" bağlantısından (Lemon Squeezy müşteri portalı) veya ödeme e-postandaki bağlantıdan aboneliğini iptal edebilir, kartını güncelleyebilir ve faturalarını indirebilirsin. İstersen bize yazarak da iptal ettirebilirsin." },
            ],
          },
          {
            id: "kotuye-kullanim",
            h: "5. Kötüye kullanım",
            blocks: [
              { p: "Tekrarlayan iade talepleri, kötüye kullanım veya dolandırıcılık şüphesi durumunda iadeyi reddetme ve hesabı kapatma hakkımız saklıdır. Lemon Squeezy'nin alıcı koşulları da ayrıca uygulanır." },
            ],
          },
          {
            id: "yasal-haklar",
            h: "6. Yasal hakların",
            blocks: [
              { p: "Bu politika, tüketici mevzuatından doğan yasal haklarını sınırlamaz. Hizmet, dijital içerik olarak satın alındığı anda ifa edilmeye başlandığından cayma hakkı Mesafeli Sözleşmeler Yönetmeliği madde 15/1-ğ kapsamında sınırlı olabilir; yine de yukarıdaki 14 günlük koşulsuz iade süresini tanırız." },
              { p: "Free plan ücretsiz olduğundan iade kapsamı dışındadır." },
            ],
          },
        ],
      };
  }
}
