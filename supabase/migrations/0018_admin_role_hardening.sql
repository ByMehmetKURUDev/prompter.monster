-- Prompt.Monster — 0018: sahip hesabına veritabanı admin rolü + giriş gerektiren RPC'lerde anon yetkisi kaldırma + search_path.
-- Supabase SQL Editor'da çalıştırın (0017_teams.sql'den sonra). Tekrar çalıştırılabilir (idempotent). DROP yok, veri silmez.
-- 19 Kas 2026 canlı testinde bulundu (bkz. claude/prompter-monster-plan.md, devam 9).

-- 1) Admin rolü --------------------------------------------------------------------------------------------
-- Uygulama /admin kapısını ADMIN_EMAILS ile de açar, ama veritabanındaki is_admin() yalnız profiles.role = 'admin'
-- satırına bakar. 0005 bu güncellemeyi çalıştırdığında sahip profili henüz yoktu; bu yüzden admin_* RPC'leri boş
-- dönüyor, admin_update_team (takım aktivasyonu) ve ayar kaydı 'forbidden' veriyordu. Aynı satırı tekrar çalıştırıyoruz.
-- Not: yeni bir ADMIN_EMAILS adresi eklenirse /admin sayfası üstte uyarı gösterir (src/app/admin/layout.tsx).
update public.profiles set role = 'admin'
 where lower(email) = 'mehmetkuru.dev@gmail.com' and role is distinct from 'admin';

-- 2) Giriş gerektiren SECURITY DEFINER RPC'ler: anon EXECUTE kaldır ------------------------------------------
-- Supabase'in varsayılan yetkileri her yeni fonksiyona anon EXECUTE de veriyor. Bu fonksiyonlar auth.uid() / is_admin()
-- kontrol ettiği için açık değildi; yine de savunma derinliği ve Supabase lint 0028 için anon yetkisini kaldırıyoruz.
-- Uygulamadaki tüm çağrı yerleri önce oturum kontrolü yapıyor (api/team, api/me, api/explore/liked, api/account/username…).
-- Herkese açık kalanlara dokunulmaz: explore_*, get_shared, public_*, leaderboard_*, sitemap_*, team_invite_preview,
-- bump_shared_*, submit_feedback, setting_*, is_admin (RLS politikaları anon isteklerinde de çağırır).
do $$
declare f text;
begin
  foreach f in array array[
    -- takım (0017)
    'public.accept_team_invite(text)', 'public.create_team(text)', 'public.create_team_invite(text, text)',
    'public.delete_team()', 'public.leave_team()', 'public.my_team()', 'public.my_team_invites()', 'public.my_team_members()',
    'public.remove_team_member(uuid)', 'public.rename_team(text)', 'public.revoke_team_invite(uuid)',
    'public.set_team_member_role(uuid, text)', 'public.transfer_team_ownership(uuid)',
    -- admin paneli
    'public.admin_api_keys(integer)', 'public.admin_channel_sales(integer)', 'public.admin_channels(integer)',
    'public.admin_daily(integer)', 'public.admin_feedback(integer)', 'public.admin_recent_generations(integer)',
    'public.admin_shares(integer)', 'public.admin_stats()', 'public.admin_subscriptions(integer)',
    'public.admin_teams(integer)', 'public.admin_update_team(uuid, text, integer, text)',
    'public.admin_usage_models(integer)', 'public.admin_usage_sources(integer)', 'public.admin_users(text, integer, integer)',
    -- kredi, beğeni, profil
    'public.ai_usage_today()', 'public.consume_ai_call(text, integer, text)', 'public.my_referral_stats()',
    'public.mark_pro_interest()', 'public.set_username(text)', 'public.toggle_shared_like(text)',
    'public.shared_links_liked_by_me(text[])'
  ] loop
    if to_regprocedure(f) is not null then
      execute format('revoke execute on function %s from public, anon', f);
      execute format('grant execute on function %s to authenticated', f);
    end if;
  end loop;

  -- Tetikleyici fonksiyonu: doğrudan RPC ile çağrılamaz zaten; kayıt tetikleyicisi yetkiden etkilenmez.
  if to_regprocedure('public.handle_new_user()') is not null then
    revoke execute on function public.handle_new_user() from public, anon, authenticated;
  end if;
end $$;

-- 3) search_path sabitleme (Supabase lint 0011) --------------------------------------------------------------
alter function public.touch_updated_at() set search_path = public;
alter function public._slugify(text) set search_path = public;

-- Kontrol (tek satır, hepsi true olmalı):
-- select (select role = 'admin' from public.profiles where lower(email) = 'mehmetkuru.dev@gmail.com') as owner_admin,
--        not has_function_privilege('anon', 'public.create_team(text)', 'execute') as anon_blocked,
--        has_function_privilege('authenticated', 'public.create_team(text)', 'execute') as auth_ok,
--        has_function_privilege('anon', 'public.team_invite_preview(text)', 'execute') as preview_public;
