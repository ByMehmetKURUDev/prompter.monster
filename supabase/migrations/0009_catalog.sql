-- 0009 — Admin'den yönetilen katalog: uzmanlar ve proje tipleri (deploy gerektirmeden ekle / düzenle / kapat).
-- Uygulama: Supabase SQL editor'da bir kez çalıştır (0001–0008 uygulanmış olmalı). Tekrar çalıştırılabilir.
--
-- Kodda gelen yerleşik uzman / tipler varsayılandır. Bu tablodaki bir satır:
--   * yerleşik bir öğeyle aynı id'yi taşıyorsa onu düzenler (data alanları üzerine yazılır) ya da enabled=false ile gizler;
--   * yeni bir id taşıyorsa yeni bir uzman / proje tipi ekler.

create table if not exists public.catalog_items (
  kind       text not null check (kind in ('expert', 'project_type')),
  id         text not null check (id ~ '^[a-z0-9][a-z0-9-]{1,39}$'),
  data       jsonb not null default '{}'::jsonb,
  enabled    boolean not null default true,
  sort       integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  primary key (kind, id)
);

alter table public.catalog_items enable row level security;

-- Katalog herkese açık içeriktir (Studio, API ve MCP okur); yazma yalnız admin.
drop policy if exists "catalog public read" on public.catalog_items;
create policy "catalog public read" on public.catalog_items for select using (true);
drop policy if exists "catalog admin insert" on public.catalog_items;
create policy "catalog admin insert" on public.catalog_items for insert with check (public.is_admin());
drop policy if exists "catalog admin update" on public.catalog_items;
create policy "catalog admin update" on public.catalog_items for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "catalog admin delete" on public.catalog_items;
create policy "catalog admin delete" on public.catalog_items for delete using (public.is_admin());

grant select on public.catalog_items to anon, authenticated;
grant insert, update, delete on public.catalog_items to authenticated;
