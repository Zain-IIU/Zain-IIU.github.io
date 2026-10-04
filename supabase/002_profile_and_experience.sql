-- ============================================================================
--  Migration 002 — editable profile and track record
--  Run after schema.sql. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profile — exactly one row, id 'main'
--    The check constraint is what keeps it a single row: there is only ever
--    one person on this site, so a second row would be a bug, not a feature.
-- ---------------------------------------------------------------------------
create table if not exists public.profile (
  id            text primary key default 'main',

  name          text not null default 'Zain Ul Abideen',
  role          text,
  location      text,
  engine        text,

  -- Text between *asterisks* renders in the muted colour, so the headline
  -- keeps its emphasis while staying a single editable string.
  headline      text,
  intro         text,

  email         text,
  github_url    text,
  linkedin_url  text,

  photo_url     text,
  cv_url        text,

  updated_at    timestamptz not null default now(),

  constraint profile_single_row check (id = 'main')
);

-- ---------------------------------------------------------------------------
-- 2. Experience — the track record, one row per job
-- ---------------------------------------------------------------------------
create table if not exists public.experience (
  id            uuid primary key default gen_random_uuid(),
  when_label    text not null,
  title         text not null,
  where_label   text,
  note          text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists experience_order_idx on public.experience (sort_order);

drop trigger if exists profile_touch_updated_at on public.profile;
create trigger profile_touch_updated_at
  before update on public.profile
  for each row execute function public.touch_updated_at();

drop trigger if exists experience_touch_updated_at on public.experience;
create trigger experience_touch_updated_at
  before update on public.experience
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 3. Row Level Security — world-readable, owner-writable.
--    Reuses public.is_owner() from schema.sql, so the owner email is still
--    defined in exactly one place.
-- ---------------------------------------------------------------------------
alter table public.profile enable row level security;
alter table public.experience enable row level security;

drop policy if exists "profile is public" on public.profile;
create policy "profile is public" on public.profile for select using (true);

drop policy if exists "owner writes profile" on public.profile;
create policy "owner writes profile" on public.profile
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "experience is public" on public.experience;
create policy "experience is public" on public.experience for select using (true);

drop policy if exists "owner writes experience" on public.experience;
create policy "owner writes experience" on public.experience
  for all using (public.is_owner()) with check (public.is_owner());


-- ---------------------------------------------------------------------------
-- 4. Seed from what the site already shows, so nothing goes blank mid-deploy.
-- ---------------------------------------------------------------------------
insert into public.profile (id, name, role, location, engine, headline, intro, email, github_url, linkedin_url)
values (
  'main',
  'Zain Ul Abideen',
  'Gameplay Programmer',
  'Islamabad, PK',
  'Unity',
  'I build the *feel* of mobile games.',
  'Five years of shipping hyper-casual and casual titles - player controllers, NPC behaviour trees, merge and idle economies - then profiling them until they hold a stable frame on a four-year-old Android. Everything below is running footage from a build I worked on.',
  'xainulabideen600@gmail.com',
  'https://github.com/Zain-IIU',
  ''
)
on conflict (id) do nothing;

insert into public.experience (when_label, title, where_label, note, sort_order)
select * from (values
  ('Nov 2023 -> now',        'Software Engineer',           'Game District, Lahore',             'Full product lifecycle work: complex mechanics and AI behaviour, deep profiling for memory and frame stability, ad & analytics SDKs, Firebase A/B tests balanced against KPIs.', 10),
  ('Aug 2022 -> Oct 2023',   'Game Developer',              'SnackGamer, Remote',                'Player controllers written from scratch, third-party API and plugin integration, NPC behaviour trees, and design work on a full title.', 20),
  ('May 2022 -> Aug 2022',   'Game Developer',              'Metal Games - contract for Voodoo', 'Rapid ideation against Voodoo''s publishing bar; branched out of hyper-casual into io, puzzle and simulation loops.', 30),
  ('Oct 2021 -> May 2022',   'Associate Game Developer',    'M.A.S Games - work for Rollic',     'A new prototype most weeks, each with a distinct core mechanic, tested for marketability before any polish went in.', 40),
  ('Jul 2021 -> Aug 2021',   'Game Programmer Fellow',      'Mindstorm Studios, Remote',         'Third place, Rookie Game Jam 2021. First exposure to how hyper-casual titles actually get marketed and published.', 50)
) as seed(when_label, title, where_label, note, sort_order)
where not exists (select 1 from public.experience);
