import { useCallback, useEffect, useState } from 'react'
import { supabase, isConfigured } from './supabase'
import type { Category } from './types'

/**
 * The managed category list, shared by the public shelf and the admin.
 *
 * Categories are readable by anyone — the chips are part of the page — so
 * this one hook serves both sides and `refresh` is what the editor calls
 * after a write.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    const { data, error: queryError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (queryError) setError(queryError.message)
    else {
      setCategories((data ?? []) as Category[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { categories, loading, error, refresh }
}
