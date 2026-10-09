import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

const MIN_ZOOM = 1
const MAX_ZOOM = 3

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Framing control for the hero portrait.
 *
 * Nothing here touches the uploaded file. It records a zoom factor and a focal
 * point, which the site applies with `transform: scale()` and `object-position`
 * — so framing stays editable forever and a bad crop is undone by a slider
 * rather than a re-upload.
 *
 * The preview is the same 4:5 box the hero uses, so what you set is what ships.
 */
export default function PhotoFramer({
  url,
  zoom,
  x,
  y,
  onChange,
  disabled = false,
}: {
  url: string
  zoom: number
  x: number
  y: number
  onChange: (next: { zoom: number; x: number; y: number }) => void
  disabled?: boolean
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x, y }
    setDragging(true)
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current
    const box = boxRef.current
    if (!d || !box) return

    const rect = box.getBoundingClientRect()
    // Dragging right should reveal what is on the left, so the focal point
    // moves against the pointer.
    const nx = clamp(d.x - ((e.clientX - d.px) / rect.width) * 100, 0, 100)
    const ny = clamp(d.y - ((e.clientY - d.py) / rect.height) * 100, 0, 100)
    onChange({ zoom, x: Math.round(nx), y: Math.round(ny) })
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current) {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
      drag.current = null
      setDragging(false)
    }
  }

  /**
   * Wheel zoom. React attaches wheel handlers passively, which makes
   * preventDefault() a no-op there and lets the page scroll away under the
   * cursor — so this one is bound natively with passive: false.
   */
  useEffect(() => {
    const box = boxRef.current
    if (!box || disabled) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const next = clamp(zoom - e.deltaY * 0.0022, MIN_ZOOM, MAX_ZOOM)
      if (next !== zoom) onChange({ zoom: Number(next.toFixed(2)), x, y })
    }

    box.addEventListener('wheel', onWheel, { passive: false })
    return () => box.removeEventListener('wheel', onWheel)
  }, [zoom, x, y, disabled, onChange])

  /** Arrow keys nudge the focal point, so this works without a pointer. */
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 2
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const m = moves[e.key]
    if (!m) return
    e.preventDefault()
    onChange({ zoom, x: clamp(x + m[0], 0, 100), y: clamp(y + m[1], 0, 100) })
  }

  return (
    <div className="framer">
      <div
        ref={boxRef}
        className={`framer__box${dragging ? ' is-dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        role="application"
        tabIndex={0}
        aria-label="Reposition the portrait. Drag, or use the arrow keys."
      >
        <img
          src={url}
          alt=""
          draggable={false}
          style={{ objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})` }}
        />
        <span className="framer__hint">Drag to reposition &middot; scroll to zoom</span>
      </div>

      <label className="framer__zoom" htmlFor="pf-zoom">
        <span>
          Zoom <b>{zoom.toFixed(2)}×</b>
        </span>
        <input
          id="pf-zoom"
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={disabled}
          onChange={(e) => onChange({ zoom: Number(e.target.value), x, y })}
        />
      </label>

      <div className="framer__foot">
        <span className="mono">
          {x}% · {y}%
        </span>
        <button
          type="button"
          className="btng"
          disabled={disabled || (zoom === 1 && x === 50 && y === 50)}
          onClick={() => onChange({ zoom: 1, x: 50, y: 50 })}
        >
          Reset framing
        </button>
      </div>
    </div>
  )
}
