import type { AmbientFactory } from '../types'
import { parseRgb } from '../util'

/**
 * JACK NOTES (gold, journal) — drifting golden motes, like ink-dust or embers
 * rising slowly through lamplight. Calm and literary, with a gentle pointer
 * pull. Reuses the shared AmbientFactory contract and is tinted by the gold
 * theme automatically (theme.accent / theme.accent2), so it stays consistent
 * with the rest of the global ambient system.
 */
export const goldenDrift: AmbientFactory = ({ ctx, theme, reduced }) => {
  const [ar, ag, ab] = parseRgb(theme.accentRgb)
  const [br, bg2, bb] = parseRgb(theme.accent2Rgb)
  let w = 0
  let h = 0

  interface Mote {
    x: number
    y: number
    r: number
    vx: number
    vy: number
    /** 0 = primary gold, 1 = light gold */
    c: 0 | 1
    /** twinkle phase */
    tw: number
  }
  let motes: Mote[] = []

  const seed = () => {
    const n = Math.min(48, Math.max(24, Math.round((w * h) / 40000)))
    motes = []
    for (let i = 0; i < n; i++) {
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + 0.8,
        // slow upward drift
        vy: -(Math.random() * 0.18 + 0.05),
        vx: (Math.random() - 0.5) * 0.12,
        c: Math.random() > 0.5 ? 0 : 1,
        tw: Math.random() * Math.PI * 2,
      })
    }
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      seed()
    },
    draw({ t, intensity, pointer }) {
      ctx.clearRect(0, 0, w, h)
      const a = 0.32 + 0.55 * intensity
      const focus = !reduced && pointer.active

      for (const m of motes) {
        if (focus) {
          // soft attraction toward the cursor, like motes drawn to a flame
          const dx = pointer.x - m.x
          const dy = pointer.y - m.y
          const d = Math.hypot(dx, dy) + 0.0001
          const pull = d > 120 ? 0.012 * Math.min(1, 200 / d) : -0.02
          m.vx += (dx / d) * pull
          m.vy += (dy / d) * pull
          m.vx *= 0.94
          m.vy *= 0.94
        } else {
          m.vx *= 0.98
          // keep a gentle upward bias when released
          if (m.vy > -0.04) m.vy -= 0.001
        }

        m.x += m.vx * (0.4 + 0.6 * intensity)
        m.y += m.vy * (0.4 + 0.6 * intensity)

        // wrap around edges
        if (m.y < -12) {
          m.y = h + 12
          m.x = Math.random() * w
        }
        if (m.x < -12) m.x = w + 12
        if (m.x > w + 12) m.x = -12

        const tw = reduced ? 1 : 0.6 + 0.4 * Math.sin(t * 0.002 + m.tw)
        const [cr, cg, cb] = m.c === 0 ? [ar, ag, ab] : [br, bg2, bb]
        const halo = m.r * (4 + tw * 2)
        const grd = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, halo)
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},${(0.5 + tw * 0.3) * a})`)
        grd.addColorStop(0.5, `rgba(${cr},${cg},${cb},${(0.16 + tw * 0.1) * a})`)
        grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(m.x, m.y, halo, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}
