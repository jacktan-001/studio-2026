import { useEffect, useRef } from 'react'
import { useAudio } from '../core/AudioProvider'
import { useMotionPrefs } from '../core/MotionPrefsProvider'

/**
 * Refined custom cursor: a precise dot + a lagging ring that breathes with the
 * audio spectrum. Violet-only, respects reduced-motion + touch. Hovering any
 * interactive element grows the ring (driven by `.cursor-hover-active` on <html>).
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const { getBands } = useAudio()
  const { reduced } = useMotionPrefs()

  useEffect(() => {
    if (reduced) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2
    let rx = mx
    let ry = my
    let raf = 0
    let hover = false

    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
    }
    const onOver = (e: Event) => {
      const t = e.target as Element | null
      hover = !!t?.closest('a, button, [data-cursor-hover], input, textarea, select, [role="button"]')
    }

    const loop = () => {
      const b = getBands()
      const scale = 1 + b.level * 0.9 + (hover ? 0.5 : 0)
      rx += (mx - rx) * 0.18
      ry += (my - ry) * 0.18
      dot.style.transform = `translate(${mx}px, ${my}px)`
      ring.style.transform = `translate(${rx}px, ${ry}px) scale(${scale})`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerover', onOver, true)
    document.documentElement.classList.add('cursor-hover-active-host')
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver, true)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('cursor-hover-active-host')
    }
  }, [getBands, reduced])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
