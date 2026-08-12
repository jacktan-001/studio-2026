import { useEffect, useRef, type ElementType, type ReactNode } from 'react'
import { useMotionPrefs } from '../core/MotionPrefsProvider'

interface Props {
  children: ReactNode
  className?: string
  /** translate distance in px */
  y?: number
  delay?: number
  as?: ElementType
}

/**
 * Generic scroll-reveal: fade + rise when the element enters the viewport.
 * CSS-driven (IntersectionObserver), fully reduced-motion safe.
 */
export function Reveal({ children, className, y = 40, delay = 0, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { reduced } = useMotionPrefs()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      el.classList.add('in-view')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('in-view')
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`reveal ${className || ''}`}
      style={{ ['--reveal-y' as string]: `${y}px`, ['--reveal-delay' as string]: `${delay}s` }}
    >
      {children}
    </Tag>
  )
}
