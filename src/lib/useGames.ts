import { useCallback, useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabase'
import type { Game } from './types'

type State = {
  games: Game[]
  loading: boolean
  error: string | null
}

/**
 * Public shelf data: published games only, in sort order.
 * RLS does the filtering too, but asking for it explicitly keeps the intent
 * visible and means the admin and the site share one query shape.
 */
export function usePublishedGames(): State {
  const [state, setState] = useState<State>({ games: [], loading: true, error: null })

  useEffect(() => {
    if (!isConfigured) {
      setState({ games: [], loading: false, error: 'not-configured' })
      return
    }

    let cancelled = false

    supabase
      .from('games')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setState({ games: [], loading: false, error: error.message })
        else setState({ games: (data ?? []) as Game[], loading: false, error: null })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}

/** Every game including drafts — the admin table. */
export function useAllGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) setError(error.message)
    else {
      setGames((data ?? []) as Game[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { games, loading, error, refresh, setGames }
}
