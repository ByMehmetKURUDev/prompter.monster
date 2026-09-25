-- Prompt.Monster — Faz 2 veri modeli (Supabase / Postgres)
-- Henüz uygulamaya bağlı değil; Faz 2'de Supabase projesine uygulanacak.
-- Her tablo Row Level Security ile korunur: kullanıcı yalnız kendi satırlarını görür.

create extension if not exists "pgcrypto";

-- Kullanıcı profili: auth.users ile 1:1
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  display_name  text,
  plan          text not null default 'free' check (plan in ('free','pro')),
  ai_credits    integer not null default 3,        -- aylık kalan AI hakkı (free)
  credits_reset_at timestamptz not null default date_trunc('month', now()) + interval '1 month',
  created_at    timestamptz not null default now()
);

-- Studio'daki bir proje (StudioState JSON olarak saklanır)
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  project_type  text not null,
  state         jsonb not null,                    -- StudioState
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists projects_owner_idx on public.projects(owner_id, updated_at desc);

-- Her üretim (versiyon geçmişi)
create table if not exists public.generations (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  version       integer not null,
  format        text not null,
  lang          text not null check (lang in ('TR','EN')),
  experts       text[] not null,
  output        text not null,                     -- mega prompt
  refined       jsonb,                             -- {expertId: refinedPrompt}
  token_estimate integer,
  created_at    timestamptz not null default now(),
  unique (project_id, version)
);

-- Abonelikler (Stripe/Paddle/Iyzico webhook'ları günceller)
create table if not exists public.subscriptions (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  provider      text not null check (provider in ('stripe','paddle','iyzico')),
  provider_ref  text not null,                     -- customer / subscription id
  status        text not null,                     -- active, past_due, canceled...
  current_period_end timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (provider, provider_ref)
);

-- Herkese açık paylaşım linkleri (/p/[slug])
create table if not exists public.shared_links (
  slug          text primary key,
  generation_id uuid not null references public.generations(id) on delete cascade,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  views         integer not null default 0,
  created_at    timestamptz not null default now()
);

-- AI kullanım kaydı (kota + maliyet takibi)
create table if not exists public.ai_usage (
  id            bigint generated always as identity primary key,
  owner_id      uuid references public.profiles(id) on delete set null,
  ip_hash       text,
  endpoint      text not null,                     -- enhance | suggest | refine
  input_tokens  integer,
  output_tokens integer,
  created_at    timestamptz not null default now()
);
create index if not exists ai_usage_owner_day_idx on public.ai_usage(owner_id, created_at desc);

-- RLS
alter table public.profiles      enable row level security;
alter table public.projects      enable row level security;
alter table public.generations   enable row level security;
alter table public.subscriptions enable row level security;
alter table public.shared_links  enable row level security;
alter table public.ai_usage      enable row level security;

create policy "own profile"        on public.profiles      for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own projects"       on public.projects      for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own generations"    on public.generations   for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own subscriptions"  on public.subscriptions for select using (auth.uid() = owner_id);
create policy "own shared links"   on public.shared_links  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "public shared read" on public.shared_links  for select using (true);
create policy "own usage"          on public.ai_usage      for select using (auth.uid() = owner_id);

-- Yeni kullanıcı kaydolunca profil oluştur
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at otomatik
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute procedure public.touch_updated_at();
