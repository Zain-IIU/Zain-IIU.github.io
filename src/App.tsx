import { Routes, Route, Link } from 'react-router-dom'
import { TopBar, Hero, Experience, Footer } from './components/SiteChrome'
import Shelf from './components/Shelf'
import AdminApp from './admin/AdminApp'
import { usePublishedGames } from './lib/useGames'
import { useCategories } from './lib/useCategories'
import { useProfile } from './lib/useProfile'
import type { ProfileState } from './lib/useProfile'

function SetupNotice() {
  return (
    <div className="wrap">
      <div className="notice">
        <h3>Almost there — connect Supabase</h3>
        <p>
          The site is running, but <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> are not set, so there are no games to show. Copy{' '}
          <code>.env.example</code> to <code>.env</code>, paste the two values from your Supabase
          project, and restart the dev server. <code>README.md</code> walks through it.
        </p>
      </div>
    </div>
  )
}

function Site({ prof }: { prof: ProfileState }) {
  const { games, loading, error } = usePublishedGames()
  const { categories } = useCategories()

  return (
    <>
      <Hero data={prof.profile} />
      {error === 'not-configured' && <SetupNotice />}
      {error && error !== 'not-configured' && (
        <div className="wrap">
          <div className="notice notice--bad">
            <h3>Could not load the games</h3>
            <p>{error}</p>
          </div>
        </div>
      )}
      <Shelf games={games} categories={categories} loading={loading} />
      <Experience rows={prof.experience} />
      <Footer data={prof.profile} />
    </>
  )
}

function NotFound() {
  return (
    <div className="wrap" style={{ paddingBlock: 100 }}>
      <p className="eyebrow">404</p>
      <h2 style={{ fontSize: 32, marginTop: 8 }}>That page does not exist.</h2>
      <p style={{ marginTop: 14 }}>
        <Link to="/">Back to the shelf</Link>
      </p>
    </div>
  )
}

export default function App() {
  // Fetched once here so the top bar and the page share a single query.
  const prof = useProfile()

  return (
    <>
      <TopBar name={prof.profile?.name} />
      <main>
        <Routes>
          <Route path="/" element={<Site prof={prof} />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}
