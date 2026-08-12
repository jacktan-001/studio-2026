import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMotionPrefs } from '../core/MotionPrefsProvider'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  children: ReactNode
  className?: string
  /** scroll distance the chapter stays pinned, in viewport-heights (vh) */
  distance?: number
  id?: string
}

/**
 * Apple-style pinned chapter. The inner content is pinned while you scroll
 * `distance` viewport-heights; a normalized progress `--p` (0→1) is written to
 * the inner element every frame so children can drive their own scrubbed
 * animations (e.g. a counter, a progress line, a reveal). Under reduced-motion
 * the pin is dropped and the content simply flows.
 */
export function PinnedChapter({ children, className, distance = 100, id }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const { reduced } = useMotionPrefs()

  useEffect(() => {
    const el = ref.current
    const inner = innerRef.current
    if (!el || !inner) return
    if (reduced) {
      inner.style.position = 'relative'
      inner.style.top = '0'
      return
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: `+=${distance}%`,
      pin: inner,
      pinSpacing: true,
      scrub: true,
      onUpdate: (self) => inner.style.setProperty('--p', self.progress.toFixed(4)),
    })
    return () => {
      st.kill()
      inner.style.removeProperty('--p')
    }
  }, [reduced, distance])

  return (
    <section
      ref={ref}
      id={id}
      className={`pinned-chapter ${className || ''}`}
      style={{ minHeight: `${distance}vh` }}
    >
      <div ref={innerRef} className="pinned-inner">
        {children}
      </div>
    </section>
  )
}
