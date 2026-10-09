import { useCallback, useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabase'
import type { Profile, ExperienceRow } from './types'
import { profile as fallback, experience as fallbackExperience } from '../data/profile'

export interface ProfileState {
  profile: Profile | null
  experience: ExperienceRow[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/** Shape the static defaults in data/profile.ts like a database row. */
function fallbackProfile(): Profile {
  return {
    id: 'main',
    name: fallback.name,
    role: fallback.role,
    location: fallback.location,
    engine: fallback.engine,
    headline: 'I build the *feel* of mobile games.',
    intro: fallback.intro,
    email: fallback.links.email.replace(/^mailto:/, ''),
    github_url: fallback.links.github,
    linkedin_url: null,
    photo_url: null,
    photo_zoom: 1,
    photo_x: 50,
    photo_y: 50,
    cv_url: null,
    updated_at: '',
  }
}

function fallbackRows(): ExperienceRow[] {
  return fallbackExperience.map((r, i) => ({
    id: `fallback-${i}`,
    when_label: r.when,
    title: r.title,
    where_label: r.where,
    where_url: null,
    note: r.note,
    sort_order: (i + 1) * 10,
    created_at: '',
    updated_at: '',
  }))
}

/**
 * Profile and track record, both from the database.
 *
 * If Supabase is unreachable or the rows are missing, this falls back to the
 * static copy in data/profile.ts rather than rendering an empty hero — the
 * page should never look broken because one query failed.
 */
export function useProfile(): ProfileState {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [experience, setExperience] = useState<ExperienceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isConfigured) {
      setProfile(fallbackProfile())
      setExperience(fallbackRows())
      setLoading(false)
      return
    }

    const [p, e] = await Promise.all([
      supabase.from('profile').select('*').eq('id', 'main').maybeSingle(),
      supabase.from('experience').select('*').order('sort_order', { ascending: true }),
    ])

    if (p.error) {
      setError(p.error.message)
      setProfile(fallbackProfile())
    } else {
      setProfile((p.data as Profile) ?? fallbackProfile())
    }

    if (e.error) {
      setExperience(fallbackRows())
    } else {
      const rows = (e.data ?? []) as ExperienceRow[]
      setExperience(rows.length ? rows : fallbackRows())
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { profile, experience, loading, error, refresh }
}
