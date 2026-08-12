import { useEffect, useRef, type ElementType } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useMotionPrefs } from '../core/MotionPrefsProvider'

gsap.registerPlugin(ScrollTrigger, SplitText)

interface Props {
  as?: ElementType
  text: string
  className?: string
  delay?: number
  /** 'chars' for display type, 'words' for longer copy */
  splitBy?: 'chars' | 'words'
}

/**
 * Editorial type reveal. Each character/word rises + fades in on scroll into
 * view (Apple-style reveal, Pacome-style type discipline). Under reduced-motion
 * the text is simply shown.
 */
export function SplitHeading({
  as: Tag = 'h2',
  text,
  className,
  delay = 0,
  splitBy = 'chars',
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const { reduced } = useMotionPrefs()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      gsap.set(el, { opacity: 1 })
      return
    }
    const split = new SplitText(el, { type: splitBy === 'chars' ? 'chars,words' : 'words' })
    const targets = splitBy === 'chars' ? split.chars : split.words
    const tween = gsap.from(targets, {
      yPercent: 120,
      opacity: 0,
      stagger: splitBy === 'chars' ? 0.018 : 0.06,
      duration: 0.8,
      ease: 'power3.out',
      delay,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      split.revert()
    }
  }, [reduced, delay, text, splitBy])

  return (
    <Tag ref={ref as React.Ref<HTMLHeadingElement>} className={className}>
      {text}
    </Tag>
  )
}
