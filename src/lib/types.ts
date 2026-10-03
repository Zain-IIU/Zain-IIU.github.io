export type GameStatus = 'live' | 'prototype'

/** One row of the `games` table. Mirrors supabase/schema.sql exactly. */
export interface Game {
  id: string
  slug: string

  title: string
  genre: string | null
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

/** "Peak Climber" -> "peak-climber" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
