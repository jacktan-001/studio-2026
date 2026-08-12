import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../core/ThemeProvider'
import { useAudio } from '../../core/AudioProvider'
import { useMotionPrefs } from '../../core/MotionPrefsProvider'
import { getSiteIdForPath } from '../../registry/projects'
import { AMBIENT_REGISTRY } from './registry'
import type { AmbientRenderer } from './types'

/**
 * Single global ambient layer. One <canvas> mounted fixed behind content
 * (z-index:-1), owned by a single requestAnimationFrame loop. The active
 * renderer is chosen by the current `data-site` (route) and is torn down +
 * recreated on navigation — so only ever ONE effect runs at a time.
 *
 * Hybrid intensity: 1 at the page top (immersive hero), eased to ~0 after one
 * viewport of scroll (calm ambient). Audio-reactive renderers read the global
 * bed's live spectrum each frame. Fully respects prefers-reduced-motion
 * (draws one static frame, no loop).
 */
export function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const location = useLocation()
  const { theme, themeKey } = useTheme()
  const audio = useAudio()
  const { reduced } = useMotionPrefs()

  const siteId = getSiteIdForPath(location.pathname)

  // Live playing state without re-running the canvas effect on every play/
  // pause/volume change (which would reset renderer state). getBands() itself
  // always returns live data via internal refs, so it's safe to capture once.
  const playingRef = useRef(audio.isPlaying)
  useEffect(() => {
    playingRef.current = audio.isPlaying
  }, [audio.isPlaying])

  // Live pointer position in canvas CSS-px space, for mouse-interactive renderers.
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  })
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX
      pointerRef.current.y = e.clientY
      pointerRef.current.active = true
    }
    const onOut = () => {
      pointerRef.current.active = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onOut)
    window.addEventListener('blur', onOut)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onOut)
      window.removeEventListener('blur', onOut)
    }
  }, [])

  const getBands = audio.getBands

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const factory = AMBIENT_REGISTRY[siteId]
    // Sites without a renderer (jack-craft hero canvas, admin) stay transparent.
    if (!factory) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = Math.max(1, r.width)
      h = Math.max(1, r.height)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      renderer.resize(w, h, dpr)
    }

    const renderer: AmbientRenderer = factory({ canvas, ctx, theme, reduced })
    resize()

    // scroll-driven hybrid intensity (target only; loop smooths it)
    let targetI = 1
    const onScroll = () => {
      const vh = window.innerHeight || 1
      targetI = Math.min(1, Math.max(0, 1 - window.scrollY / (vh * 0.9)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    let curI = targetI
    let raf = 0
    let last = performance.now()

    const frame = (t: number) => {
      const dt = Math.min(64, t - last)
      last = t
      curI += (targetI - curI) * 0.08
      renderer.draw({
        t,
        dt,
        intensity: curI,
        audio: getBands(),
        playing: playingRef.current,
        pointer: pointerRef.current,
      })
      raf = requestAnimationFrame(frame)
    }

    if (reduced) {
      // static, accessible frame — no animation loop
      renderer.draw({
        t: performance.now(),
        dt: 16,
        intensity: targetI,
        audio: getBands(),
        playing: false,
        pointer: pointerRef.current,
      })
    } else {
      raf = requestAnimationFrame(frame)
    }

    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
      renderer.destroy?.()
    }
    // theme/reduced are fixed within a site; siteId change rebuilds the renderer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, themeKey, reduced])

  return <canvas ref={canvasRef} className="ambient-canvas" aria-hidden="true" />
}
