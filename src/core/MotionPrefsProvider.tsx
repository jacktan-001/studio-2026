import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface MotionApi {
  /** user prefers reduced motion */
  reduced: boolean
  /** convenience: true when motion is allowed */
  smooth: boolean
}

const Ctx = createContext<MotionApi>({ reduced: false, smooth: true })

export function useMotionPrefs(): MotionApi {
  return useContext(Ctx)
}

/**
 * Tracks `prefers-reduced-motion`. Every animation primitive reads this and
 * degrades to instant/static when true — full accessibility compliance.
 */
export function MotionPrefsProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <Ctx.Provider value={{ reduced, smooth: !reduced }}>{children}</Ctx.Provider>
  )
}
