import { Link } from 'react-router-dom'
import { profile, experience } from '../data/profile'

export function TopBar() {
  return (
    <header className="topbar">
      <div className="wrap topbar__in">
        <Link className="mark" to="/">
          <i />
          {profile.name}
        </Link>
        <nav className="navlinks">
          <a href="#work">Work</a>
          <a href="#track">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
        <span className="topbar__spacer" />
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
