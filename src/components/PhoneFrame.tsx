import { useEffect, useRef, useState } from 'react'

interface Props {
  /** MP4/WebM capture. Null renders the poster alone. */
  video: string | null
  /** First frame. Shown before anything downloads, and if there is no video. */
  poster: string | null
  alt: string
  /** Hover plays on pointer devices; tap plays on touch. */
  interactive?: boolean
  className?: string
}

/**
 * Only one clip plays at a time. Starting one stops whatever was running, so a
 * visitor moving down the shelf never leaves a trail of videos playing behind
 * them, burning battery and bandwidth off-screen.
 */
let stopCurrent: (() => void) | null = null

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * An iPhone shell around a looping capture.
 *
 * Every measurement is a percentage of the frame's own box, so the device
 * scales with whatever column it lands in — the shelf grid, the featured
 * block, the admin editor — with no size variable to keep in sync.
 *
 * Playback rules that matter:
 *  - muted + playsInline, or mobile browsers refuse to play inline at all
 *    (iOS Safari otherwise hijacks the video into fullscreen).
 *  - preload="none", so a dozen videos do not start downloading on page load.
 *  - play() returns a promise that rejects when the browser declines. Caught,
 *    or every card throws in the console.
 *
 * Touch devices get tap-to-play rather than autoplay-in-view. A tap is a user
 * gesture, which every autoplay policy accepts — Low Power Mode, Data Saver and
 * Reduce Motion all block unprompted playback, and all allow this. It also
 * means a visitor only downloads the clips they actually asked for.
 */
export default function PhoneFrame({ video, poster, alt, interactive = true, className = '' }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches,
  )
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)

  const stop = () => {
    const v = videoRef.current
    if (v) v.pause()
    setPlaying(false)
    setLoading(false)
    if (stopCurrent === stop) stopCurrent = null
  }

  const start = () => {
    const v = videoRef.current
    if (!v || !video) return

    if (stopCurrent && stopCurrent !== stop) stopCurrent()
    stopCurrent = stop

    // Nothing is buffered yet when preload is "none", so show feedback
    // immediately rather than leaving the tap looking ignored.
    if (v.readyState < 3) setLoading(true)

    setPlaying(true)
    const p = v.play()
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        setPlaying(false)
        setLoading(false)
      })
    }
  }

  const toggle = () => (playing ? stop() : start())

  // Pause when scrolled away. This never starts playback — it only cleans up
  // after a clip the visitor already chose.
  useEffect(() => {
    if (!interactive || !video) return
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (!entry.isIntersecting) stop()
      },
      { threshold: 0.1 },
    )
    observer.observe(root)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, video])

  // Release the shared slot if this card unmounts mid-playback.
  useEffect(() => {
    return () => {
      if (stopCurrent === stop) stopCurrent = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canHover = interactive && video && !isTouch && !prefersReducedMotion()
  const hoverProps = canHover
    ? { onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop }
    : {}

  return (
    <div
      ref={rootRef}
      className={`phone ${playing ? 'is-playing' : ''} ${className}`}
      {...hoverProps}
    >
      <div className="phone__body">
        <div className="phone__inner">
          {poster ? (
            <img src={poster} alt={alt} loading="lazy" decoding="async" />
          ) : (
            <div className="phone__blank">No capture yet</div>
          )}

          {video && (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              poster={poster ?? undefined}
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={() => setLoading(false)}
              onWaiting={() => setLoading(true)}
            >
              <source src={video} />
            </video>
          )}

          <span className="island" />

          {video && playing && !loading && (
            <span className="livedot">
              <i />
              Playing
            </span>
          )}

          {/* Touch devices have no hover, so playback needs an explicit control. */}
          {interactive && video && isTouch && (
            <button
              type="button"
              className="phone__tap"
              onClick={toggle}
              aria-pressed={playing}
              aria-label={playing ? `Stop ${alt}` : `Play ${alt}`}
            >
              {loading ? (
                <span className="phone__spin" aria-hidden="true" />
              ) : (
                !playing && (
                  <span className="phone__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.5v13l11-6.5z" />
                    </svg>
                  </span>
                )
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
