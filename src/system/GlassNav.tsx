import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { TransitionLink } from './transition'
import { PROJECTS } from '../registry/projects'
import { useTheme } from '../core/ThemeProvider'

/**
 * Glassmorphism top navigation. Project chips use TransitionLink (so navigation
 * goes through the View Transition + keeps audio alive). On narrow viewports a
 * menu button opens a right-anchored dropdown panel (NOT a full-screen takeover)
 * layered ABOVE the nav + audio player, with a backdrop that closes on click or
 * Escape — so it never covers the main interface.
 */
export function GlassNav() {
  const { theme } = useTheme()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Close on Escape when open.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const isActive = (href: string) => location.pathname === href

  return (
    <header className="glass-nav">
      <TransitionLink to="/" className="nav-logo" aria-label="Home">
        <span className="nav-logo-mark" style={{ background: theme.accent }} />
        <span className="nav-logo-text">
          JACK TAN<span className="nav-logo-sub">STUDIO</span>
        </span>
      </TransitionLink>

      <nav className="nav-chips" aria-label="Projects">
        {PROJECTS.map((p) => (
          <TransitionLink
            key={p.id}
            to={p.href}
            className={`nav-chip ${isActive(p.href) ? 'is-active' : ''} ${
              p.status === 'coming-soon' ? 'is-soon' : ''
            }`}
            data-theme-key={p.themeKey}
          >
            <span className="nav-chip-dot" />
            Jack {p.shortName}
            {p.status === 'coming-soon' && <span className="nav-chip-soon">soon</span>}
          </TransitionLink>
        ))}
        <TransitionLink
          to="/notes"
          className={`nav-chip ${isActive('/notes') ? 'is-active' : ''}`}
          data-theme-key="violet"
        >
          <span className="nav-chip-dot" />
          Jack Notes
        </TransitionLink>
        <TransitionLink
          to="/admin"
          className={`nav-chip ${isActive('/admin') ? 'is-active' : ''}`}
          data-theme-key="violet"
        >
          <span className="nav-chip-dot" />
          admin
        </TransitionLink>
      </nav>

      <button
        className="nav-menu-btn"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className={menuOpen ? 'is-open' : ''} />
      </button>

      {menuOpen && (
        <>
          <div
            className="nav-backdrop"
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
          />
          <div className="nav-overlay" role="dialog" aria-label="项目导航">
            {PROJECTS.map((p) => (
              <TransitionLink
                key={p.id}
                to={p.href}
                className={`nav-overlay-item ${isActive(p.href) ? 'is-active' : ''}`}
              >
                <span className="nav-overlay-num">
                  {String(PROJECTS.indexOf(p) + 1).padStart(2, '0')}
                </span>
                {p.name}
                <span className="nav-overlay-role">{p.role}</span>
              </TransitionLink>
            ))}
            <TransitionLink to="/notes" className={`nav-overlay-item ${isActive('/notes') ? 'is-active' : ''}`}>
              <span className="nav-overlay-num">✎</span>
              Jack Notes
              <span className="nav-overlay-role">JOURNAL</span>
            </TransitionLink>
            <TransitionLink to="/admin" className="nav-overlay-item nav-overlay-admin">
              <span className="nav-overlay-num">⚙</span>
              admin
              <span className="nav-overlay-role">ADMIN</span>
            </TransitionLink>
          </div>
        </>
      )}
    </header>
  )
}
