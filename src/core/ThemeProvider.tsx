import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { getThemeKeyForPath, getSiteIdForPath } from '../registry/projects'
import { getTheme, type ThemeConfig } from '../registry/themes'

interface ThemeApi {
  theme: ThemeConfig
  themeKey: string
}

const Ctx = createContext<ThemeApi | null>(null)

export function useTheme(): ThemeApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTheme must be used within <ThemeProvider>')
  return c
}

/**
 * Writes the active project's theme onto <html> as CSS variables + a
 * `data-project` attribute. Every visual primitive reads `var(--accent)` etc.,
 * so a route change re-skins the whole page. Mounted as a sibling of <Outlet>,
 * so it persists across navigation and only the CSS vars swap (smoothly, inside
 * the View Transition that wraps navigation).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const themeKey = getThemeKeyForPath(location.pathname)
  const theme = getTheme(themeKey)
  const siteId = getSiteIdForPath(location.pathname)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-project', theme.key)
    root.setAttribute('data-site', siteId)
    root.setAttribute('data-cursor-style', theme.cursor)
    root.setAttribute('data-entrance', theme.entrance)
    root.style.setProperty('--accent', theme.accent)
    root.style.setProperty('--accent-rgb', theme.accentRgb)
    root.style.setProperty('--accent-2', theme.accent2)
    root.style.setProperty('--accent2-rgb', theme.accent2Rgb)
    root.style.setProperty('--glow', theme.glow)
    root.style.setProperty('--texture', theme.texture)
    root.style.setProperty('--cursor-style', theme.cursor)
    root.style.setProperty('--entrance', theme.entrance)
  }, [theme])

  const value = useMemo<ThemeApi>(() => ({ theme, themeKey }), [theme, themeKey])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
