import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { MouseEvent, ReactNode } from 'react'
import { profile as staticProfile } from '../data/profile'
import { useTheme } from '../lib/useTheme'
import type { Profile, ExperienceRow } from '../lib/types'

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
)

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'track', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]

export function TopBar({ name }: { name?: string }) {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * These are in-page anchors, but the app uses HashRouter — so the URL hash
   * *is* the route. Letting href="#work" through would navigate to a route
   * called /work, which does not exist, and land on the 404 page. Scroll by
   * hand instead and leave the hash alone.
   */
  const jump = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const scroll = () =>
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    if (location.pathname !== '/') {
      navigate('/')
      window.setTimeout(scroll, 80)
    } else {
      scroll()
    }
  }

  return (
    <header className="topbar">
      <div className="wrap topbar__in">
        <Link className="mark" to="/">
          <i />
          {name ?? staticProfile.name}
        </Link>
        <nav className="navlinks">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={jump(s.id)}>
              {s.label}
            </a>
          ))}
        </nav>
        <span className="topbar__spacer" />
        <button
          className="themebtn"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <Link className="ghost-link" to="/admin">
          Admin
        </Link>
      </div>
    </header>
  )
}

/**
 * The headline is one editable string, but it still wants emphasis. Text
 * wrapped in *asterisks* renders in the muted colour — the convention keeps
 * the admin form a plain text input instead of a rich-text editor.
 */
function renderHeadline(text: string): ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.length > 2 && part.startsWith('*') && part.endsWith('*') ? (
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function Hero({ data }: { data: Profile | null }) {
  const p = data
  const eyebrow = [p?.role, p?.engine, p?.location].filter(Boolean).join(' · ')
  const email = p?.email?.trim()
  const github = p?.github_url?.trim()
  const linkedin = p?.linkedin_url?.trim()
  const cv = p?.cv_url?.trim()

  return (
    <section className="wrap hero">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{renderHeadline(p?.headline || 'I build the *feel* of mobile games.')}</h1>

      <div className="hero__body">
        <div className="hero__text">
          {p?.intro && <p className="hero__intro">{p.intro}</p>}

          <div className="hero__links">
            {email && <a href={`mailto:${email}`}>Email</a>}
            {github && (
              <a href={github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            )}
            {linkedin && (
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            )}
            {cv && (
              <a href={cv} target="_blank" rel="noopener noreferrer">
                Download CV
              </a>
            )}
          </div>
        </div>

        {/* No photo uploaded yet: drop the panel rather than show an empty box. */}
        {p?.photo_url && (
          <figure className="hero__photo">
            <img src={p.photo_url} alt={p.name} loading="eager" decoding="async" />
          </figure>
        )}
      </div>

      <div className="specs">
        {staticProfile.stats.map((s) => (
          <div className="spec" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Experience({ rows }: { rows: ExperienceRow[] }) {
  if (rows.length === 0) return null

  return (
    <section className="wrap track" id="track">
      <p className="eyebrow">Track record</p>
      <h2>Where the builds came from</h2>
      <div className="roles">
        {rows.map((role) => (
          <div className="role" key={role.id}>
            <div className="role__when">{role.when_label}</div>
            <div>
              <div className="role__what">{role.title}</div>
              {role.where_label && (
                <div className="role__where">
                  {role.where_url ? (
                    <a
                      className="role__link"
                      href={role.where_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {role.where_label}
                    </a>
                  ) : (
                    role.where_label
                  )}
                </div>
              )}
            </div>
            <div className="role__note">{role.note}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Footer({ data }: { data: Profile | null }) {
  const email = data?.email?.trim()

  return (
    <div className="wrap">
      <footer className="site-footer" id="contact">
        <div className="foot">
          <div>
            <p className="eyebrow">Open to gameplay &amp; tools roles</p>
            <h2>
              Let&rsquo;s talk
              <br />
              about the loop.
            </h2>
          </div>
          {email && (
            <div className="links">
              <a href={`mailto:${email}`}>{email}</a>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
