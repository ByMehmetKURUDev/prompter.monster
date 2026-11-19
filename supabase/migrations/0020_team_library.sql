-- Prompt.Monster — 0020: Takım kütüphanesi — projeni takımınla paylaş, takımın paylaştıklarını gör, kopyasını Studio'da aç.
-- Supabase SQL Editor'da çalıştırın (0019'dan sonra). Tekrar çalıştırılabilir (idempotent). DROP yok, veri silmez.
--
-- Model: bir proje en fazla bir takımla paylaşılır (team_projects, PK project_id). Yalnız proje sahibi paylaşır/kaldırır,
-- yalnız kendi AKTİF takımına. Takım üyeleri listeyi görür ve projenin durumunu (state) okuyup Studio'da kendi kopyası
-- olarak açar; başkasının projesini değiştiremez. projects tablosuna ve RLS'ine dokunulmaz (updated_at değişmez);
-- tablo erişimi yalnız aşağıdaki SECURITY DEFINER RPC'lerle. Üye takımdan çıkınca paylaştıkları otomatik kalkar.

create table if not exists public.team_projects (
  project_id uuid primary key references public.projects(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  shared_by  uuid not null references public.profiles(id) on delete cascade,
  shared_at  timestamptz not null default now()
);
create index if not exists team_projects_team_idx on public.team_projects (team_id, shared_at desc);
alter table public.team_projects enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'team_projects' and policyname = 'admin read team projects') then
    create policy "admin read team projects" on public.team_projects for select using (public.is_admin());
  end if;
end $$;

-- 1) Paylaş / kaldır ------------------------------------------------------------------------------------------
create or replace function public.set_project_team_share(p_project uuid, p_share boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_owner uuid; v_team uuid; v_status text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  select p.owner_id into v_owner from public.projects p where p.id = p_project;
  if v_owner is null or v_owner <> v_uid then raise exception 'project_not_found' using errcode = 'P0002'; end if;
  if not coalesce(p_share, false) then
    delete from public.team_projects where project_id = p_project;
    return false;
  end if;
  select m.team_id, t.status into v_team, v_status
    from public.team_members m join public.teams t on t.id = m.team_id where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_status <> 'active' then raise exception 'team_inactive' using errcode = '55000'; end if;
  insert into public.team_projects (project_id, team_id, shared_by) values (p_project, v_team, v_uid)
    on conflict (project_id) do update set team_id = excluded.team_id, shared_by = excluded.shared_by, shared_at = now();
  return true;
end $$;
revoke all on function public.set_project_team_share(uuid, boolean) from public, anon;
grant execute on function public.set_project_team_share(uuid, boolean) to authenticated;

-- 2) Kütüphane sayfası: hangi projelerim şu anki takımımla paylaşılmış ---------------------------------------
create or replace function public.my_team_shared_projects()
returns table (project_id uuid)
language sql stable security definer set search_path = public as $$
  select tp.project_id
  from public.team_projects tp
  join public.projects p on p.id = tp.project_id
  join public.team_members m on m.team_id = tp.team_id and m.user_id = auth.uid()
  where p.owner_id = auth.uid();
$$;
revoke all on function public.my_team_shared_projects() from public, anon;
grant execute on function public.my_team_shared_projects() to authenticated;

-- 3) Takım kütüphanesi listesi (yalnız aktif takımın üyeleri; sahibi hâlâ takımda olan projeler) -------------
create or replace function public.team_library(p_limit integer default 100)
returns table (project_id uuid, name text, project_type text, owner_username text, is_mine boolean,
               shared_at timestamptz, updated_at timestamptz, versions integer, latest_version integer)
language sql stable security definer set search_path = public as $$
  with me as (
    select m.team_id from public.team_members m join public.teams t on t.id = m.team_id
    where m.user_id = auth.uid() and t.status = 'active'
  )
  select p.id, p.name, p.project_type, pr.username, p.owner_id = auth.uid(), tp.shared_at, p.updated_at,
         (select count(*)::int from public.generations g where g.project_id = p.id),
         (select max(g.version)::int from public.generations g where g.project_id = p.id)
  from me
  join public.team_projects tp on tp.team_id = me.team_id
  join public.projects p on p.id = tp.project_id
  join public.team_members om on om.team_id = tp.team_id and om.user_id = p.owner_id
  left join public.profiles pr on pr.id = p.owner_id
  order by tp.shared_at desc
  limit greatest(least(coalesce(p_limit, 100), 500), 1);
$$;
revoke all on function public.team_library(integer) from public, anon;
grant execute on function public.team_library(integer) to authenticated;

-- 4) Takım projesini kopyalamak için oku (Studio ?teamProject=<id>) -------------------------------------------
create or replace function public.team_project(p_project uuid)
returns table (project_id uuid, name text, project_type text, state jsonb, owner_username text, is_mine boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.project_type, p.state, pr.username, p.owner_id = auth.uid()
  from public.team_projects tp
  join public.teams t on t.id = tp.team_id and t.status = 'active'
  join public.team_members me on me.team_id = tp.team_id and me.user_id = auth.uid()
  join public.team_members om on om.team_id = tp.team_id
  join public.projects p on p.id = tp.project_id and p.owner_id = om.user_id
  left join public.profiles pr on pr.id = p.owner_id
  where tp.project_id = p_project;
$$;
revoke all on function public.team_project(uuid) from public, anon;
grant execute on function public.team_project(uuid) to authenticated;

-- 5) Üye takımdan çıkınca (ayrılma, çıkarılma, takım silme) o takımla paylaştığı projeler kalkar ---------------
create or replace function public.team_member_unshare()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.team_projects tp
   using public.projects p
   where tp.project_id = p.id and tp.team_id = old.team_id and p.owner_id = old.user_id;
  return old;
end $$;
revoke all on function public.team_member_unshare() from public, anon, authenticated;
create or replace trigger team_member_unshare
  after delete on public.team_members
  for each row execute function public.team_member_unshare();

-- Kontrol (tek satır, hepsi true olmalı):
-- select to_regclass('public.team_projects') is not null as table_ok,
--        has_function_privilege('authenticated', 'public.team_library(integer)', 'execute') as auth_ok,
--        not has_function_privilege('anon', 'public.team_library(integer)', 'execute') as anon_blocked;
