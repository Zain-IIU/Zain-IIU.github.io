export type GameStatus = 'live' | 'prototype'

/**
 * One row of the `categories` table — the shelf's filter chips.
 *
 * These are a managed list rather than free text on the game: a typo in a
 * text field would quietly invent a new category, and a hard-coded chip can
 * sit on the page matching nothing. A row means the chip exists because you
 * made it, and games point at it by id.
 */
export interface Category {
  id: string
  label: string
  slug: string
  sort_order: number
  created_at: string
  updated_at: string
}

/** One row of the `games` table. Mirrors supabase/schema.sql exactly. */
export interface Game {
  id: string
  slug: string

  title: string
  genre: string | null
  /** The shelf category. Null means the game shows only under "All work". */
  category_id: string | null
  studio: string | null
  year: number | null
  my_role: string | null
  blurb: string | null

  video_url: string | null
  poster_url: string | null

  ios_url: string | null
  android_url: string | null

  status: GameStatus
  published: boolean
  featured: boolean
  sort_order: number

  created_at: string
  updated_at: string
}

/** The shape the editor form writes back. Everything is optional: we PATCH. */
export type GameDraft = Partial<Omit<Game, 'id' | 'created_at' | 'updated_at'>>

export function emptyGame(sortOrder: number): GameDraft {
  return {
    slug: '',
    title: '',
    genre: '',
    category_id: null,
    studio: '',
    year: new Date().getFullYear(),
    my_role: '',
    blurb: '',
    video_url: null,
    poster_url: null,
    ios_url: null,
    android_url: null,
    status: 'live',
    published: false,
    featured: false,
    sort_order: sortOrder,
  }
}

/** The single `profile` row. Mirrors supabase/002_profile_and_experience.sql. */
export interface Profile {
  id: string
  name: string
  role: string | null
  location: string | null
  engine: string | null
  /** Text between *asterisks* renders muted. */
  headline: string | null
  intro: string | null
  email: string | null
  github_url: string | null
  linkedin_url: string | null
  photo_url: string | null
  /** Hero portrait framing. Applied in CSS; the uploaded file is never re-cut. */
  photo_zoom: number
  photo_x: number
  photo_y: number
  cv_url: string | null
  updated_at: string
}

/** One role in the track record. */
export interface ExperienceRow {
  id: string
  when_label: string
  title: string
  where_label: string | null
  /** Optional company site or LinkedIn page. Null renders the name as plain text. */
  where_url: string | null
  note: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

/** "Peak Climber" -> "peak-climber" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
