import type { AmbientFactory } from '../types'
import { parseRgb } from '../util'

/**
 * JACK NOTES (gold) — electric-current ambience.
 *
 * Golden flowing light-lines sweep across the viewport like slow arcs of
 * current, tiny sparks travel along them, and warm motes drift upward.
 * The cursor acts as a charged node: nearby streams brighten and warp,
 * motes are gently pulled, and a soft aurora glow follows the pointer.
 *
 * Under reduced-motion the lines become static and the spark travel is
 * disabled, leaving only the calm golden field.
 */
export const goldenDrift: AmbientFactory = ({ ctx, theme, reduced }) => {
  const [ar, ag, ab] = parseRgb(theme.accentRgb)
  const [br, bg2, bb] = parseRgb(theme.accent2Rgb)
  let w = 0
  let h = 0

  const STREAMS = 6
  interface Stream {
    y: number
    phase: number
    speed: number
    amp: number
    freq: number
    alpha: number
    width: number
  }
  let streams: Stream[] = []

  interface Spark {
    streamIdx: number
    pos: number
    speed: number
    size: number
    life: number
  }
  let sparks: Spark[] = []

  interface Mote {
    x: number
    y: number
    r: number
    vx: number
    vy: number
    c: 0 | 1
    tw: number
  }
  let motes: Mote[] = []

  const makeSpark = (): Spark => ({
    streamIdx: Math.floor(Math.random() * STREAMS),
    pos: Math.random(),
    speed: 0.00025 + Math.random() * 0.00045,
    size: Math.random() * 1.6 + 0.7,
    life: Math.random() * Math.PI * 2,
  })

  const seed = () => {
    streams = []
    for (let i = 0; i < STREAMS; i++) {
      streams.push({
        y: (h / (STREAMS + 1)) * (i + 1) + (Math.random() - 0.5) * 48,
        phase: Math.random() * Math.PI * 2,
        speed: 0.00025 + Math.random() * 0.00035,
        amp: 18 + Math.random() * 34,
        freq: 0.0018 + Math.random() * 0.0024,
        alpha: 0.1 + Math.random() * 0.14,
        width: 1 + Math.random() * 1.2,
      })
    }

    sparks = []
    const sparkCount = reduced ? 0 : Math.min(16, Math.max(8, Math.round(w / 90)))
    for (let i = 0; i < sparkCount; i++) sparks.push(makeSpark())

    const n = Math.min(38, Math.max(18, Math.round((w * h) / 52000)))
    motes = []
    for (let i = 0; i < n; i++) {
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.5,
        vy: -(Math.random() * 0.12 + 0.04),
        vx: (Math.random() - 0.5) * 0.1,
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
      // light trail so previous frames ghost away
      ctx.fillStyle = 'rgba(8,8,10,0.16)'
      ctx.fillRect(0, 0, w, h)

      const focus = !reduced && pointer.active
      const globalAlpha = 0.25 + 0.75 * intensity

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      // ── flowing current streams ───────────────────────────────────────
      for (const s of streams) {
        // cursor warps nearby streams vertically
        let cursorWarp = 0
        if (focus) {
          const dy = pointer.y - s.y
          const f = Math.max(0, 1 - Math.abs(dy) / 220) * Math.max(0, 1 - Math.abs(pointer.x - w * 0.5) / (w * 0.6))
          cursorWarp = Math.sin(t * 0.004 + s.phase) * 22 * f
        }

        const baseY = s.y + cursorWarp

        // primary gold line
        ctx.beginPath()
        for (let x = 0; x <= w; x += 7) {
          const localT = t * s.speed + s.phase + x * s.freq
          const y = baseY + Math.sin(localT) * s.amp + Math.sin(localT * 2.1) * s.amp * 0.32
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.shadowBlur = 18 * intensity
        ctx.shadowColor = `rgba(${ar},${ag},${ab},0.42)`
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${s.alpha * globalAlpha})`
        ctx.lineWidth = s.width
        ctx.stroke()

        // inner bright core
        ctx.beginPath()
        for (let x = 0; x <= w; x += 7) {
          const localT = t * s.speed + s.phase + x * s.freq
          const y = baseY + Math.sin(localT) * s.amp + Math.sin(localT * 2.1) * s.amp * 0.32
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.shadowBlur = 4 * intensity
        ctx.shadowColor = `rgba(${br},${bg2},${bb},0.45)`
        ctx.strokeStyle = `rgba(${br},${bg2},${bb},${s.alpha * 0.55 * globalAlpha})`
        ctx.lineWidth = s.width * 0.45
        ctx.stroke()
      }

      // ── sparks riding the current ─────────────────────────────────────
      if (!reduced) {
        for (const sp of sparks) {
          const s = streams[sp.streamIdx]
          const localT = t * s.speed + s.phase + sp.pos * w * s.freq
          const x = sp.pos * w
          const y = s.y + Math.sin(localT) * s.amp

          sp.pos += sp.speed * (1 + 0.5 * intensity)
          if (sp.pos > 1) {
            sp.pos = 0
            sp.streamIdx = Math.floor(Math.random() * STREAMS)
          }

          const pulse = 0.5 + 0.5 * Math.sin(t * 0.008 + sp.life)
          ctx.shadowBlur = 10 * intensity
          ctx.shadowColor = `rgba(${br},${bg2},${bb},0.55)`
          ctx.fillStyle = `rgba(${br},${bg2},${bb},${pulse * globalAlpha})`
          ctx.beginPath()
          ctx.arc(x, y, sp.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── drifting motes ────────────────────────────────────────────────
      for (const m of motes) {
        if (focus) {
          const dx = pointer.x - m.x
          const dy = pointer.y - m.y
          const d = Math.hypot(dx, dy) + 0.0001
          const pull = d > 110 ? 0.008 * Math.min(1, 150 / d) : -0.018
          m.vx += (dx / d) * pull
          m.vy += (dy / d) * pull
          m.vx *= 0.94
          m.vy *= 0.94
        } else {
          m.vx *= 0.98
          if (m.vy > -0.04) m.vy -= 0.001
        }

        m.x += m.vx * (0.4 + 0.6 * intensity)
        m.y += m.vy * (0.4 + 0.6 * intensity)

        if (m.y < -12) {
          m.y = h + 12
          m.x = Math.random() * w
        }
        if (m.x < -12) m.x = w + 12
        if (m.x > w + 12) m.x = -12

        const tw = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * 0.002 + m.tw)
        const [cr, cg, cb] = m.c === 0 ? [ar, ag, ab] : [br, bg2, bb]
        const halo = m.r * (3.2 + tw * 1.6)
        const grd = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, halo)
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},${(0.42 + tw * 0.22) * globalAlpha})`)
        grd.addColorStop(0.55, `rgba(${cr},${cg},${cb},${(0.1 + tw * 0.07) * globalAlpha})`)
        grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.shadowBlur = 0
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(m.x, m.y, halo, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── cursor aurora ─────────────────────────────────────────────────
      if (focus) {
        const grd = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 170)
        grd.addColorStop(0, `rgba(${ar},${ag},${ab},${0.16 * globalAlpha})`)
        grd.addColorStop(0.45, `rgba(${br},${bg2},${bb},${0.06 * globalAlpha})`)
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.shadowBlur = 28 * intensity
        ctx.shadowColor = `rgba(${ar},${ag},${ab},0.32)`
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(pointer.x, pointer.y, 170, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    },
  }
}
