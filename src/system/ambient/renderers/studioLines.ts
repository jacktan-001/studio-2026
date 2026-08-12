import type { AmbientFactory } from '../types'

/**
 * PORTAL — "Jack Tan Studio" colourful flowing lines.
 *
 * A drifting field of nodes linked by MULTI-HUE strands. It is deliberately
 * polychromatic so it reads as the studio itself (many lights) rather than any
 * one sub-site accent colour — pose is pink, wave is cyan, talk is orange,
 * craft is emerald, tan is violet; the portal owns all of them at once.
 *
 * The cursor is a disturbance: nearby strands are pushed aside and swirled, and
 * the links/nodes around it light up — so the whole backdrop reacts to the
 * mouse. This is the portal effect that was previously missing: the old
 * `constellation` renderer ignored the pointer entirely.
 */
export const studioLines: AmbientFactory = ({ ctx, reduced }) => {
  let w = 0
  let h = 0

  // Vibrant spectrum — spans many hues so the field is genuinely "colourful".
  const HUES = [188, 205, 222, 260, 285, 312, 338, 18, 45, 95, 150]

  interface Node {
    x: number
    y: number
    vx: number
    vy: number
    r: number
    ph: number
    hue: number
  }
  let nodes: Node[] = []

  const seed = () => {
    const n = Math.min(84, Math.max(32, Math.round((w * h) / 21000)))
    nodes = []
    for (let i = 0; i < n; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.13,
        vy: (Math.random() - 0.5) * 0.13,
        r: Math.random() * 1.5 + 0.7,
        ph: Math.random() * Math.PI * 2,
        hue: HUES[i % HUES.length],
      })
    }
  }

  const LINK = 170
  const PULL = 200 // pointer influence radius, in css px

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      seed()
    },
    draw({ t, dt, intensity, pointer }) {
      ctx.clearRect(0, 0, w, h)
      const k = Math.min(2.2, (dt || 16) / 16)
      const speed = 0.35 + 0.65 * intensity
      const a = 0.3 + 0.7 * intensity
      const time = t * 0.001

      const px = pointer.active ? pointer.x : -99999
      const py = pointer.active ? pointer.y : -99999

      // advance drift
      for (const nd of nodes) {
        nd.x += nd.vx * speed * k
        nd.y += nd.vy * speed * k
        if (nd.x < -24) nd.x = w + 24
        if (nd.x > w + 24) nd.x = -24
        if (nd.y < -24) nd.y = h + 24
        if (nd.y > h + 24) nd.y = -24
      }

      // render positions — pointer pushes strands aside + swirls them.
      // Offset only (no state mutation) so nodes never stick to the cursor.
      const rx = new Float32Array(nodes.length)
      const ry = new Float32Array(nodes.length)
      for (let i = 0; i < nodes.length; i++) {
        let ox = 0
        let oy = 0
        if (pointer.active) {
          const dx = nodes[i].x - px
          const dy = nodes[i].y - py
          const d2 = dx * dx + dy * dy
          if (d2 < PULL * PULL) {
            const d = Math.sqrt(d2) || 1
            const f = 1 - d / PULL
            const push = f * f * 26
            ox = (dx / d) * push + (-dy / d) * f * 12
            oy = (dy / d) * push + (dx / d) * f * 12
          }
        }
        rx[i] = nodes[i].x + ox
        ry[i] = nodes[i].y + oy
      }

      // colourful links
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = rx[i] - rx[j]
          const dy = ry[i] - ry[j]
          const d2 = dx * dx + dy * dy
          if (d2 < LINK * LINK) {
            const d = Math.sqrt(d2)
            const prox = 1 - d / LINK
            let boost = 0
            if (pointer.active) {
              const mx = (rx[i] + rx[j]) / 2
              const my = (ry[i] + ry[j]) / 2
              const mdx = mx - px
              const mdy = my - py
              const md = Math.sqrt(mdx * mdx + mdy * mdy)
              boost = Math.max(0, 1 - md / PULL) * 0.7
            }
            const o = (prox * 0.2 + boost) * a
            if (o <= 0.004) continue
            const hue = (nodes[i].hue + nodes[j].hue) / 2
            ctx.strokeStyle = `hsla(${hue}, 88%, 64%, ${o})`
            ctx.beginPath()
            ctx.moveTo(rx[i], ry[i])
            ctx.lineTo(rx[j], ry[j])
            ctx.stroke()
          }
        }
      }

      // node glows
      for (let i = 0; i < nodes.length; i++) {
        const nd = nodes[i]
        const p = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(time * 1.2 + nd.ph)
        let boost = 0
        if (pointer.active) {
          const ddx = rx[i] - px
          const ddy = ry[i] - py
          const dd = Math.sqrt(ddx * ddx + ddy * ddy)
          boost = Math.max(0, 1 - dd / PULL) * 0.55
        }
        const o = (0.2 + 0.5 * p + boost) * a
        const r = nd.r * (1 + 0.3 * p + boost)
        const grd = ctx.createRadialGradient(rx[i], ry[i], 0, rx[i], ry[i], r * 7)
        grd.addColorStop(0, `hsla(${nd.hue}, 92%, 66%, ${o})`)
        grd.addColorStop(1, `hsla(${nd.hue}, 92%, 66%, 0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(rx[i], ry[i], r * 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `hsla(${nd.hue}, 96%, 74%, ${Math.min(1, o + 0.22)})`
        ctx.beginPath()
        ctx.arc(rx[i], ry[i], r, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}
