import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** The one email allowed into /admin. Also enforced server-side by RLS. */
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? '').toLowerCase()

/**
 * True when the two env vars are present. The site renders a clear setup
 * message instead of a blank page when they are missing — which is what you
 * get on a fresh clone before .env exists.
 */
export const isConfigured = Boolean(url && anonKey)

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // The admin lives behind a hash route, so there is no OAuth redirect to parse.
      detectSessionInUrl: false,
    },
  },
)

export const MEDIA_BUCKET = 'media'

/** Public URL for a path inside the media bucket. */
export function mediaUrl(path: string): string {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
}
