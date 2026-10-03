import type { Game } from '../lib/types'

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.2-2.6 0 0-2.4-.9-2.4-3.5zM14.2 5.6c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2.1-.5 2.7-1.3z" />
  </svg>
)

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.6 2.3zM16.2 15.4l-3.1-3.1 3.1-3.1 3.7 2.1c1.1.6 1.1 1.6 0 2.2l-3.7 2zM14.6 16.9l-3.2-3.2-7.7 7.7c.4.4 1 .4 1.7.1l9.2-4.6zM14.6 7.1L5.4 2.5c-.7-.4-1.3-.3-1.7.1l7.7 7.7 3.2-3.2z" />
  </svg>
)

/**
 * A badge appears only when that store URL exists. A game with neither says so
 * instead of leaving a ragged gap in the grid.
 */
export default function StoreBadges({
  game,
  align = 'center',
}: {
  game: Pick<Game, 'ios_url' | 'android_url' | 'title'>
  align?: 'center' | 'start'
}) {
  const hasIos = Boolean(game.ios_url)
  const hasAndroid = Boolean(game.android_url)
  const cls = `stores${align === 'start' ? ' stores--start' : ''}`

  if (!hasIos && !hasAndroid) {
    return (
      <div className={cls}>
        <span className="nolink">Unreleased build</span>
      </div>
    )
  }

  return (
    <div className={cls}>
      {hasIos && (
        <a
          className="store"
          href={game.ios_url!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${game.title} on the App Store`}
        >
          <AppleIcon />
          App Store
        </a>
      )}
      {hasAndroid && (
        <a
          className="store"
          href={game.android_url!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${game.title} on Google Play`}
        >
          <PlayIcon />
          Google Play
        </a>
      )}
    </div>
  )
}
