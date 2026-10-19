-- Aniko's Hub: tables for the optional account sync.
-- Run once in Supabase -> SQL Editor. Safe to run again.
--
-- Each user can only ever read and change their own rows (Row Level Security).
-- user_id fills itself in from the signed-in user, so the app never sends it.

create table if not exists public.favorites (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_key  text not null,                 -- e.g. "movie:603" or "tv:1399"
  media      jsonb not null,                -- title, poster, backdrop, overview, type, rating, year
  created_at timestamptz not null default now(),
  primary key (user_id, media_key)
);

create table if not exists public.watch_history (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_key   text not null,
  media       jsonb not null,
  season      int,
  episode     int,
  provider_id text,
  watched_at  bigint not null,              -- epoch milliseconds, same as the app
  primary key (user_id, media_key)
);

alter table public.favorites enable row level security;
alter table public.watch_history enable row level security;

drop policy if exists "own favorites" on public.favorites;
create policy "own favorites" on public.favorites
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own watch history" on public.watch_history;
create policy "own watch history" on public.watch_history
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
