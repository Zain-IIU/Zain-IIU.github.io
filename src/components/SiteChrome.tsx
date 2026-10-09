import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { MouseEvent, ReactNode } from 'react'
import { profile as staticProfile, capabilities } from '../data/profile'
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

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M12 4v12M7 12l5 5 5-5M5 20h14" />
  </svg>
)

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .3.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.75-2.05 4 0 4.75 2.6 4.75 6V21H20.5v-5.6c0-1.33-.03-3.05-1.9-3.05-1.9 0-2.2 1.46-2.2 2.96V21H12.6z" />
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 5h16v14H4z" />
    <path d="M4 7l8 6 8-6" />
  </svg>
)

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'track', label: 'Journey' },
  { id: 'contact', label: 'Contact' },
]

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function TopBar({ name }: { name?: string }) {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const who = name ?? staticProfile.name

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
          <i>{initials(who)}</i>
          <span className="mark__txt">
            <b>{who}</b>
            <span>{staticProfile.role}</span>
          </span>
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
        <a className="ghost-link" href="#contact" onClick={jump('contact')}>
          Let&rsquo;s talk
        </a>
      </div>
    </header>
  )
}

/**
 * The headline is one editable string that still wants emphasis. Text wrapped
 * in *asterisks* renders muted, which keeps the admin field a plain text input
 * instead of a rich-text editor.
 */
function renderHeadline(text: string): ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.length > 2 && part.startsWith('*') && part.endsWith('*') ? (
      <em key={i} style={{ fontStyle: 'normal', color: 'var(--muted)' }}>
        {part.slice(1, -1)}
      </em>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function Hero({ data }: { data: Profile | null }) {
  const p = data
  const eyebrow = [p?.engine, 'C#', p?.location].filter(Boolean).join(' · ')
  const email = p?.email?.trim()
  const github = p?.github_url?.trim()
  const linkedin = p?.linkedin_url?.trim()
  const cv = p?.cv_url?.trim()

  return (
    <section className="wrap">
      <div className="hero">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{renderHeadline(p?.headline || 'I build the *feel* of mobile games.')}</h1>
          {p?.role && <p className="hero__role">{p.role}</p>}
          {p?.intro && <p className="hero__intro">{p.intro}</p>}

          <div className="btnrow">
            <a className="btn-o" href="#work" onClick={(e) => { e.preventDefault(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }) }}>
              View the shelf <ArrowIcon />
            </a>
            {cv && (
              <a className="btn-g" href={cv} target="_blank" rel="noopener noreferrer">
                Download CV <DownloadIcon />
              </a>
            )}
          </div>

          <div className="hero__links">
            {github && (
              <a href={github} target="_blank" rel="noopener noreferrer">
                <GithubIcon />
                GitHub
              </a>
            )}
            {linkedin && (
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                <LinkedinIcon />
                LinkedIn
              </a>
            )}
            {cv && (
              <a href={cv} target="_blank" rel="noopener noreferrer">
                <DownloadIcon />
                Resume
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`}>
                <MailIcon />
                Email
              </a>
            )}
          </div>
        </div>

        {/* No photo uploaded yet: drop the panel rather than show an empty box.
            Framing comes from the profile row, so the file itself is untouched. */}
        {p?.photo_url && (
          <figure className="hero__photo">
            <div className="hero__photo__clip">
              <img
                src={p.photo_url}
                alt={p.name}
                loading="eager"
                decoding="async"
                style={{
                  objectPosition: `${p.photo_x ?? 50}% ${p.photo_y ?? 50}%`,
                  transform: `scale(${p.photo_zoom ?? 1})`,
                }}
              />
            </div>
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
      <div className="shead">
        <div>
          <p className="eyebrow">Experience</p>
          <h2>My Journey</h2>
        </div>
        <p>Five years from weekly prototypes to shipped titles with live ops, across four studios.</p>
      </div>

      <div className="journey">
        <div className="roles">
          {rows.map((role) => (
            <div className="role" key={role.id}>
              <div className="role__when">{role.when_label}</div>
              <div className="role__dot">
                <i />
              </div>
              <div>
                <div className="role__what">{role.title}</div>
                {role.where_label && (
                  <div className="role__where">
                    {role.where_url ? (
                      <a className="role__link" href={role.where_url} target="_blank" rel="noopener noreferrer">
                        {role.where_label}
                      </a>
                    ) : (
                      role.where_label
                    )}
                  </div>
                )}
                {role.note && <p className="role__note">{role.note}</p>}
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="eyebrow">What I do</p>
          <div className="caps">
            {capabilities.map((c, i) => (
              <div className="cap" key={c.title}>
                <b>{String(i + 1).padStart(2, '0')}</b>
                <h4>{c.title}</h4>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer({ data }: { data: Profile | null }) {
  const email = data?.email?.trim()
  const where = data?.location?.trim()

  return (
    <footer className="site-footer" id="contact">
      <div className="wrap foot">
        <div>
          <p className="eyebrow">Open to gameplay &amp; tools roles</p>
          <h2>
            Let&rsquo;s talk
            <br />
            about the loop.
          </h2>
          {email && (
            <a className="mail" href={`mailto:${email}`}>
              {email}
            </a>
          )}
        </div>
        <div className="foot__meta">
          {where && (
            <>
              {where}
              <br />
            </>
          )}
          Open to work
        </div>
      </div>
    </footer>
  )
}
