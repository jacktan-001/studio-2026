import type { AmbientFactory } from '../types'
import { parseRgb } from '../util'

/**
 * JACK TALK (orange, podcast) — concentric broadcast rings emanating from
 * centre like a live "ON AIR" signal, AUDIO-REACTIVE.
 *
 * Mouse interaction: WATER RIPPLES.
 * The pointer is treated as a droplet hitting a still surface — each emission
 * drops a ripple whose centre is the cursor position at that instant, and the
 * ripple then expands outward on its own, decelerating and fading, trailed by
 * two fainter wavelets (the classic capillary-wave train). The ripple does NOT
 * follow the cursor afterwards: the cursor keeps moving, the wave stays where
 * it was born and keeps spreading. Nothing about the cursor itself is restyled.
 *
 * Emission is throttled by both time and travel distance so sweeping the mouse
 * leaves a readable trail of ripples instead of a continuous smear.
 */
export const broadcastRings: AmbientFactory = ({ ctx, theme, reduced }) => {
  const [ar, ag, ab] = parseRgb(theme.accentRgb)
  let w = 0
  let h = 0
  let cx = 0
  let cy = 0
  let maxR = 0

  interface Ring {
    r: number
    life: number
  }
  let rings: Ring[] = []
  let spawnAcc = 0

  /** A water ripple born at the cursor. */
  interface Drop {
    x: number
    y: number
    /** current crest radius */
    r: number
    /** expansion speed (px per 16.7ms), damped every frame */
    v: number
    /** 1 → 0 */
    life: number
    /** initial impact strength, from pointer speed */
    power: number
  }
  let drops: Drop[] = []

  // Emission throttles
  const DROP_COOLDOWN = 300 // ms between ripples
  const DROP_TRAVEL = 30 // px the cursor must travel between ripples
  const DROP_LIFE = 1750 // ms for a ripple to fully dissipate
  const MAX_DROPS = 9

  let dropAcc = 0
  let lastPx = 0
  let lastPy = 0
  let lastDropX = 0
  let lastDropY = 0
  let seeded = false
  let speedEase = 0

  const resize = (nw: number, nh: number) => {
    w = nw
    h = nh
    cx = w * 0.5
    cy = h * 0.5
    maxR = Math.hypot(w, h) * 0.6
  }

  const addDrop = (x: number, y: number, power: number) => {
    if (drops.length >= MAX_DROPS) drops.shift()
    drops.push({ x, y, r: 3, v: 3.4 + 2.2 * power, life: 1, power })
    lastDropX = x
    lastDropY = y
    dropAcc = 0
  }

  return {
    resize,
    draw({ dt, intensity, audio, playing, pointer }) {
      ctx.clearRect(0, 0, w, h)
      const a = 0.4 + 0.6 * intensity
      const lvl = playing ? audio.level : 0
      const bass = playing ? audio.bass : 0
      const active = !reduced && pointer.active

      // ── centre broadcast rings (ON AIR) ──────────────────────
      const cadence = reduced ? 0 : 900 - lvl * 620
      spawnAcc += dt
      if (spawnAcc >= cadence) {
        spawnAcc = 0
        rings.push({ r: 8, life: 1 })
      }

      const speed = (reduced ? 0 : 0.12 + bass * 0.5) * (0.5 + 0.5 * intensity)
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i]
        ring.r += (maxR * 0.018 + 60 * speed) * (dt / 16.7)
        ring.life = 1 - ring.r / maxR
        if (ring.life <= 0) {
          rings.splice(i, 1)
          continue
        }
        const o = ring.life * 0.32 * a
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${o})`
        ctx.lineWidth = 1.5 * ring.life + 0.4
        ctx.beginPath()
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // ── centre core pulse ────────────────────────────────────
      const core = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(performance.now() * 0.003)
      const cr = 4 + lvl * 10 + core * 3
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 3)
      grd.addColorStop(0, `rgba(${ar},${ag},${ab},${0.5 * a})`)
      grd.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(cx, cy, cr * 3, 0, Math.PI * 2)
      ctx.fill()

      // ── emit water ripples at the cursor ─────────────────────
      if (active) {
        if (!seeded) {
          seeded = true
          lastPx = pointer.x
          lastPy = pointer.y
          addDrop(pointer.x, pointer.y, 0.35) // first contact with the surface
        } else {
          const step = Math.hypot(pointer.x - lastPx, pointer.y - lastPy)
          lastPx = pointer.x
          lastPy = pointer.y
          speedEase += (Math.min(1, step / 26) - speedEase) * 0.16

          dropAcc += dt
          const travel = Math.hypot(pointer.x - lastDropX, pointer.y - lastDropY)
          if (dropAcc >= DROP_COOLDOWN && travel >= DROP_TRAVEL) {
            addDrop(pointer.x, pointer.y, 0.3 + 0.7 * speedEase)
          }
        }
      } else {
        seeded = false
        speedEase *= 0.9
      }

      // ── draw the ripples ─────────────────────────────────────
      const k = dt / 16.7
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.r += d.v * k
        d.v *= Math.pow(0.978, k) // water drag → the front slows as it spreads
        d.life -= dt / DROP_LIFE
        if (d.life <= 0) {
          drops.splice(i, 1)
          continue
        }

        // ease-out fade; the crest is brightest right after impact
        const e = d.life * d.life
        const base = (0.34 + 0.34 * d.power) * e * a

        // 1. leading crest
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${base})`
        ctx.lineWidth = 1.9 * e + 0.35
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.stroke()

        // 2. trailing wavelets — the capillary train behind the crest
        for (let n = 1; n <= 2; n++) {
          const rr = d.r - n * (13 + 7 * n)
          if (rr < 2) break
          ctx.strokeStyle = `rgba(${ar},${ag},${ab},${(base / (1 + n * 1.5)) * 0.9})`
          ctx.lineWidth = (1.3 * e) / n + 0.2
          ctx.beginPath()
          ctx.arc(d.x, d.y, rr, 0, Math.PI * 2)
          ctx.stroke()
        }

        // 3. impact dimple: a soft disc that collapses as the wave leaves
        if (d.life > 0.55) {
          const q = (d.life - 0.55) / 0.45
          const gr = 26 * q + 6
          const gg = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, gr)
          gg.addColorStop(0, `rgba(${ar},${ag},${ab},${0.2 * q * a})`)
          gg.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
          ctx.fillStyle = gg
          ctx.beginPath()
          ctx.arc(d.x, d.y, gr, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
  }
}
