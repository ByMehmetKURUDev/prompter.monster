-- Prompt.Monster — Faz 6b: Keşfet beğenileri + "Usta Canavarlar" lider tablosu
-- prompts.chat/Promptmasters analizinden öneri #1 (bkz. claude/prompter-monster-plan.md, 17 Kas güncellemesi).
-- Supabase SQL Editor'da çalıştırın (0010_explore_feedback.sql'den sonra). Tekrar çalıştırılabilir (idempotent).
-- Not: explore_list/explore_stats'ın DÖNÜŞ TİPİNİ değiştirmek (likes eklemek) Postgres'te DROP FUNCTION
-- gerektirir; bu, Supabase MCP'de yıkıcı-işlem onayı istiyor ve interaktif olmayan ortamda zaman aşımına
-- uğruyor. Bunun yerine YENİ fonksiyon adları (_v2) ekliyoruz — eskiler dokunulmadan kalır, hiçbir DROP yok.
-- admin_shares bilerek değiştirilmedi (bu öneri yalnızca herkese açık Keşfet'i kapsıyor).

-- 1) shared_links: beğeni sayacı (denormalize, shared_link_likes ile senkron tutulur) --------------
alter table public.shared_links add column if not exists likes integer not null default 0;

-- 2) shared_link_likes — kim neyi beğendi (çift beğeniyi PK engeller) --------------------------------
create table if not exists public.shared_link_likes (
  shared_link_slug text not null references public.shared_links(slug) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  primary key (shared_link_slug, user_id)
);
create index if not exists shared_link_likes_user_idx on public.shared_link_likes(user_id);
create index if not exists shared_link_likes_created_idx on public.shared_link_likes(created_at desc);

alter table public.shared_link_likes enable row level security;
-- Doğrudan yazım yok: tüm değişiklikler toggle_shared_like() (security definer) üzerinden.
drop policy if exists "admin read likes" on public.shared_link_likes;
create policy "admin read likes" on public.shared_link_likes for select using (public.is_admin());

-- 3) toggle_shared_like — giriş yapmış kullanıcı beğenir/beğeniyi geri alır ---------------------------
--    Kendi paylaşımını beğenemez (lider tablosunu kendi kendine şişirmeyi engeller).
create or replace function public.toggle_shared_like(p_slug text)
returns table(liked boolean, likes integer)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_exists boolean;
  v_likes integer;
begin
  if v_uid is null then
    raise exception 'auth_required' using errcode = '28000';
  end if;
  select owner_id into v_owner from public.shared_links where slug = p_slug;
  if v_owner is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if v_owner = v_uid then
    raise exception 'cannot_like_own_share' using errcode = '42501';
  end if;
  select exists(select 1 from public.shared_link_likes where shared_link_slug = p_slug and user_id = v_uid) into v_exists;
  if v_exists then
    delete from public.shared_link_likes where shared_link_slug = p_slug and user_id = v_uid;
    update public.shared_links set likes = greatest(likes - 1, 0) where slug = p_slug returning likes into v_likes;
    return query select false, v_likes;
  else
    insert into public.shared_link_likes (shared_link_slug, user_id) values (p_slug, v_uid);
    update public.shared_links set likes = likes + 1 where slug = p_slug returning likes into v_likes;
    return query select true, v_likes;
  end if;
end $$;
revoke all on function public.toggle_shared_like(text) from public;
grant execute on function public.toggle_shared_like(text) to authenticated;

-- 4) shared_links_liked_by_me — bu slug kümesinden hangilerini ben beğendim (ExploreGrid toplu sorgu) --
create or replace function public.shared_links_liked_by_me(p_slugs text[])
returns setof text
language sql stable security definer set search_path = public as $$
  select shared_link_slug from public.shared_link_likes
  where user_id = auth.uid() and shared_link_slug = any(p_slugs);
$$;
revoke all on function public.shared_links_liked_by_me(text[]) from public;
grant execute on function public.shared_links_liked_by_me(text[]) to authenticated;

