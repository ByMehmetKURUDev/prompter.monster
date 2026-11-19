-- Prompt.Monster — 0023 karşılama / hatırlatma e-postaları davranış testi (geri alınan DO bloğu: hiçbir şey kalıcı değil).
-- Nasıl: Supabase SQL Editor → yeni sorgu → bu dosyanın tamamı → Run. Sonuç kırmızı "ERROR: P0001: TEST_RESULTS" altında.
-- Kullanıcılar dinamik seçilir: projesi olmayan, e-postası doğrulanmış, admin olmayan bir profil (+ varsa projesi olan biri ve bir admin).
-- Test geçici olarak created_at / banned_at / e-posta kayıtlarını değiştirir; sondaki RAISE hepsini geri alır.
--
-- Beklenen:
--   01 privileges: anon_claim=f auth_claim=f auth_finish=f auth_unsub=f auth_due=f auth_token=f auth_prefs=t auth_set=t anon_prefs=f auth_admin=t
--   02 welcome claim: claimed=t locale=en token=t attempt=1
--   03 duplicate claim while pending: 0
--   04 after sent: status=sent reclaim=0 nudge_now=0
--   05 nudge due: no_project=1
--      with_project=0            (ya da "skip": projesi olan kullanıcı yoksa)
--   06 failed: status=failed immediate_retry=0
--      retry after 1h: attempt=2
--      after 3 attempts: attempts=3 reclaim=0
--   07 stale pending reclaimed: attempt=2
--   08 unsubscribe: found=t opted_out=t welcome_due=0
--      resubscribe: found=t welcome_due=1 unknown_token=f
--   09 old_account=0
--      unconfirmed=0             (ya da "skip": auth.users'a yazma izni yoksa)
--      banned=0
--   10 my_email_prefs: opt_out=false locale=en sent=0
--      after set(true, tr): opt_out=true locale=tr
--      after set(false, null): opt_out=false locale=tr
--      bad locale -> bad_locale
--   11 non-admin: overview=0 recent=0 due=0
--      admin: due_rows=2 overview_has_optout=t   (admin profili yoksa bu satır olmaz)
--   12 bad kind -> bad_kind
--   13 email_token_for stable: t
do $test$
declare
  a uuid; b uuid; adm uuid;
  r text[] := '{}';
  n int; v_tok uuid; v_log bigint; v_loc text; v_att int; j jsonb; ok boolean;
begin
  select p.id into a
    from public.profiles p join auth.users u on u.id = p.id
   where p.banned_at is null and u.email_confirmed_at is not null and u.deleted_at is null
     and p.role is distinct from 'admin'
     and not exists (select 1 from public.projects x where x.owner_id = p.id)
   order by p.created_at limit 1;
  if a is null then raise exception 'TEST_SETUP: projesi olmayan, e-postası doğrulanmış, admin olmayan bir profil gerekli'; end if;
  select p.id into b from public.profiles p where p.id <> a and exists (select 1 from public.projects x where x.owner_id = p.id) order by p.created_at limit 1;
  select p.id into adm from public.profiles p where p.role = 'admin' order by p.created_at limit 1;

  -- temiz başlangıç: bir saat önce açılmış hesap gibi
  delete from public.email_log where user_id = a;
  delete from public.email_prefs where user_id = a;
  update public.profiles set created_at = now() - interval '1 hour' where id = a;

  r := array_append(r, format('01 privileges: anon_claim=%s auth_claim=%s auth_finish=%s auth_unsub=%s auth_due=%s auth_token=%s auth_prefs=%s auth_set=%s anon_prefs=%s auth_admin=%s',
    has_function_privilege('anon', 'public.email_claim(text, integer, uuid, text)', 'execute'),
    has_function_privilege('authenticated', 'public.email_claim(text, integer, uuid, text)', 'execute'),
    has_function_privilege('authenticated', 'public.email_finish(bigint, boolean, text, text)', 'execute'),
    has_function_privilege('authenticated', 'public.email_unsubscribe(uuid, boolean)', 'execute'),
    has_function_privilege('authenticated', 'public._email_due(text, uuid, integer)', 'execute'),
    has_function_privilege('authenticated', 'public.email_token_for(uuid)', 'execute'),
    has_function_privilege('authenticated', 'public.my_email_prefs()', 'execute'),
    has_function_privilege('authenticated', 'public.set_my_email_prefs(boolean, text)', 'execute'),
    has_function_privilege('anon', 'public.my_email_prefs()', 'execute'),
    has_function_privilege('authenticated', 'public.admin_email_overview(integer)', 'execute')));

  -- 02 karşılama sırada → talep (giriş sayfası dili: en)
  select c.log_id, c.locale, c.token, c.attempt into v_log, v_loc, v_tok, v_att from public.email_claim('welcome', 10, a, 'en') c;
  r := array_append(r, format('02 welcome claim: claimed=%s locale=%s token=%s attempt=%s', v_log is not null, v_loc, v_tok is not null, v_att));

  -- 03 gönderim sürerken ikinci talep → boş
  select count(*) into n from public.email_claim('welcome', 10, a);
  r := array_append(r, format('03 duplicate claim while pending: %s', n));

  -- 04 gönderildi → tekrar talep yok; hatırlatma henüz değil (hesap yeni, karşılama az önce)
  perform public.email_finish(v_log, true, 're_test', null);
  select count(*) into n from public.email_claim('welcome', 10, a);
  r := array_append(r, format('04 after sent: status=%s reclaim=%s nudge_now=%s',
      (select l.status from public.email_log l where l.id = v_log), n, (select count(*) from public._email_due('nudge', a, 10))));

  -- 05 hatırlatma: 2 günlük hesap, karşılama 21 saat önce, proje yok → sırada; projesi olan → değil
  update public.profiles set created_at = now() - interval '2 days' where id = a;
  update public.email_log set updated_at = now() - interval '21 hours' where id = v_log;
  r := array_append(r, format('05 nudge due: no_project=%s', (select count(*) from public._email_due('nudge', a, 10))));
  if b is null then
    r := array_append(r, '   with_project=skip (projesi olan kullanıcı yok)');
  else
    update public.profiles set created_at = now() - interval '2 days', banned_at = null where id = b;
    delete from public.email_log where user_id = b;
    insert into public.email_log (user_id, kind, status, updated_at) values (b, 'welcome', 'sent', now() - interval '21 hours');
    r := array_append(r, format('   with_project=%s', (select count(*) from public._email_due('nudge', b, 10))));
  end if;

  -- 06 başarısız gönderim → 1 saat sonra yeniden, en fazla 3 deneme
  select c.log_id into v_log from public.email_claim('nudge', 10, a) c;
  perform public.email_finish(v_log, false, null, 'HTTP 500 test');
  select count(*) into n from public.email_claim('nudge', 10, a);
  r := array_append(r, format('06 failed: status=%s immediate_retry=%s', (select l.status from public.email_log l where l.id = v_log), n));
  update public.email_log set updated_at = now() - interval '2 hours' where id = v_log;
  select c.attempt into v_att from public.email_claim('nudge', 10, a) c;
  r := array_append(r, format('   retry after 1h: attempt=%s', v_att));
  perform public.email_finish(v_log, false, null, 'x');
  update public.email_log set updated_at = now() - interval '2 hours' where id = v_log;
  perform * from public.email_claim('nudge', 10, a);
  perform public.email_finish(v_log, false, null, 'x');
  update public.email_log set updated_at = now() - interval '2 hours' where id = v_log;
  select count(*) into n from public.email_claim('nudge', 10, a);
  r := array_append(r, format('   after 3 attempts: attempts=%s reclaim=%s', (select l.attempts from public.email_log l where l.id = v_log), n));

  -- 07 yarıda kalan gönderim ('pending', 30 dk'dan eski) → yeniden talep edilir
  delete from public.email_log where user_id = a and kind = 'nudge';
  select c.log_id into v_log from public.email_claim('nudge', 10, a) c;
  update public.email_log set updated_at = now() - interval '31 minutes' where id = v_log;
  select c.attempt into v_att from public.email_claim('nudge', 10, a) c;
  r := array_append(r, format('07 stale pending reclaimed: attempt=%s', v_att));

  -- 08 bağlantıyla çıkış → hiçbir şey sırada değil; geri alma; bilinmeyen anahtar
  delete from public.email_log where user_id = a;
  update public.profiles set created_at = now() - interval '1 hour' where id = a;
  ok := public.email_unsubscribe(v_tok, true);
  r := array_append(r, format('08 unsubscribe: found=%s opted_out=%s welcome_due=%s', ok,
      (select ep.opt_out_at is not null from public.email_prefs ep where ep.user_id = a), (select count(*) from public._email_due('welcome', a, 10))));
  ok := public.email_unsubscribe(v_tok, false);
  r := array_append(r, format('   resubscribe: found=%s welcome_due=%s unknown_token=%s', ok,
      (select count(*) from public._email_due('welcome', a, 10)), public.email_unsubscribe(gen_random_uuid(), true)));

  -- 09 uygunluk: eski hesap / doğrulanmamış e-posta / yasaklı → sırada değil
  update public.profiles set created_at = now() - interval '10 days' where id = a;
  r := array_append(r, format('09 old_account=%s', (select count(*) from public._email_due('welcome', a, 10))));
  update public.profiles set created_at = now() - interval '1 hour' where id = a;
  begin
    update auth.users set email_confirmed_at = null where id = a;
    r := array_append(r, format('   unconfirmed=%s', (select count(*) from public._email_due('welcome', a, 10))));
    raise exception 'undo_unconfirmed';
  exception
    when insufficient_privilege then r := array_append(r, '   unconfirmed=skip (auth.users yazma izni yok)');
    when others then if sqlerrm <> 'undo_unconfirmed' then r := array_append(r, '   unconfirmed=error ' || sqlerrm); end if;
  end;
  update public.profiles set banned_at = now() where id = a;
  r := array_append(r, format('   banned=%s', (select count(*) from public._email_due('welcome', a, 10))));
  update public.profiles set banned_at = null where id = a;

  -- 10 Hesabım → E-posta tercihleri (kullanıcı olarak)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  j := public.my_email_prefs();
  r := array_append(r, format('10 my_email_prefs: opt_out=%s locale=%s sent=%s', j ->> 'opt_out', j ->> 'locale', jsonb_array_length(j -> 'sent')));
  perform public.set_my_email_prefs(true, 'tr');
  j := public.my_email_prefs();
  r := array_append(r, format('   after set(true, tr): opt_out=%s locale=%s', j ->> 'opt_out', j ->> 'locale'));
  perform public.set_my_email_prefs(false, null);
  j := public.my_email_prefs();
  r := array_append(r, format('   after set(false, null): opt_out=%s locale=%s', j ->> 'opt_out', j ->> 'locale'));
  begin
    perform public.set_my_email_prefs(false, 'de');
    r := array_append(r, 'FAIL bad locale accepted');
  exception when others then r := array_append(r, '   bad locale -> ' || sqlerrm);
  end;

  -- 11 admin fonksiyonları: admin olmayana boş
  r := array_append(r, format('11 non-admin: overview=%s recent=%s due=%s',
      (select count(*) from public.admin_email_overview(30)), (select count(*) from public.admin_email_recent(50)), (select count(*) from public.admin_email_due())));
  if adm is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    r := array_append(r, format('   admin: due_rows=%s overview_has_optout=%s', (select count(*) from public.admin_email_due()),
        exists (select 1 from public.admin_email_overview(30) o where o.kind = 'optout')));
  end if;

  -- 12 bilinmeyen tür
  begin
    perform * from public.email_claim('promo', 10, null);
    r := array_append(r, 'FAIL 12 bad kind accepted');
  exception when others then r := array_append(r, '12 bad kind -> ' || sqlerrm);
  end;

  -- 13 test e-postası anahtarı aynı kalır
  r := array_append(r, format('13 email_token_for stable: %s', public.email_token_for(a) = v_tok));

  raise exception 'TEST_RESULTS%', E'\n' || array_to_string(r, E'\n');
end $test$;
