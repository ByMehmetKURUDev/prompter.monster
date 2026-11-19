-- Prompt.Monster — 0021: Takım kuralları — takımın ortak stack'i, kod kuralları ve marka sesi her üyenin master
-- prompt'una eklenir. Supabase SQL Editor'da çalıştırın (0020'den sonra). Tekrar çalıştırılabilir (idempotent).
-- DROP yok, veri silmez.
--
-- Model: kurallar teams satırında durur (takım başına bir set). Sahip/yönetici düzenler (takım beklemedeyken de —
-- aktivasyondan önce hazırlansın), tüm üyeler okur. Prompt'a yalnız takım AKTİFken ve "açık" iken eklenir; Studio
-- kullanıcı başına (proje bazında) kapatabilir. Paylaşım sayfalarına ve kayıtlı versiyonlara eklenmez (uygulama).
-- Erişim yalnız aşağıdaki SECURITY DEFINER RPC'lerle; API/MCP yolu team_rules_for'u servis rolüyle çağırır.

alter table public.teams add column if not exists rules_stack text not null default '';
alter table public.teams add column if not exists rules_code text not null default '';
alter table public.teams add column if not exists rules_voice text not null default '';
alter table public.teams add column if not exists rules_enabled boolean not null default true;
alter table public.teams add column if not exists rules_updated_at timestamptz;
alter table public.teams add column if not exists rules_updated_by uuid references public.profiles(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'teams_rules_length') then
    alter table public.teams add constraint teams_rules_length
      check (char_length(rules_stack) <= 1500 and char_length(rules_code) <= 3000 and char_length(rules_voice) <= 1500);
  end if;
end $$;

-- 1) Okuma: kendi takımımın kuralları (her durumda; düzenleme yetkim ve takımın aktif olup olmadığıyla) ----------
create or replace function public.my_team_rules()
returns table (team_id uuid, team_name text, team_status text, stack text, code text, voice text, enabled boolean,
               can_edit boolean, updated_at timestamptz, updated_by_username text)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.status, t.rules_stack, t.rules_code, t.rules_voice, t.rules_enabled,
         m.role in ('owner', 'admin'), t.rules_updated_at, up.username
  from public.team_members m
  join public.teams t on t.id = m.team_id
  left join public.profiles up on up.id = t.rules_updated_by
  where m.user_id = auth.uid();
$$;
revoke all on function public.my_team_rules() from public, anon;
grant execute on function public.my_team_rules() to authenticated;

-- 2) Yazma: yalnız sahip/yönetici; iptal edilmiş takımda kapalı ---------------------------------------------------
create or replace function public.set_team_rules(p_stack text, p_code text, p_voice text, p_enabled boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_team uuid; v_role text; v_status text;
  v_stack text := btrim(coalesce(p_stack, ''));
  v_code text := btrim(coalesce(p_code, ''));
  v_voice text := btrim(coalesce(p_voice, ''));
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  select m.team_id, m.role, t.status into v_team, v_role, v_status
    from public.team_members m join public.teams t on t.id = m.team_id where m.user_id = v_uid;
  if v_team is null then raise exception 'no_team' using errcode = 'P0002'; end if;
  if v_role not in ('owner', 'admin') then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_status = 'canceled' then raise exception 'team_canceled' using errcode = '55000'; end if;
  if char_length(v_stack) > 1500 or char_length(v_code) > 3000 or char_length(v_voice) > 1500 then
    raise exception 'too_long' using errcode = '22001';
  end if;
  update public.teams
     set rules_stack = v_stack, rules_code = v_code, rules_voice = v_voice, rules_enabled = coalesce(p_enabled, true),
         rules_updated_at = now(), rules_updated_by = v_uid, updated_at = now()
   where id = v_team;
end $$;
revoke all on function public.set_team_rules(text, text, text, boolean) from public, anon;
grant execute on function public.set_team_rules(text, text, text, boolean) to authenticated;

-- 3) API/MCP (servis rolü): bir kullanıcının üretimlerine eklenecek kurallar — yalnız aktif takım, açık ve boş değil
create or replace function public.team_rules_for(p_user uuid)
returns table (team_name text, stack text, code text, voice text)
language sql stable security definer set search_path = public as $$
  select t.name, t.rules_stack, t.rules_code, t.rules_voice
  from public.team_members m
  join public.teams t on t.id = m.team_id
  where m.user_id = p_user and t.status = 'active' and t.rules_enabled
    and (t.rules_stack <> '' or t.rules_code <> '' or t.rules_voice <> '');
$$;
revoke all on function public.team_rules_for(uuid) from public, anon, authenticated;
grant execute on function public.team_rules_for(uuid) to service_role;

-- Kontrol (tek satır, hepsi true olmalı):
-- select has_function_privilege('authenticated', 'public.my_team_rules()', 'execute') as auth_read,
--        not has_function_privilege('anon', 'public.my_team_rules()', 'execute') as anon_blocked,
--        not has_function_privilege('authenticated', 'public.team_rules_for(uuid)', 'execute') as api_fn_private,
--        has_function_privilege('service_role', 'public.team_rules_for(uuid)', 'execute') as api_fn_service;
