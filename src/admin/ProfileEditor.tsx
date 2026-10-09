import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'
import { uploadAsset, prettyBytes } from './upload'
import PhotoFramer from './PhotoFramer'

type Status = { kind: 'idle' | 'busy' | 'ok' | 'bad'; text: string }

export default function ProfileEditor({
  profile,
  onSaved,
}: {
  profile: Profile | null
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<Partial<Profile>>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' })
  /**
   * A blob URL for the file just picked, so the framer appears the instant you
   * choose a photo instead of after the upload round-trip. Framing is stored as
   * numbers, not pixels, so anything set against this preview applies verbatim
   * to the uploaded file.
   */
  const [picked, setPicked] = useState<string | null>(null)

  // Blob URLs are held by the document until revoked, so drop ours on the way out.
  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked) }, [picked])

  useEffect(() => {
    if (!profile) return
    setDraft({
      name: profile.name,
      role: profile.role ?? '',
      location: profile.location ?? '',
      engine: profile.engine ?? '',
      headline: profile.headline ?? '',
      intro: profile.intro ?? '',
      email: profile.email ?? '',
      github_url: profile.github_url ?? '',
      linkedin_url: profile.linkedin_url ?? '',
      photo_url: profile.photo_url,
      photo_zoom: profile.photo_zoom ?? 1,
      photo_x: profile.photo_x ?? 50,
      photo_y: profile.photo_y ?? 50,
      cv_url: profile.cv_url,
    })
    // The stored photo is authoritative once it comes back, so drop the preview.
    setPicked(null)
    setStatus({ kind: 'idle', text: '' })
  }, [profile])

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  async function pick(
    e: ChangeEvent<HTMLInputElement>,
    prefix: 'photo' | 'cv',
    field: 'photo_url' | 'cv_url',
    maxMb: number,
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxMb * 1024 * 1024) {
      setStatus({ kind: 'bad', text: `That file is ${prettyBytes(file.size)} — keep it under ${maxMb} MB.` })
      e.target.value = ''
      return
    }

    // Show it and let him start framing straight away; the upload runs behind.
    // Fresh framing too — the old focal point belonged to a different picture.
    if (field === 'photo_url') {
      setPicked(URL.createObjectURL(file))
      setDraft((d) => ({ ...d, photo_zoom: 1, photo_x: 50, photo_y: 50 }))
    }

    setStatus({ kind: 'busy', text: `Uploading ${prettyBytes(file.size)}…` })
    try {
      const url = await uploadAsset(prefix, file)
      setDraft((d) => ({ ...d, [field]: url }))
      setStatus({
        kind: 'ok',
        text: field === 'photo_url' ? 'Uploaded. Frame it, then save.' : 'Uploaded. Save to apply.',
      })
    } catch (err) {
      // Nothing was stored, so clear the preview rather than leave a picture
      // on screen that saving would not keep.
      if (field === 'photo_url') setPicked(null)
      setStatus({ kind: 'bad', text: err instanceof Error ? err.message : 'Upload failed.' })
    } finally {
      e.target.value = ''
    }
  }

  async function save() {
    if (!draft.name?.trim()) {
      setStatus({ kind: 'bad', text: 'A name is required.' })
      return
    }
    setStatus({ kind: 'busy', text: 'Saving…' })

    const blank = (v: unknown) => {
      const s = typeof v === 'string' ? v.trim() : v
      return s === '' || s === undefined ? null : s
    }

    const { error } = await supabase
      .from('profile')
      .update({
        name: draft.name.trim(),
        role: blank(draft.role),
        location: blank(draft.location),
        engine: blank(draft.engine),
        headline: blank(draft.headline),
        intro: blank(draft.intro),
        email: blank(draft.email),
        github_url: blank(draft.github_url),
        linkedin_url: blank(draft.linkedin_url),
        photo_url: blank(draft.photo_url),
        photo_zoom: draft.photo_zoom ?? 1,
        photo_x: draft.photo_x ?? 50,
        photo_y: draft.photo_y ?? 50,
        cv_url: blank(draft.cv_url),
      })
      .eq('id', 'main')

    if (error) setStatus({ kind: 'bad', text: error.message })
    else {
      setStatus({ kind: 'ok', text: 'Saved. The site is already showing it.' })
      onSaved()
    }
  }

  const busy = status.kind === 'busy'

  return (
    <div className="editor" style={{ borderTop: 'none' }}>
      <div className="editor__grid editor__grid--profile">
        <div>
          <label className="f" style={{ gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Photo
            </span>
          </label>
          {picked || draft.photo_url ? (
            <PhotoFramer
              url={picked ?? (draft.photo_url as string)}
              zoom={draft.photo_zoom ?? 1}
              x={draft.photo_x ?? 50}
              y={draft.photo_y ?? 50}
              disabled={busy}
              onChange={({ zoom, x, y }) =>
                setDraft((d) => ({ ...d, photo_zoom: zoom, photo_x: x, photo_y: y }))
              }
            />
          ) : (
            <figure className="photo-preview">
              <span>No photo yet</span>
            </figure>
          )}
          <input
            id="pf-photo"
            type="file"
            accept="image/*"
            onChange={(e) => pick(e, 'photo', 'photo_url', 5)}
            style={{ fontSize: 11, marginTop: 10, maxWidth: '100%' }}
          />
          {(picked || draft.photo_url) && (
            <button
              className="btng"
              style={{ marginTop: 8, width: '100%' }}
              onClick={() => {
                setPicked(null)
                set('photo_url', null)
              }}
              disabled={busy}
            >
              Remove photo
            </button>
          )}
        </div>

        <div>
          <div className="fields">
            <div className="f">
              <label htmlFor="pf-name">Name</label>
              <input id="pf-name" value={draft.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="f">
              <label htmlFor="pf-role">Role</label>
              <input id="pf-role" value={draft.role ?? ''} onChange={(e) => set('role', e.target.value)} />
            </div>
            <div className="f">
              <label htmlFor="pf-engine">Engine</label>
              <input id="pf-engine" value={draft.engine ?? ''} onChange={(e) => set('engine', e.target.value)} />
            </div>
            <div className="f">
              <label htmlFor="pf-location">Location</label>
              <input id="pf-location" value={draft.location ?? ''} onChange={(e) => set('location', e.target.value)} />
            </div>

            <div className="f wide">
              <label htmlFor="pf-headline">Headline — wrap a word in *asterisks* to grey it out</label>
              <input
                id="pf-headline"
                value={draft.headline ?? ''}
                onChange={(e) => set('headline', e.target.value)}
                placeholder="I build the *feel* of mobile games."
              />
            </div>

            <div className="f wide">
              <label htmlFor="pf-intro">Intro paragraph</label>
              <textarea
                id="pf-intro"
                style={{ minHeight: 100 }}
                value={draft.intro ?? ''}
                onChange={(e) => set('intro', e.target.value)}
              />
            </div>

            <div className="f">
              <label htmlFor="pf-email">Email</label>
              <input id="pf-email" value={draft.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="f">
              <label htmlFor="pf-github">GitHub URL</label>
              <input id="pf-github" value={draft.github_url ?? ''} onChange={(e) => set('github_url', e.target.value)} />
            </div>
            <div className="f wide">
              <label htmlFor="pf-linkedin">LinkedIn URL — leave empty to hide the link</label>
              <input
                id="pf-linkedin"
                value={draft.linkedin_url ?? ''}
                onChange={(e) => set('linkedin_url', e.target.value)}
                placeholder="https://www.linkedin.com/in/…"
              />
            </div>

            <div className="f wide">
              <label htmlFor="pf-cv">CV</label>
              <div className="drop">
                <div className="ic">PDF</div>
                <div>
                  <span className="mono" style={{ fontSize: 11.5 }}>
                    {draft.cv_url ? draft.cv_url.split('/').pop() : 'No CV uploaded yet'}
                  </span>
                  <br />
                  <small>PDF, under 10 MB &middot; replaces the Download CV link</small>
                  <br />
                  <input
                    id="pf-cv"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => pick(e, 'cv', 'cv_url', 10)}
                  />
                </div>
              </div>
              {draft.cv_url && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <a className="btng" href={draft.cv_url} target="_blank" rel="noopener noreferrer">
                    Open current CV
                  </a>
                  <button className="btng" onClick={() => set('cv_url', null)} disabled={busy}>
                    Remove CV
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="editor__bar">
            <button className="btnp" onClick={save} disabled={busy}>
              {busy ? 'Working…' : 'Save profile'}
            </button>
            <span className={`hint ${status.kind === 'ok' ? 'ok' : status.kind === 'bad' ? 'bad' : ''}`}>
              {status.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
