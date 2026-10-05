import { useMemo, useState } from 'react'
import PhoneFrame from './PhoneFrame'
import StoreBadges from './StoreBadges'
import type { Game } from '../lib/types'

const FILTERS = [
  { key: 'all', label: 'All work' },
  { key: 'live', label: 'Released' },
  { key: 'proto', label: 'Prototypes' },
  { key: 'runner', label: 'Runners' },
  { key: 'idle', label: 'Idle & merge' },
  { key: 'puzzle', label: 'Puzzle' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

function matches(game: Game, filter: FilterKey): boolean {
  if (filter === 'all') return true
  if (filter === 'live') return game.status === 'live'
  if (filter === 'proto') return game.status === 'prototype'
  return (game.genre ?? '').toLowerCase().includes(filter)
}

function GameCard({ game }: { game: Game }) {
  return (
    <article className="game">
      <div className="game__top">
        <span className="game__yr">{game.year ?? '—'}</span>
        <span className="game__gen">{game.genre}</span>
      </div>
      <PhoneFrame video={game.video_url} poster={game.poster_url} alt={`${game.title} gameplay`} />
      <h3 className="game__name">{game.title}</h3>
      <StoreBadges game={game} />
    </article>
  )
}

export default function Shelf({ games, loading }: { games: Game[]; loading: boolean }) {
  const [filter, setFilter] = useState<FilterKey>('all')

  const featured = useMemo(() => games.find((g) => g.featured) ?? null, [games])

  const rest = useMemo(() => {
    // The featured game has its own block, so it only rejoins the grid once a
    // filter is on and that block is hidden.
    const pool = filter === 'all' ? games.filter((g) => !g.featured) : games
    return pool.filter((g) => matches(g, filter))
  }, [games, filter])

  const showFeatured = !loading && featured && filter === 'all'

  return (
    <section className="wrap" id="work">
      <div className="shead">
        <div>
          <p className="eyebrow">Selected work</p>
          <h2>The Shelf</h2>
        </div>
        <p>
          Every device is a capture from the shipped build, running at the size it was designed for.
          No trailers, no mockup screenshots.
        </p>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className="chip"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="game" key={i}>
              <div className="skeleton skeleton--phone" />
            </div>
          ))}
        </div>
      )}

      {showFeatured && featured && (
        <div className="featured">
          <PhoneFrame
            video={featured.video_url}
            poster={featured.poster_url}
            alt={`${featured.title} gameplay`}
          />
          <div>
            <p className="eyebrow">Featured{featured.year ? ` · ${featured.year}` : ''}</p>
            <h3>{featured.title}</h3>
            {featured.blurb && <p className="lede">{featured.blurb}</p>}
            <div className="metaline">
              {featured.genre && <span>{featured.genre}</span>}
              {featured.studio && <span>{featured.studio}</span>}
              {featured.my_role && <span>{featured.my_role}</span>}
            </div>
            <StoreBadges game={featured} />
          </div>
        </div>
      )}

      {!loading && (
        <div className="grid">
          {rest.length === 0 && <p className="empty">Nothing in this category yet.</p>}
          {rest.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </section>
  )
}
