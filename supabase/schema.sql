-- ============================================================================
--  Zain Ul Abideen — portfolio schema
--  Run this once in the Supabase dashboard: SQL Editor -> New query -> Run.
--  Change OWNER_EMAIL below to your email before running.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Games
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,

  title         text not null,
  genre         text,
  studio        text,
  year          int,
  my_role       text,
  blurb         text,

  video_url     text,
  poster_url    text,

  ios_url       text,
  android_url   text,

  status        text not null default 'live',
  published     boolean not null default false,
  featured      boolean not null default false,
  sort_order    int not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint games_status_check check (status in ('live', 'prototype'))
);

create index if not exists games_public_idx on public.games (published, sort_order);

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists games_touch_updated_at on public.games;
create trigger games_touch_updated_at
  before update on public.games
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 2. Who is allowed to write
--    One helper so every policy below shares a single definition of "the owner".
-- ---------------------------------------------------------------------------
create or replace function public.is_owner()
returns boolean language sql stable as $$
  -- >>> CHANGE THIS to your email <<<
  select coalesce(auth.jwt() ->> 'email', '') = 'xainulabideen600@gmail.com';
$$;


-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--    Without this, your public anon key would let anyone edit the table.
-- ---------------------------------------------------------------------------
alter table public.games enable row level security;

drop policy if exists "games are publicly readable when published" on public.games;
create policy "games are publicly readable when published"
  on public.games for select
  using (published = true);

drop policy if exists "owner reads everything" on public.games;
create policy "owner reads everything"
  on public.games for select
  using (public.is_owner());

drop policy if exists "owner inserts" on public.games;
create policy "owner inserts"
  on public.games for insert
  with check (public.is_owner());

drop policy if exists "owner updates" on public.games;
create policy "owner updates"
  on public.games for update
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner deletes" on public.games;
create policy "owner deletes"
  on public.games for delete
  using (public.is_owner());


-- ---------------------------------------------------------------------------
-- 4. Storage bucket for captures + posters
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)   -- 50 MB, the free-plan ceiling
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "media is publicly readable" on storage.objects;
create policy "media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "owner uploads media" on storage.objects;
create policy "owner uploads media"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_owner());

drop policy if exists "owner replaces media" on storage.objects;
create policy "owner replaces media"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_owner());

drop policy if exists "owner deletes media" on storage.objects;
create policy "owner deletes media"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_owner());


-- ---------------------------------------------------------------------------
-- 5. Seed rows so the shelf is not empty on first run.
--    video_url / poster_url are left null — upload the captures in /admin and
--    the rows fill in. A game with no video still renders, with its poster
--    (or an empty screen) in the frame.
-- ---------------------------------------------------------------------------
insert into public.games (slug, title, genre, studio, year, my_role, blurb, status, published, featured, sort_order)
values
  ('peak-climber',      'Peak Climber',       'Idle / Climber',   'Game District',   2024, 'Gameplay + AI', 'An idle climb where the hook is upgrade pacing. I owned the climber controller, the stamina curve and the offline-earnings pass.', 'live',      true, true,  10),
  ('rail-rush',         'Rail Rush',          'Runner',           'Game District',   2024, 'Gameplay',      null, 'live',      true, false, 20),
  ('prison-frenzy',     'Prison Frenzy',      'Merge / Idle',     'Game District',   2024, 'Systems + AI',  null, 'live',      true, false, 30),
  ('color-tiles',       'Color Tiles',        'Puzzle',           'SnackGamer',      2023, 'Gameplay',      null, 'live',      true, false, 40),
  ('venture-bnb',       'Venture BnB',        'Simulation',       'SnackGamer',      2023, 'Full build',    null, 'live',      true, false, 50),
  ('assembly-laundry',  'Assembly Laundry',   'Idle / Arcade',    'SnackGamer',      2023, 'Gameplay',      null, 'live',      true, false, 60),
  ('knit-it-asmr',      'Knit It ASMR',       'ASMR / Idle',      'Game District',   2024, 'Gameplay',      null, 'live',      true, false, 70),
  ('stroller-race',     'Baby Stroller Race', 'Runner',           'M.A.S Games',     2022, 'Gameplay',      null, 'live',      true, false, 80),
  ('save-the-girl',     'Save The Girl',      'Puzzle / Choice',  'M.A.S Games',     2022, 'Prototype',     null, 'prototype', true, false, 90),
  ('draw-magic',        'Draw Magic',         'Draw / Physics',   'Metal Games',     2022, 'Prototype',     null, 'prototype', true, false, 100),
  ('hostage-rescue',    'Hostage Rescue',     'Shooter / Arcade', 'Metal Games',     2022, 'AI behaviour',  null, 'prototype', true, false, 110),
  ('angel-surfer',      'Angel Surfer',       'Runner',           'Voodoo contract', 2022, 'Prototype',     null, 'prototype', true, false, 120)
on conflict (slug) do nothing;
