import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { slugify } from '../lib/types'
import type { Category, Game } from '../lib/types'

type Status = { kind: 'idle' | 'busy' | 'ok' | 'bad'; text: string }

/**
 * The shelf's filter chips, editable in place.
 *
 * Rows are renumbered in tens on every reorder so a later insert has room
 * between neighbours. The slug is derived from the label and kept stable
 * once it exists — it is the row's public handle, and churning it on every
 * rename would be noise.
 */
export default function CategoryEditor({
  categories,
  games,
  onChanged,
}: {
  categories: Category[]
  games: Game[]
  onChanged: () => void
}) {
  const [list, setList] = useState<Category[]>(categories)
  const [status, setStatus] = useState<Status>({ kind: 'idle', text: '' })

  useEffect(() => setList(categories), [categories])

  const countFor = (id: string) => games.filter((g) => g.category_id === id).length
  const liveCountFor = (id: string) =>
    games.filter((g) => g.category_id === id && g.published).length

  const rename = (id: string, label: string) =>
    setList((l) => l.map((c) => (c.id === id ? { ...c, label } : c)))

  const dirty = JSON.stringify(list) !== JSON.stringify(categories)

  async function saveAll() {
    const blank = list.find((c) => !c.label.trim())
    if (blank) {
      setStatus({ kind: 'bad', text: 'A category needs a name.' })
      return
    }

    setStatus({ kind: 'busy', text: 'Saving…' })
    const { error } = await supabase.from('categories').upsert(
      list.map((c, i) => ({
        id: c.id,
        label: c.label.trim(),
        slug: c.slug,
        sort_order: (i + 1) * 10,
      })),
      { onConflict: 'id' },
    )

    if (error) setStatus({ kind: 'bad', text: error.message })
    else {
      setStatus({ kind: 'ok', text: 'Saved. The chips on the site match this order.' })
      onChanged()
    }
  }

  async function add() {
    const label = window.prompt('Name of the new category?')?.trim()
    if (!label) return

    const slug = slugify(label)
    if (!slug) {
      setStatus({ kind: 'bad', text: 'That name has no letters or numbers in it.' })
      return
    }
    if (list.some((c) => c.slug === slug)) {
      setStatus({ kind: 'bad', text: `"${label}" is already in the list.` })
      return
    }

    setStatus({ kind: 'busy', text: 'Adding…' })
    const maxOrder = list.reduce((m, c) => Math.max(m, c.sort_order), 0)
    const { error } = await supabase
      .from('categories')
      .insert({ label, slug, sort_order: maxOrder + 10 })

    if (error) setStatus({ kind: 'bad', text: error.message })
    else {
      setStatus({ kind: 'idle', text: '' })
      onChanged()
    }
  }

  async function remove(category: Category) {
    const used = countFor(category.id)
    const warning = used
      ? `Delete "${category.label}"?\n\n${used} game${used === 1 ? '' : 's'} will lose its category and show only under "All work". No game is deleted.`
      : `Delete "${category.label}"?`
    if (!window.confirm(warning)) return

    setStatus({ kind: 'busy', text: 'Deleting…' })
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
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
  const unfiled = games.filter((g) => !g.category_id).length

  return (
    <div>
      <div className="pane__top">
        <h3>Categories</h3>
        <span className="count">{list.length} categories</span>
        <button className="btnp btnp--push" onClick={add} disabled={busy}>
          + Add category
        </button>
      </div>

      <div className="cat-note">
        These are the filter chips on the shelf. A chip only appears once a published game uses it,
        so an empty category costs the visitor nothing — it simply stays hidden until you assign a
        game to it in the <b>Games</b> tab.
        {unfiled > 0 && (
          <>
            {' '}
            <b>
              {unfiled} game{unfiled === 1 ? '' : 's'}
            </b>{' '}
            {unfiled === 1 ? 'has' : 'have'} no category yet.
          </>
        )}
      </div>

      <div className="rows">
        {list.length === 0 && (
          <p className="empty" style={{ padding: '40px 20px' }}>
            No categories yet. Add one, then pick it on a game.
          </p>
        )}

        {list.map((c, i) => {
          const used = countFor(c.id)
          const live = liveCountFor(c.id)
          return (
            <div className="cat-row" key={c.id}>
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

              <div className="f">
                <label htmlFor={`cat-${c.id}`}>Name on the chip</label>
                <input
                  id={`cat-${c.id}`}
                  value={c.label}
                  onChange={(e) => rename(c.id, e.target.value)}
                />
              </div>

              <span className={`pill ${live > 0 ? 'live' : 'draft'}`} title={`${used} assigned, ${live} published`}>
                {live > 0 ? `${live} on the shelf` : used > 0 ? `${used} unpublished` : 'unused'}
              </span>

              <button
                className="btng btng--danger"
                onClick={() => remove(c)}
                disabled={busy}
                aria-label={`Delete ${c.label}`}
              >
                Delete
              </button>
            </div>
          )
        })}
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
