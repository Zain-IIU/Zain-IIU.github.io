-- ============================================================================
--  Migration 003 — optional company link on each track-record row
--  Run in the Supabase SQL editor. Safe to re-run.
--  If the "potential issues" dialog appears, choose "Run without RLS" —
--  this only adds a column; RLS is already enabled on the table.
-- ============================================================================

alter table public.experience
  add column if not exists where_url text;

comment on column public.experience.where_url is
  'Optional company website or LinkedIn page. Null means the company name renders as plain text.';
