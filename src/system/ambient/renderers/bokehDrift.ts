import type { AmbientFactory } from '../types'
import { parseRgb } from '../util'

/**
 * JACK POSE (pink, social long-image tool) — soft, blurred floating bokeh orbs
 * drifting like a moodboard. Deliberately NOT a hard colour block: gentle,
 * dreamy, editorial. Reads as floating image thumbnails in soft focus.
 */
export const bokehDrift: AmbientFactory = ({ ctx, theme, reduced }) => {
  const [ar, ag, ab] = parseRgb(theme.accentRgb)
  const [br, bg2, bb] = parseRgb(theme.accent2Rgb)
  let w = 0
  let h = 0

  interface Orb {
    x: number
    y: number
    r: number
    vx: number
    vy: number
    /** idle drift the orb returns to once the cursor lets go */
    ivx: number
    ivy: number
    c: 0 | 1
    ph: number
  }
  let orbs: Orb[] = []

  const seed = () => {
    const n = Math.min(16, Math.max(8, Math.round((w * h) / 120000)))
    orbs = []
    for (let i = 0; i < n; i++) {
      const ivx = (Math.random() - 0.5) * 0.16
      const ivy = (Math.random() - 0.5) * 0.13
      orbs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 170 + 100,
        vx: ivx,
        vy: ivy,
        ivx,
        ivy,
        c: Math.random() > 0.5 ? 0 : 1,
        ph: Math.random() * Math.PI * 2,
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
      const a = 0.4 + 0.6 * intensity
      const speed = 0.4 + 0.6 * intensity
      const focus = !reduced && pointer.active

      for (const o of orbs) {
        // Background light spots drift toward the area the cursor hovers and
        // brighten there — forming a soft visual focus that follows the mouse.
        if (focus) {
          const dx = pointer.x - o.x
          const dy = pointer.y - o.y
          const d = Math.hypot(dx, dy) + 0.0001
          const ux = dx / d
          const uy = dy / d
          // attract from afar, hold a soft halo instead of stacking on the dot
          const pull = d > 150 ? 0.05 * Math.min(1, 260 / d) : -0.035
          o.vx += ux * pull
          o.vy += uy * pull
          // gentle damping so orbs settle instead of oscillating forever
          o.vx *= 0.96
          o.vy *= 0.96
          const sp = Math.hypot(o.vx, o.vy)
          if (sp > 1.6) {
            o.vx = (o.vx / sp) * 1.6
            o.vy = (o.vy / sp) * 1.6
          }
        } else {
          // released → ease back to the original lazy drift
          o.vx += (o.ivx - o.vx) * 0.02
          o.vy += (o.ivy - o.vy) * 0.02
        }

        o.x += o.vx * speed
        o.y += o.vy * speed
        if (o.x < -o.r) o.x = w + o.r
        if (o.x > w + o.r) o.x = -o.r
        if (o.y < -o.r) o.y = h + o.r
        if (o.y > h + o.r) o.y = -o.r

        const breath = reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 0.0006 + o.ph)
        const [cr, cg, cb] = o.c === 0 ? [ar, ag, ab] : [br, bg2, bb]

        // proximity to the cursor → brighter + larger (focus highlight)
        let focusBoost = 0
        if (focus) {
          const d = Math.hypot(pointer.x - o.x, pointer.y - o.y)
          focusBoost = Math.max(0, 1 - d / 320)
        }
        const rr = o.r * breath * (1 + focusBoost * 0.28)
        const grd = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rr)
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},${(0.16 + focusBoost * 0.22) * a})`)
        grd.addColorStop(0.6, `rgba(${cr},${cg},${cb},${(0.06 + focusBoost * 0.1) * a})`)
        grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(o.x, o.y, rr, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}
