import { useEffect, useMemo, useState } from 'react'
import PhoneFrame from './PhoneFrame'
import StoreBadges from './StoreBadges'
import type { Category, Game } from '../lib/types'

/**
 * A chip is one of three things, encoded in its key so the whole filter is a
 * single piece of state: everything, a status, or a category id.
 */
type Chip = { key: string; label: string }

const ALL: Chip = { key: 'all', label: 'All work' }
const STATUS_CHIPS: Chip[] = [
  { key: 'status:live', label: 'Released' },
  { key: 'status:prototype', label: 'Prototypes' },
]

function matches(game: Game, key: string): boolean {
  if (key === 'all') return true
  if (key.startsWith('status:')) return game.status === key.slice(7)
  if (key.startsWith('cat:')) return game.category_id === key.slice(4)
  return true
}

function GameCard({ game, categoryLabel }: { game: Game; categoryLabel: string | null }) {
  return (
    <article className="game">
      <div className="game__top">
        <span className="game__yr">{game.year ?? '—'}</span>
        {/* The category is the taxonomy the filters use, so it wins over the
            free-text genre line when one is set. */}
        <span className="game__gen">{categoryLabel ?? game.genre}</span>
      </div>
      <PhoneFrame video={game.video_url} poster={game.poster_url} alt={`${game.title} gameplay`} />
      <h3 className="game__name">{game.title}</h3>
      <StoreBadges game={game} />
    </article>
  )
}

export default function Shelf({
  games,
  categories,
  loading,
}: {
  games: Game[]
  categories: Category[]
  loading: boolean
}) {
  const [filter, setFilter] = useState<string>('all')

  const labelById = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.label))
    return map
  }, [categories])

  /**
   * Only categories that actually have a game on the shelf get a chip. An
   * empty chip is a dead end: it promises work that is not there.
   */
  const chips = useMemo<Chip[]>(() => {
    const used = new Set(games.map((g) => g.category_id).filter(Boolean) as string[])
    const inUse = categories
      .filter((c) => used.has(c.id))
      .map((c) => ({ key: `cat:${c.id}`, label: c.label }))

    // Released/Prototypes only earn their place when both exist. If every
    // game is shipped, "Released" is just "All work" with extra steps.
    const splits =
      games.some((g) => g.status === 'live') && games.some((g) => g.status === 'prototype')
    const status = splits ? STATUS_CHIPS : []

    // One chip plus "All work" is the same as no filter at all.
    const rest = [...status, ...inUse]
    return rest.length > 1 ? [ALL, ...rest] : []
  }, [games, categories])

  // A category can be deleted or emptied while it is the active filter, which
  // would leave the shelf stuck on an empty grid with no chip highlighted.
  useEffect(() => {
    if (filter !== 'all' && !chips.some((c) => c.key === filter)) setFilter('all')
  }, [chips, filter])

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

      {chips.length > 0 && (
        <div className="filters">
          {chips.map((c) => (
            <button
              key={c.key}
              className="chip"
              aria-pressed={filter === c.key}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

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
              {(featured.category_id && labelById.get(featured.category_id)) || featured.genre ? (
                <span>
                  {(featured.category_id && labelById.get(featured.category_id)) ?? featured.genre}
                </span>
              ) : null}
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
            <GameCard
              key={game.id}
              game={game}
              categoryLabel={game.category_id ? labelById.get(game.category_id) ?? null : null}
            />
          ))}
        </div>
      )}
    </section>
  )
}