-- 5) explore_list_v2 — explore_list ile aynı, + likes sütunu + 'liked' sıralaması. Yeni ad: DROP yok. ---
create or replace function public.explore_list_v2(p_lang text default null, p_type text default null, p_sort text default 'new', p_limit integer default 24, p_offset integer default 0)
returns table (
  slug text, name text, project_type text, format text, lang text, pitch text,
  experts text[], views integer, forks integer, likes integer, featured boolean, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.slug, pr.name, pr.project_type, g.format, g.lang,
         coalesce(pr.state->>'pitch', '') as pitch,
         g.experts, l.views, l.forks, l.likes, l.featured, l.created_at
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  join public.projects pr on pr.id = g.project_id
  where l.listed and not l.hidden
    and (p_lang is null or g.lang = p_lang)
    and (p_type is null or pr.project_type = p_type)
  order by
    l.featured desc,
    case p_sort
      when 'popular' then l.views::bigint
      when 'forked'  then l.forks::bigint
      when 'liked'   then l.likes::bigint
      else extract(epoch from l.created_at)::bigint
    end desc,
    l.created_at desc
  limit greatest(least(p_limit, 60), 1)
  offset greatest(p_offset, 0);
$$;
revoke all on function public.explore_list_v2(text, text, text, integer, integer) from public;
grant execute on function public.explore_list_v2(text, text, text, integer, integer) to anon, authenticated;

-- 6) explore_stats_v2 — explore_stats ile aynı, + total_likes. Yeni ad: DROP yok. ----------------------
create or replace function public.explore_stats_v2()
returns table (total bigint, tr bigint, en bigint, total_forks bigint, total_likes bigint)
language sql stable security definer set search_path = public as $$
  select count(*), count(*) filter (where g.lang = 'TR'), count(*) filter (where g.lang = 'EN'),
         coalesce(sum(l.forks), 0), coalesce(sum(l.likes), 0)
  from public.shared_links l
  join public.generations g on g.id = l.generation_id
  where l.listed and not l.hidden;
$$;
revoke all on function public.explore_stats_v2() from public;
grant execute on function public.explore_stats_v2() to anon, authenticated;

-- 7) leaderboard_creators — "Usta Canavarlar": pencere içinde ALINAN beğeniye göre katkıcı sırası ------
--    p_window: 'week' | 'month' | diğer her şey (varsayılan dahil) 'all' gibi davranır.
create or replace function public.leaderboard_creators(p_window text default 'all', p_limit integer default 20)
returns table (
  owner_id      uuid,
  display_name  text,
  window_likes  bigint,
  total_forks   bigint,
  share_count   bigint
)
language sql stable security definer set search_path = public as $$
  with likes_in_window as (
    select sl.shared_link_slug
    from public.shared_link_likes sl
    where p_window not in ('week', 'month')
       or (p_window = 'month' and sl.created_at >= now() - interval '30 days')
       or (p_window = 'week'  and sl.created_at >= now() - interval '7 days')
  )
  select l.owner_id,
         coalesce(nullif(trim(p.display_name), ''), split_part(p.email, '@', 1)) as display_name,
         count(liw.*) as window_likes,
         coalesce(sum(l.forks), 0) as total_forks,
         count(distinct l.slug) as share_count
  from public.shared_links l
  join public.profiles p on p.id = l.owner_id
  left join likes_in_window liw on liw.shared_link_slug = l.slug
  where l.listed and not l.hidden
  group by l.owner_id, p.display_name, p.email
  having count(liw.*) > 0
  order by window_likes desc, total_forks desc
  limit greatest(least(p_limit, 100), 1);
$$;
revoke all on function public.leaderboard_creators(text, integer) from public;
grant execute on function public.leaderboard_creators(text, integer) to anon, authenticated;

-- NOT: explore_list / explore_stats / admin_shares (eski adlar) bu migration'da DEĞİŞTİRİLMEDİ —
-- mevcut çağıranlar (varsa) etkilenmez. Uygulama kodu artık explore_list_v2 / explore_stats_v2 çağırıyor.
