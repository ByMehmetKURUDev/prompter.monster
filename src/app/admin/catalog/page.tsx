import { getAdmin } from "@/lib/admin";
import { BUILTIN_CATEGORY_LABELS, builtinExperts, builtinTypes, type CatalogRow } from "@/lib/catalog";
import { COMPLIANCE, FEATURE_GROUPS, MONETIZATION, PAYMENTS, STACK } from "@/lib/data";
import { PageTitle } from "@/components/admin/ui";
import { CatalogAdmin } from "@/components/admin/CatalogAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCatalog() {
  const admin = (await getAdmin())!;
  const { data, error } = await admin.supabase.from("catalog_items").select("kind,id,data,enabled,sort,updated_at").order("sort").limit(1000);
  const rows = (data ?? []) as CatalogRow[];
  const missing = error && /catalog_items|does not exist|schema cache/.test(error.message);

  return (
    <>
      <PageTitle
        title="Katalog: uzmanlar ve proje tipleri"
        subtitle="Deploy gerekmeden yeni uzman / proje tipi ekle, yerleşik olanların metnini düzenle ya da gizle. Değişiklikler Studio, API ve MCP'de ~1 dakika içinde görünür."
      />
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">
          {missing ? "Migration 0009 (katalog) henüz uygulanmamış: supabase/migrations/0009_catalog.sql" : error.message}
        </div>
      )}
      <CatalogAdmin
        rows={rows}
        builtinExperts={builtinExperts()}
        builtinTypes={builtinTypes()}
        options={{
          categories: BUILTIN_CATEGORY_LABELS,
          payments: PAYMENTS.map((p) => ({ id: p.id, name: p.name })),
          monetization: MONETIZATION,
          compliance: COMPLIANCE,
          features: FEATURE_GROUPS.flatMap((g) => g.items),
          stack: Object.values(STACK).flat() as string[],
        }}
      />
    </>
  );
}
