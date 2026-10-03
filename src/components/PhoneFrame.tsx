import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

interface Props {
  /** MP4/WebM capture. Null renders the poster alone. */
  video: string | null
  /** First frame. Shown before anything downloads, and if there is no video. */
  poster: string | null
  alt: string
  /**
   * CSS width of the device — everything else scales from it, so it must be an
   * absolute length (px/rem), never a percentage: the corner radii and button
   * offsets are calc()s of this value. Omit it to let the stylesheet's
   * breakpoints set the width instead, which is what the shelf grid does.
   */
  width?: string
  /** Hover plays on pointer devices; scroll-into-view plays on touch. */
  interactive?: boolean
  className?: string
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isTouch = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

/**
 * An iPhone 17 Pro Max shell around a looping capture.
 *
 * Playback rules that matter:
 *  - muted + playsInline, or mobile browsers refuse to autoplay (and iOS
 *    Safari hijacks the video into fullscreen).
 *  - preload="none", so twelve videos do not start downloading on page load.
 *  - play() returns a promise that rejects when the browser declines. Caught,
 *    or every card throws in the console.
 */
export default function PhoneFrame({
  video,
  poster,
  alt,
  width,
  interactive = true,
  className = '',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const start = () => {
    const v = videoRef.current
    const root = rootRef.current
    if (!v || !root || !video) return
    root.classList.add('is-playing')
    const p = v.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }

  const stop = () => {
    const v = videoRef.current
    const root = rootRef.current
    if (!v || !root) return
    root.classList.remove('is-playing')
    v.pause()
  }

  // Touch devices have no hover, so the card nearest the middle of the screen
  // plays and the rest stay paused.
  useEffect(() => {
    if (!interactive || !video) return
    if (!isTouch() || prefersReducedMotion()) return

    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start()
          else stop()
        }
      },
      { threshold: 0.6 },
    )

    observer.observe(root)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, video])

  const hoverProps =
    interactive && video && !isTouch()
      ? {
          onMouseEnter: start,
          onMouseLeave: stop,
          onFocus: start,
          onBlur: stop,
        }
      : {}

  return (
    <div
      ref={rootRef}
      className={`phone ${className}`}
      style={width ? ({ '--w': width } as CSSProperties) : undefined}
      {...hoverProps}
    >
      <span className="sidebtn sb-action" />
      <span className="sidebtn sb-up" />
      <span className="sidebtn sb-down" />
      <span className="sidebtn sb-power" />
      <span className="sidebtn sb-cam" />

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
            >
              <source src={video} />
            </video>
          )}

          <span className="island" />
          {video && (
            <span className="livedot">
              <i />
              Playing
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
