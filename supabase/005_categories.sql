-- ============================================================================
--  Migration 005 — real categories for the shelf
--  Run in the Supabase SQL editor. Safe to re-run.
--  If the "potential issues" dialog appears, choose "Run without RLS" —
--  the policies below are explicit.
--
--  Why a table and not a text field: a free-text genre lets a typo invent a
--  new category, and the old shelf hard-coded its filter chips, so a chip
--  could sit there matching nothing. A row per category means the chips are
--  whatever you decided they are, and a game points at one of them by id.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. The category list
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  slug          text unique not null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists categories_order_idx on public.categories (sort_order);

drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at
  before update on public.categories
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Point games at one
--    on delete set null: removing a category must never remove a game. The
--    game simply stops being filterable and still shows under "All work".
-- ---------------------------------------------------------------------------
alter table public.games
  add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists games_category_idx on public.games (category_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--    Readable by anyone (the chips are public), writable only by you.
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "categories are publicly readable" on public.categories;
create policy "categories are publicly readable"
  on public.categories for select
  using (true);

drop policy if exists "owner writes categories" on public.categories;
create policy "owner writes categories"
  on public.categories for all
  using (public.is_owner()) with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- 4. A starting set, taken from the genres already on your games.
--    Rename, reorder or delete any of these in /admin → Categories.
-- ---------------------------------------------------------------------------
insert into public.categories (label, slug, sort_order) values
  ('Runner',       'runner',     10),
  ('Idle & Merge', 'idle-merge', 20),
  ('Puzzle',       'puzzle',     30),
  ('Simulation',   'simulation', 40),
  ('Arcade',       'arcade',     50)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Best-effort first pass over the existing rows, so the shelf is not all
--    "uncategorised" on the first load. Only fills blanks — re-running this
--    will never overwrite a choice you made in the admin.
-- ---------------------------------------------------------------------------
update public.games g
   set category_id = c.id
  from public.categories c
 where g.category_id is null
   and c.slug = case
         when g.genre ilike '%runner%'                              then 'runner'
         when g.genre ilike '%merge%' or g.genre ilike '%idle%'     then 'idle-merge'
         when g.genre ilike '%puzzle%'                              then 'puzzle'
         when g.genre ilike '%simulation%' or g.genre ilike '%sim%' then 'simulation'
         when g.genre ilike '%arcade%' or g.genre ilike '%shooter%'
           or g.genre ilike '%physics%' or g.genre ilike '%draw%'   then 'arcade'
       end;
