-- ============================================================================
--  Migration 004 — non-destructive framing for the hero portrait
--  Run in the Supabase SQL editor. Safe to re-run.
--  If the "potential issues" dialog appears, choose "Run without RLS" —
--  this only adds columns; RLS is already enabled on the table.
--
--  The uploaded file is never re-cut. Zoom and focal point are stored as
--  numbers and applied in CSS, so the framing stays editable forever and a
--  bad crop is one slider away from being undone.
-- ============================================================================

alter table public.profile
  add column if not exists photo_zoom numeric not null default 1,
  add column if not exists photo_x    numeric not null default 50,
  add column if not exists photo_y    numeric not null default 50;

comment on column public.profile.photo_zoom is 'Scale applied to the hero portrait. 1 = fit, 3 = max zoom.';
comment on column public.profile.photo_x is 'Horizontal focal point as a percentage, 0 = left edge, 100 = right edge.';
comment on column public.profile.photo_y is 'Vertical focal point as a percentage, 0 = top edge, 100 = bottom edge.';
