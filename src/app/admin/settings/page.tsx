import { readAllSettings } from "@/lib/settings-server";
import { SETTINGS_REGISTRY, isNew } from "@/lib/settings";
import { PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const { values, overrides } = await readAllSettings();
  const defs = SETTINGS_REGISTRY.map((d) => ({ ...d, isNew: isNew(d), overridden: d.key in overrides, updated_at: overrides[d.key]?.updated_at ?? null }));
  return (
    <>
      <PageTitle
        title="Ayarlar"
        subtitle="Deploy gerektirmeyen anahtarlar. Kodda tanımlı her ayar burada otomatik listelenir; yeni sürümle gelenler 14 gün 'YENİ' etiketi taşır. Değişiklikler anında geçerlidir (kota fonksiyonları ve sayfalar veritabanından okur)."
      />
      <SettingsForm defs={defs} values={values} />
    </>
  );
}
