import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, ADMIN_EMAIL, isConfigured } from '../lib/supabase'
import { useAllGames } from '../lib/useGames'
import { slugify } from '../lib/types'
import type { Game } from '../lib/types'
import Login from './Login'
import GameEditor from './GameEditor'
import ProfileEditor from './ProfileEditor'
import ExperienceEditor from './ExperienceEditor'
import { useProfile } from '../lib/useProfile'
import '../styles/admin.css'

type Section = 'games' | 'profile' | 'experience'

function SetupNotice() {
  return (
    <div className="wrap">
      <div className="notice" style={{ marginBlock: 60 }}>
        <h3>Supabase is not configured yet</h3>
        <p>
          Copy <code>.env.example</code> to <code>.env</code> and fill in{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> from your Supabase
          project, then restart <code>npm run dev</code>. The full walkthrough is in{' '}
          <code>README.md</code>.
        </p>
      </div>
    </div>
  )
}

function GamesTable({
  games,
  selectedId,
  onSelect,
  onReorder,
  onTogglePublished,
}: {
  games: Game[]
  selectedId: string | null
  onSelect: (g: Game) => void
  onReorder: (index: number, direction: -1 | 1) => void
  onTogglePublished: (g: Game) => void
}) {
  return (
    <div className="rows">
      {games.map((g, i) => (
        <div className={`row${g.id === selectedId ? ' sel' : ''}`} key={g.id}>
          <div className="order">
            <button
              onClick={() => onReorder(i, -1)}
              disabled={i === 0}
              aria-label={`Move ${g.title} up`}
              title="Move up"
            >
              ▲
            </button>
            <button
              onClick={() => onReorder(i, 1)}
              disabled={i === games.length - 1}
              aria-label={`Move ${g.title} down`}
              title="Move down"
            >
              ▼
            </button>
          </div>

          {g.poster_url ? (
            <img className="thumb" src={g.poster_url} alt="" />
          ) : (
            <div className="thumb thumb--blank">▶</div>
          )}

          <button className="row__open" onClick={() => onSelect(g)}>
            <span className="row__t">
              {g.title}
              {g.featured ? ' ★' : ''}
            </span>
            <span className="row__s">
              {[g.genre, g.studio].filter(Boolean).join(' · ') || 'No details yet'}
            </span>
          </button>

          <span>
            <span className={`pill ${g.status === 'live' ? 'live' : 'draft'}`}>{g.status}</span>
          </span>

          <span className="linkcell">
            <span className={`tag${g.ios_url ? ' has' : ''}`}>iOS</span>
            <span className={`tag${g.android_url ? ' has' : ''}`}>Play</span>
            <span className={`tag${g.video_url ? ' has' : ''}`}>Video</span>
          </span>

          <button
            className={`sw${g.published ? ' on' : ''}`}
            onClick={() => onTogglePublished(g)}
            aria-label={`${g.published ? 'Hide' : 'Show'} ${g.title} on the site`}
            aria-pressed={g.published}
            title={g.published ? 'Visible on the site' : 'Hidden from the site'}
          />
        </div>
      ))}
    </div>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setChecking(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!isConfigured) return <SetupNotice />
  if (checking) return <div className="wrap" style={{ padding: '80px 0' }}>Checking session…</div>
  if (!session) return <Login />

  const email = (session.user.email ?? '').toLowerCase()
  if (ADMIN_EMAIL && email !== ADMIN_EMAIL) {
    return (
      <div className="wrap">
        <div className="notice notice--bad" style={{ marginBlock: 60 }}>
          <h3>Signed in as {email}</h3>
          <p>
            That account is not the owner of this site, so there is nothing here for it to edit.{' '}
            <button className="btng" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </p>
        </div>
      </div>
    )
  }

  return <Dashboard email={email} />
}

function Dashboard({ email }: { email: string }) {
  const { games, loading, error, refresh, setGames } = useAllGames()
  const prof = useProfile()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [section, setSection] = useState<Section>('games')

  const selected = useMemo(
    () => games.find((g) => g.id === selectedId) ?? null,
    [games, selectedId],
  )

  // Select the first row once data lands, so the editor is never empty on arrival.
  useEffect(() => {
    if (!selectedId && games.length > 0) setSelectedId(games[0].id)
  }, [games, selectedId])

  async function togglePublished(game: Game) {
    // Optimistic: flip locally, then persist. Reverting on error keeps the UI honest.
    setGames((gs) => gs.map((g) => (g.id === game.id ? { ...g, published: !g.published } : g)))
    const { error: saveError } = await supabase
      .from('games')
      .update({ published: !game.published })
      .eq('id', game.id)
    if (saveError) {
      setGames((gs) => gs.map((g) => (g.id === game.id ? { ...g, published: game.published } : g)))
      window.alert(`Could not change that: ${saveError.message}`)
    }
  }

  async function reorder(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= games.length) return

    const next = [...games]
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp

    // Renumber in tens so a later insert has room between neighbours.
    const renumbered = next.map((g, i) => ({ ...g, sort_order: (i + 1) * 10 }))
    setGames(renumbered)

    const { error: orderError } = await supabase.from('games').upsert(
      renumbered.map((g) => ({ id: g.id, slug: g.slug, title: g.title, sort_order: g.sort_order })),
      { onConflict: 'id' },
    )
    if (orderError) {
      window.alert(`Could not save the new order: ${orderError.message}`)
      void refresh()
    }
  }

  async function createGame() {
    setCreating(true)
    const title = window.prompt('Name of the new game?')?.trim()
    if (!title) {
      setCreating(false)
      return
    }

    const maxOrder = games.reduce((m, g) => Math.max(m, g.sort_order), 0)
    const { data, error: createError } = await supabase
      .from('games')
      .insert({
        title,
        slug: slugify(title) || `game-${Date.now()}`,
        status: 'live',
        published: false,
        featured: false,
        sort_order: maxOrder + 10,
      })
      .select()
      .single()

    setCreating(false)

    if (createError) {
      window.alert(`Could not create it: ${createError.message}`)
      return
    }
    await refresh()
    if (data) setSelectedId((data as Game).id)
  }

  const liveCount = games.filter((g) => g.published).length

  return (
    <div className="wrap">
      <section className="admin-intro">
        <p className="eyebrow">Behind the login</p>
        <h2>One screen to run the site</h2>
        <p>
          Reorder with the arrows, flip the switch to show or hide a game, drop in a new capture and
          the poster is generated for you. Your photo, CV and track record live here too. Changes
          are on the site as soon as they save.
        </p>
      </section>

      {error && (
        <div className="notice notice--bad">
          <h3>Could not load your games</h3>
          <p>{error}</p>
        </div>
      )}

      <div className="console">
        <aside className="side">
          <div className="who">
            <div className="av">{(email[0] ?? 'Z').toUpperCase()}</div>
            <div>
              Owner
              <small>{email}</small>
            </div>
          </div>
          <button
            className={`sidelink${section === 'games' ? ' on' : ''}`}
            onClick={() => setSection('games')}
          >
            <span className="dotk" />
            Games
          </button>
          <button
            className={`sidelink${section === 'profile' ? ' on' : ''}`}
            onClick={() => setSection('profile')}
          >
            <span className="dotk" />
            Profile &amp; CV
          </button>
          <button
            className={`sidelink${section === 'experience' ? ' on' : ''}`}
            onClick={() => setSection('experience')}
          >
            <span className="dotk" />
            Track record
          </button>
          <Link to="/">
            <span className="dotk" />
            View site
          </Link>
          <span className="sep" />
          <button className="sidelink" onClick={() => supabase.auth.signOut()}>
            <span className="dotk" />
            Sign out
          </button>
        </aside>

        <div className="pane" id="games">
          {section === 'games' && (
            <>
              <div className="pane__top">
                <h3>Games</h3>
                <span className="count">
                  {loading ? 'loading…' : `${games.length} games · ${liveCount} live`}
                </span>
                <button className="btnp btnp--push" onClick={createGame} disabled={creating}>
                  + New game
                </button>
              </div>

              <GamesTable
                games={games}
                selectedId={selectedId}
                onSelect={(g) => setSelectedId(g.id)}
                onReorder={reorder}
                onTogglePublished={togglePublished}
              />

              <GameEditor
                game={selected}
                onSaved={refresh}
                onDeleted={() => {
                  setSelectedId(null)
                  void refresh()
                }}
              />
            </>
          )}

          {section === 'profile' && (
            <>
              <div className="pane__top">
                <h3>Profile &amp; CV</h3>
                <span className="count">shown in the hero</span>
              </div>
              <ProfileEditor profile={prof.profile} onSaved={prof.refresh} />
            </>
          )}

          {section === 'experience' && (
            <ExperienceEditor rows={prof.experience} onChanged={prof.refresh} />
          )}
        </div>
      </div>
    </div>
  )
}
