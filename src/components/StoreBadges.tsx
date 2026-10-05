import type { Game } from '../lib/types'

/**
 * Store links as ruled tags, matching the shelf's other metadata. A badge
 * appears only when that store URL exists; a game with neither says so rather
 * than leaving a ragged gap in the grid.
 */
export default function StoreBadges({
  game,
  showStatus = true,
}: {
  game: Pick<Game, 'ios_url' | 'android_url' | 'title' | 'status'>
  showStatus?: boolean
}) {
  const hasIos = Boolean(game.ios_url)
  const hasAndroid = Boolean(game.android_url)
  const live = game.status === 'live'

  return (
    <div className="tags">
      {showStatus && (
        <span className={`tag${live ? ' tag--live' : ''}`}>{live ? 'Live' : 'Prototype'}</span>
      )}
      {hasIos && (
        <a
          className="tag"
          href={game.ios_url!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${game.title} on the App Store`}
        >
          iOS
        </a>
      )}
      {hasAndroid && (
        <a
          className="tag"
          href={game.android_url!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${game.title} on Google Play`}
        >
          Android
        </a>
      )}
    </div>
  )
}
