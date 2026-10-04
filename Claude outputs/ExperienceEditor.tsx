import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ExperienceRow } from '../lib/types'

type Status = { kind: 'idle' | 'busy' | 'ok' | 'bad'; text: string }

/**
 * The track record, editable in place. Rows are renumbered in tens on every
 * reorder so a later insert has room between neighbours without a second pass.
 */
export default function ExperienceEditor({
  rows,
  onChanged,
}: {
  rows: ExperienceRow[]
  onChanged: () => void
}) {
  const [list, setList] = useState<ExperienceRow[]>(rows)
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' })

  useEffect(() => setList(rows), [rows])

  const edit = (id: string, key: keyof ExperienceRow, value: string) =>
    setList((l) => l.map((r) => (r.id === id ? { ...r, [key]: value } : r)))

  const dirty = JSON.stringify(list) !== JSON.stringify(rows)

  async function saveAll() {
    setStatus({ kind: 'busy', text: 'Saving…' })
    const { error } = await supabase.from('experience').upsert(
      list.map((r, i) => ({
        id: r.id,
        when_label: r.when_label.trim() || '—',
        title: r.title.trim() || 'Untitled role',
        where_label: r.where_label?.trim() || null,
        where_url: r.where_url?.trim() || null,
        note: r.note?.trim() || null,
        sort_order: (i + 1) * 10,
      })),
      { onConflict: 'id' },
    )
    if (error) setStatus({ kind: 'bad', text: error.message })
    else {
      setStatus({ kind: 'ok', text: 'Saved.' })
      onChanged()
    }
  }

  async function addRole() {
    setStatus({ kind: 'busy', text: 'Adding…' })
    const maxOrder = list.reduce((m, r) => Math.max(m, r.sort_order), 0)
    const { error } = await supabase.from('experience').insert({
      when_label: 'Year → year',
      title: 'New role',
      where_label: 'Studio',
      where_url: null,
      note: '',
      sort_order: maxOrder + 10,
    })
    if (error) setStatus({ kind: 'bad', text: error.message })
    else {
      setStatus({ kind: 'idle', text: '' })
      onChanged()
    }
  }

  async function remove(row: ExperienceRow) {
    if (!window.confirm(`Delete "${row.title}" from the track record?`)) return
    setStatus({ kind: 'busy', text: 'Deleting…' })
    const { error } = await supabase.from('experience').delete().eq('id', row.id)
    if (error) setStatus({ kind: 'bad', text: error.message })
    else {
      setStatus({ kind: 'idle', text: '' })
      onChanged()
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    const tmp = next[index]
    next[index] = next[target]
    next[target] = tmp
    setList(next)
  }

  const busy = status.kind === 'busy'

  return (
    <div>
      <div className="pane__top">
        <h3>Track record</h3>
        <span className="count">{list.length} roles</span>
        <button className="btnp btnp--push" onClick={addRole} disabled={busy}>
          + Add role
        </button>
      </div>

      <div className="roles-edit">
        {list.length === 0 && (
          <p className="empty" style={{ padding: '40px 20px' }}>
            No roles yet. Add one to start the track record.
          </p>
        )}

        {list.map((r, i) => (
          <div className="role-edit" key={r.id}>
            <div className="order">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" title="Move up">
                ▲
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === list.length - 1}
                aria-label="Move down"
                title="Move down"
              >
                ▼
              </button>
            </div>

            <div className="fields" style={{ gap: 10 }}>
              <div className="f">
                <label htmlFor={`x-when-${r.id}`}>When</label>
                <input
                  id={`x-when-${r.id}`}
                  value={r.when_label}
                  onChange={(e) => edit(r.id, 'when_label', e.target.value)}
                />
              </div>
              <div className="f">
                <label htmlFor={`x-title-${r.id}`}>Title</label>
                <input
                  id={`x-title-${r.id}`}
                  value={r.title}
                  onChange={(e) => edit(r.id, 'title', e.target.value)}
                />
              </div>
              <div className="f">
                <label htmlFor={`x-where-${r.id}`}>Where</label>
                <input
                  id={`x-where-${r.id}`}
                  value={r.where_label ?? ''}
                  onChange={(e) => edit(r.id, 'where_label', e.target.value)}
                />
              </div>
              <div className="f wide">
                <label htmlFor={`x-url-${r.id}`}>
                  Company link — site or LinkedIn. Empty leaves the name as plain text
                </label>
                <input
                  id={`x-url-${r.id}`}
                  value={r.where_url ?? ''}
                  onChange={(e) => edit(r.id, 'where_url', e.target.value)}
                  placeholder="https://www.linkedin.com/company/…"
                />
              </div>
              <div className="f wide">
                <label htmlFor={`x-note-${r.id}`}>What you did</label>
                <textarea
                  id={`x-note-${r.id}`}
                  value={r.note ?? ''}
                  onChange={(e) => edit(r.id, 'note', e.target.value)}
                />
              </div>
            </div>

            <button
              className="btng btng--danger role-edit__del"
              onClick={() => remove(r)}
              disabled={busy}
              aria-label={`Delete ${r.title}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="editor" style={{ background: 'var(--sunken)' }}>
        <div className="editor__bar" style={{ marginTop: 0 }}>
          <button className="btnp" onClick={saveAll} disabled={busy || !dirty}>
            {busy ? 'Working…' : dirty ? 'Save all changes' : 'No changes'}
          </button>
          <span className={`hint ${status.kind === 'ok' ? 'ok' : status.kind === 'bad' ? 'bad' : ''}`}>
            {status.text}
          </span>
        </div>
      </div>
    </div>
  )
}
