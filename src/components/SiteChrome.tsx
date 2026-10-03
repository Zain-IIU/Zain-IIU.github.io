import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { MouseEvent } from 'react'
import { profile, experience } from '../data/profile'
import { useTheme } from '../lib/useTheme'

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

export function TopBar() {
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
      // Let the route render before looking for the section.
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
          {profile.name}
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

export function Hero() {
  return (
    <section className="wrap hero">
      <p className="eyebrow">
        {profile.role} · {profile.engine} · {profile.location}
      </p>
      <h1>
        I build the <em>feel</em> of mobile games.
      </h1>
      <p className="hero__intro">{profile.intro}</p>
      <div className="specs">
        {profile.stats.map((s) => (
          <div className="spec" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Experience() {
  return (
    <section className="wrap track" id="track">
      <p className="eyebrow">Track record</p>
      <h2>Where the builds came from</h2>
      <div className="roles">
        {experience.map((role) => (
          <div className="role" key={role.when}>
            <div className="role__when">{role.when}</div>
            <div>
              <div className="role__what">{role.title}</div>
              <div className="role__where">{role.where}</div>
            </div>
            <div className="role__note">{role.note}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Footer() {
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
          <div className="links">
            <a href={profile.links.email}>Email</a>
            <a href={profile.links.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href={profile.links.cv}>Download CV</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
