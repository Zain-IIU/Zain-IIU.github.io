import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Email + password sign-in. Create your user once in the Supabase dashboard
 * (Authentication -> Users -> Add user) — there is deliberately no sign-up
 * form here, because exactly one person should ever get in.
 */
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'That email and password do not match an account.'
          : signInError.message,
      )
      setBusy(false)
    }
    // On success the auth listener in AdminApp swaps this screen out.
  }

  return (
    <div className="wrap">
      <div className="login">
        <p className="eyebrow">Restricted</p>
        <h2>Sign in</h2>
        <p>This panel edits the live site. Only the owner account can get past here.</p>

        <form onSubmit={onSubmit}>
          <div className="f">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="f">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btnp" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {error && <p className="msg bad">{error}</p>}
      </div>
    </div>
  )
}
