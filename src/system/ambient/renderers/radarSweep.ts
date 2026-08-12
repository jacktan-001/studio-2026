import type { AmbientFactory } from '../types'
import { parseRgb } from '../util'

/**
 * JACK TAN (violet, aviation-safety) — a precise blueprint grid with a slow
 * sonar sweep rotating out from centre. Differentiates from Portal's organic
 * network via hard engineering lines + a deliberate scanning beam.
 *
 * Pointer interaction: the light source drifts toward the cursor and the beam
 * locks onto the cursor bearing, so the searchlight "aims" wherever the mouse
 * goes. On pointer-leave it eases back to centre and resumes free rotation.
 */
export const radarSweep: AmbientFactory = ({ ctx, theme, reduced }) => {
  const [ar, ag, ab] = parseRgb(theme.accentRgb)
  let w = 0
  let h = 0
  let cx = 0
  let cy = 0
  let R = 0

  // eased light-source position + beam bearing
  let ox = 0
  let oy = 0
  let ang = 0
  let lock = 0 // 0 = free rotation, 1 = fully locked to cursor

  const resize = (nw: number, nh: number) => {
    w = nw
    h = nh
    cx = w * 0.5
    cy = h * 0.5
    R = Math.max(w, h) * 0.62
    if (ox === 0 && oy === 0) {
      ox = cx
      oy = cy
    }
  }

  const TAU = Math.PI * 2
  const wrap = (v: number) => ((v + Math.PI) % TAU + TAU) % TAU - Math.PI

  return {
    resize,
    draw({ t, dt, intensity, pointer }) {
      ctx.clearRect(0, 0, w, h)
      const a = 0.35 + 0.65 * intensity
      const live = !reduced && pointer.active

      // ---- light source follows the cursor (partial pull keeps composition) --
      const tx = live ? cx + (pointer.x - cx) * 0.34 : cx
      const ty = live ? cy + (pointer.y - cy) * 0.34 : cy
      const k = Math.min(1, (dt || 16) * 0.005)
      ox += (tx - ox) * k
      oy += (ty - oy) * k
      lock += ((live ? 1 : 0) - lock) * Math.min(1, (dt || 16) * 0.004)

      // ---- beam bearing: aim at the cursor, or free-rotate when idle --------
      const speed = reduced ? 0 : 0.0006 + 0.0006 * intensity
      if (live) {
        const target = Math.atan2(pointer.y - oy, pointer.x - ox)
        ang += wrap(target - ang) * Math.min(1, (dt || 16) * 0.006)
      } else {
        ang += (dt || 16) * speed
      }
      ang = ((ang % TAU) + TAU) % TAU

      // ---- blueprint grid (anchored to the moving light source) -------------
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.05 * a})`
      ctx.lineWidth = 1
      const step = 64
      ctx.beginPath()
      for (let x = ox % step; x < w; x += step) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
      }
      for (let y = oy % step; y < h; y += step) {
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
      }
      ctx.stroke()

      // ---- concentric range rings ------------------------------------------
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.06 * a})`
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(ox, oy, (R / 4) * i, 0, TAU)
        ctx.stroke()
      }

      // ---- sweep beam -------------------------------------------------------
      // narrows + brightens while locked onto the pointer
      const wedge = 0.5 - 0.16 * lock
      const sweepLen = R
      ctx.save()
      ctx.translate(ox, oy)
      ctx.rotate(ang - wedge * 0.5)
      const g = ctx.createLinearGradient(0, 0, sweepLen, 0)
      g.addColorStop(0, `rgba(${ar},${ag},${ab},${(0.3 + 0.16 * lock) * a})`)
      g.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, sweepLen, 0, wedge)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${(0.5 + 0.2 * lock) * a})`
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(
        Math.cos(wedge * 0.5) * sweepLen,
        Math.sin(wedge * 0.5) * sweepLen,
      )
      ctx.stroke()
      ctx.restore()

      // ---- source flare + illuminated target spot ---------------------------
      if (lock > 0.01) {
        const flare = ctx.createRadialGradient(ox, oy, 0, ox, oy, 120)
        flare.addColorStop(0, `rgba(${ar},${ag},${ab},${0.16 * lock * a})`)
        flare.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
        ctx.fillStyle = flare
        ctx.beginPath()
        ctx.arc(ox, oy, 120, 0, TAU)
        ctx.fill()

        const px = pointer.x
        const py = pointer.y
        const spot = ctx.createRadialGradient(px, py, 0, px, py, 150)
        spot.addColorStop(0, `rgba(${ar},${ag},${ab},${0.14 * lock * a})`)
        spot.addColorStop(0.5, `rgba(${ar},${ag},${ab},${0.05 * lock * a})`)
        spot.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
        ctx.fillStyle = spot
        ctx.beginPath()
        ctx.arc(px, py, 150, 0, TAU)
        ctx.fill()

        // reticle at the illuminated point
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.004)
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${0.32 * lock * a * pulse})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(px, py, 20 + 4 * pulse, 0, TAU)
        ctx.moveTo(px - 30, py)
        ctx.lineTo(px - 12, py)
        ctx.moveTo(px + 12, py)
        ctx.lineTo(px + 30, py)
        ctx.moveTo(px, py - 30)
        ctx.lineTo(px, py - 12)
        ctx.moveTo(px, py + 12)
        ctx.lineTo(px, py + 30)
        ctx.stroke()
      }
    },
  }
}
