import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import PhoneFrame from '../components/PhoneFrame'
import { supabase } from '../lib/supabase'
import { slugify } from '../lib/types'
import type { Category, Game, GameDraft, GameStatus } from '../lib/types'
import { uploadCapture, prettyBytes } from './upload'

interface Props {
  game: Game | null
  /** The managed category list, for the picker. */
  categories: Category[]
  /** Called after a successful save or delete so the table reloads. */
  onSaved: () => void
  onDeleted: () => void
}

type Status = { kind: 'idle' | 'busy' | 'ok' | 'bad'; text: string }

export default function GameEditor({ game, categories, onSaved, onDeleted }: Props) {
  const [draft, setDraft] = useState<GameDraft>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' })

  // Reload the form whenever a different row is selected.
  useEffect(() => {
    if (!game) return
    setDraft({
      slug: game.slug,
      title: game.title,
      genre: game.genre ?? '',
      category_id: game.category_id ?? null,
      studio: game.studio ?? '',
      year: game.year ?? undefined,
      my_role: game.my_role ?? '',
      blurb: game.blurb ?? '',
      video_url: game.video_url,
      poster_url: game.poster_url,
      ios_url: game.ios_url ?? '',
      android_url: game.android_url ?? '',
      status: game.status,
      published: game.published,
      featured: game.featured,
    })
    setStatus({ kind: 'idle', text: '' })
  }, [game])

  if (!game) {
    return (
      <div className="editor">
        <p className="eyebrow">Select a game above to edit it</p>
      </div>
    )
  }

  const set = <K extends keyof GameDraft>(key: K, value: GameDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  async function onCaptureChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !game) return

    if (file.size > 50 * 1024 * 1024) {
      setStatus({ kind: 'bad', text: 'Over the 50 MB per-file limit. Compress it first.' })
      return
    }

    setStatus({ kind: 'busy', text: `Uploading ${prettyBytes(file.size)}…` })
    try {
      const slug = draft.slug || game.slug
      const { videoUrl, posterUrl, bytes } = await uploadCapture(slug, file)
      setDraft((d) => ({ ...d, video_url: videoUrl, poster_url: posterUrl }))
      setStatus({
        kind: 'ok',
        text: `Uploaded ${prettyBytes(bytes)} — poster generated. Save to apply.`,
      })
    } catch (err) {
      setStatus({ kind: 'bad', text: err instanceof Error ? err.message : 'Upload failed.' })
    } finally {
      e.target.value = ''
    }
  }

  async function save() {
    if (!game) return
    if (!draft.title?.trim()) {
      setStatus({ kind: 'bad', text: 'A game needs a title.' })
      return
    }

    setStatus({ kind: 'busy', text: 'Saving…' })

    // Empty strings become NULL so "no store link" stays a real absence —
    // that is what makes StoreBadges hide the badge instead of linking to ''.
    const nullIfBlank = (v: unknown) => {
      const s = typeof v === 'string' ? v.trim() : v
      return s === '' || s === undefined ? null : s
    }

    const payload = {
      slug: draft.slug?.trim() || slugify(draft.title),
      title: draft.title.trim(),
      genre: nullIfBlank(draft.genre),
      category_id: draft.category_id ?? null,
      studio: nullIfBlank(draft.studio),
      year: draft.year ? Number(draft.year) : null,
      my_role: nullIfBlank(draft.my_role),
      blurb: nullIfBlank(draft.blurb),
      video_url: nullIfBlank(draft.video_url),
      poster_url: nullIfBlank(draft.poster_url),
      ios_url: nullIfBlank(draft.ios_url),
      android_url: nullIfBlank(draft.android_url),
      status: draft.status ?? 'live',
      published: draft.published ?? false,
      featured: draft.featured ?? false,
    }

    // Only one game can wear the featured badge.
    if (payload.featured) {
      await supabase.from('games').update({ featured: false }).neq('id', game.id)
    }

    const { error } = await supabase.from('games').update(payload).eq('id', game.id)

    if (error) {
      setStatus({ kind: 'bad', text: error.message })
    } else {
      setStatus({ kind: 'ok', text: 'Saved. The site is already showing it.' })
      onSaved()
    }
  }

  async function remove() {
    if (!game) return
    const sure = window.confirm(
      `Delete "${game.title}"? This removes the row. The uploaded video and poster stay in storage.`,
    )
    if (!sure) return

    setStatus({ kind: 'busy', text: 'Deleting…' })
    const { error } = await supabase.from('games').delete().eq('id', game.id)
    if (error) setStatus({ kind: 'bad', text: error.message })
    else onDeleted()
  }

  const busy = status.kind === 'busy'

  return (
    <div className="editor">
      <p className="eyebrow" style={{ marginBottom: 14 }}>
        Editing — {game.title}
      </p>

      <div className="editor__grid">
        <PhoneFrame
          video={draft.video_url ?? null}
          poster={draft.poster_url ?? null}
          alt={`${draft.title ?? ''} preview`}
          interactive={false}
        />

        <div>
          <div className="fields">
            <div className="f">
              <label htmlFor="ed-title">Title</label>
              <input
                id="ed-title"
                value={draft.title ?? ''}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="ed-slug">Slug</label>
              <input
                id="ed-slug"
                value={draft.slug ?? ''}
                onChange={(e) => set('slug', slugify(e.target.value))}
              />
            </div>

            <div className="f">
              <label htmlFor="ed-category">Category &mdash; the shelf filter</label>
              <select
                id="ed-category"
                value={draft.category_id ?? ''}
                onChange={(e) => set('category_id', e.target.value || null)}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="f">
              <label htmlFor="ed-genre">Genre &mdash; free text, shown if no category</label>
              <input
                id="ed-genre"
                value={draft.genre ?? ''}
                onChange={(e) => set('genre', e.target.value)}
                placeholder="Idle / Climber"
              />
            </div>

            <div className="f">
              <label htmlFor="ed-studio">Studio</label>
              <input
                id="ed-studio"
                value={draft.studio ?? ''}
                onChange={(e) => set('studio', e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="ed-year">Year</label>
              <input
                id="ed-year"
                type="number"
                value={draft.year ?? ''}
                onChange={(e) => set('year', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="f">
              <label htmlFor="ed-role">My role</label>
              <input
                id="ed-role"
                value={draft.my_role ?? ''}
                onChange={(e) => set('my_role', e.target.value)}
                placeholder="Gameplay + AI"
              />
            </div>

            <div className="f">
              <label htmlFor="ed-status">Status</label>
              <select
                id="ed-status"
                value={draft.status ?? 'live'}
                onChange={(e) => set('status', e.target.value as GameStatus)}
              >
                <option value="live">Live</option>
                <option value="prototype">Prototype</option>
              </select>
            </div>

            <div className="f">
              <label htmlFor="ed-featured">Featured</label>
              <select
                id="ed-featured"
                value={draft.featured ? 'yes' : 'no'}
                onChange={(e) => set('featured', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes — show in the hero slot</option>
              </select>
            </div>

            <div className="f wide">
              <label htmlFor="ed-ios">App Store URL — leave empty to show no badge</label>
              <input
                id="ed-ios"
                value={draft.ios_url ?? ''}
                onChange={(e) => set('ios_url', e.target.value)}
                placeholder="https://apps.apple.com/…"
              />
            </div>

            <div className="f wide">
              <label htmlFor="ed-android">Google Play URL — leave empty to show no badge</label>
              <input
                id="ed-android"
                value={draft.android_url ?? ''}
                onChange={(e) => set('android_url', e.target.value)}
                placeholder="https://play.google.com/…"
              />
            </div>

            <div className="f wide">
              <label htmlFor="ed-blurb">Short note — shown on the featured block</label>
              <textarea
                id="ed-blurb"
                value={draft.blurb ?? ''}
                onChange={(e) => set('blurb', e.target.value)}
              />
            </div>

            <div className="f wide">
              <label htmlFor="ed-capture">Capture</label>
              <div className="drop">
                <div className="ic">▶</div>
                <div>
                  <span className="mono" style={{ fontSize: 11.5 }}>
                    {draft.video_url ? draft.video_url.split('/').pop() : 'No capture uploaded yet'}
                  </span>
                  <br />
                  <small>MP4 / WebM · portrait, ~600px wide · poster is generated for you</small>
                  <br />
                  <input id="ed-capture" type="file" accept="video/*" onChange={onCaptureChosen} />
                </div>
              </div>
            </div>
          </div>

          <div className="editor__bar">
            <button className="btnp" onClick={save} disabled={busy}>
              {busy ? 'Working…' : 'Save changes'}
            </button>
            <button className="btng" onClick={() => set('published', !draft.published)} disabled={busy}>
              {draft.published ? 'Unpublish' : 'Publish'}
            </button>
            <button className="btng btng--danger" onClick={remove} disabled={busy}>
              Delete
            </button>
            <span
              className={`hint ${status.kind === 'ok' ? 'ok' : status.kind === 'bad' ? 'bad' : ''}`}
            >
              {status.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
