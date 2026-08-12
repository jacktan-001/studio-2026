import type { AmbientFactory } from '../types'
import { parseRgb } from '../util'

/**
 * JACK WAVE (cyan, music) — aurora-like flowing sine ribbons, AUDIO-REACTIVE.
 * Bass drives amplitude, treble drives frequency; a soft glow band swells with
 * overall level. When the global bed is paused it falls back to a calm idle
 * swell so the canvas is never dead.
 *
 * Mouse interaction — deliberately GENTLE.
 * The first pass reacted on every frame at full strength, which read as nervous
 * jitter. Now the response is damped on three axes:
 *   1. position — the cursor is followed by a heavily eased proxy (EASE), so
 *      fast flicks never snap the ribbons around;
 *   2. strength — a `hoverEnergy` envelope fades the effect in and out instead
 *      of switching it on the moment the pointer crosses the band;
 *   3. frequency — ripples only spawn every SPAWN_MS *and* only after the
 *      cursor has travelled MIN_TRAVEL px, so idling in place stops emitting.
 * Amplitudes and ripple opacity are roughly a third of the original.
 */
export const waveRibbons: AmbientFactory = ({ ctx, theme, reduced }) => {
  const [ar, ag, ab] = parseRgb(theme.accentRgb)
  const [br, bg2, bb] = parseRgb(theme.accent2Rgb)
  let w = 0
  let h = 0
  const RIBBONS = 4
  const HOVER_BAND = 96 // wider band, but the falloff is much softer
  const SIGMA = 130 // broader gaussian → a swell rather than a spike

  // Damping constants
  const EASE = 0.045 // cursor proxy follow rate per frame
  const ENV_IN = 0.028 // hover energy ramp up
  const ENV_OUT = 0.02 // hover energy ramp down
  const SPAWN_MS = 460 // was 140 — ~3.3× fewer ripples
  const MIN_TRAVEL = 26 // px the cursor must move before a new ripple
  const MAX_RIPPLES = 7

  interface Ripple {
    x: number
    y: number
    r: number
    life: number
  }
  let ripples: Ripple[] = []
  let spawnAcc = 0

  // Eased cursor proxy + travel bookkeeping
  let px = 0
  let py = 0
  let seeded = false
  let lastSpawnX = 0
  let lastSpawnY = 0
  let hoverEnergy = 0

  return {
    resize(nw, nh) {
      w = nw
      h = nh
    },
    draw({ t, dt, intensity, audio, playing, pointer }) {
      ctx.clearRect(0, 0, w, h)
      const a = 0.4 + 0.6 * intensity
      const lvl = playing ? audio.level : 0
      const bass = playing ? audio.bass : 0
      const treble = playing ? audio.treble : 0

      const baseAmp = (reduced ? 16 : 24) * (1 + 1.7 * bass) * (0.5 + 0.5 * intensity)
      const baseFreq = 0.0016 + treble * 0.0045

      const H = h
      const live = !reduced && pointer.active

      // ── 1. eased cursor proxy ────────────────────────────────
      if (live) {
        if (!seeded) {
          px = pointer.x
          py = pointer.y
          lastSpawnX = px
          lastSpawnY = py
          seeded = true
        } else {
          px += (pointer.x - px) * EASE
          py += (pointer.y - py) * EASE
        }
      } else {
        seeded = false
      }

      // ── 2. hover energy envelope ─────────────────────────────
      hoverEnergy += ((live ? 1 : 0) - hoverEnergy) * (live ? ENV_IN : ENV_OUT)
      if (hoverEnergy < 0.002) hoverEnergy = 0
      const energy = hoverEnergy * hoverEnergy // ease-in curve, softer onset

      // ── 3. low-frequency ripple emission ─────────────────────
      if (live && energy > 0.25) {
        spawnAcc += dt
        const travel = Math.hypot(px - lastSpawnX, py - lastSpawnY)
        if (spawnAcc >= SPAWN_MS && travel >= MIN_TRAVEL) {
          spawnAcc = 0
          lastSpawnX = px
          lastSpawnY = py
          // Emit on the single nearest ribbon only (was: every ribbon in range).
          let best = -1
          let bestD = Infinity
          for (let r = 0; r < RIBBONS; r++) {
            const d = Math.abs(py - H * (0.32 + r * 0.13))
            if (d < bestD) {
              bestD = d
              best = r
            }
          }
          if (best >= 0 && bestD < HOVER_BAND && ripples.length < MAX_RIPPLES) {
            ripples.push({ x: px, y: H * (0.32 + best * 0.13), r: 4, life: 1 })
          }
        }
      } else {
        spawnAcc = 0
      }

      for (let r = 0; r < RIBBONS; r++) {
        const yBase = H * (0.32 + r * 0.13)
        const amp = baseAmp * (1 - r * 0.13)
        const freq = baseFreq * (1 + r * 0.18)
        const phase = t * 0.0006 * (1 + r * 0.2) + r
        const col = r % 2 === 0 ? [ar, ag, ab] : [br, bg2, bb]

        // Smooth (cosine) proximity instead of a hard cutoff — no popping when
        // the cursor crosses the band edge.
        const dy = Math.abs(py - yBase)
        const raw = dy < HOVER_BAND ? 0.5 + 0.5 * Math.cos((dy / HOVER_BAND) * Math.PI) : 0
        const prox = raw * energy
        const nudged = prox > 0.004

        ctx.beginPath()
        for (let x = 0; x <= w; x += 6) {
          let y =
            yBase +
            Math.sin(x * freq + phase) * amp +
            Math.sin(x * freq * 0.5 + phase * 1.7) * amp * 0.4
          // Gentle local swell around the cursor: ~1/3 the old amplitude and
          // roughly half the temporal/spatial frequency → a breathe, not a shake.
          if (nudged) {
            const g = Math.exp(-((x - px) ** 2) / (2 * SIGMA * SIGMA))
            y += Math.sin(t * 0.0085 + x * 0.026) * (2.5 + 8 * prox) * g
          }
          // ripples riding the wave (skip far ones — the gaussian is ~0 there)
          for (let k = 0; k < ripples.length; k++) {
            const rp = ripples[k]
            const dx = x - rp.x
            if (dx < -380 || dx > 380) continue
            const g = Math.exp(-(dx * dx) / (2 * 150 * 150))
            y += Math.sin(t * 0.013 + dx * 0.022) * 6 * rp.life * g
          }
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${(0.5 + 0.12 * prox) * a})`
        ctx.lineWidth = 1.6 + 0.5 * prox
        ctx.stroke()
      }

      // Expanding ripple rings — slower, fainter, longer-lived.
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        rp.r += 0.11 * dt
        rp.life = 1 - rp.r / 300
        if (rp.life <= 0) {
          ripples.splice(i, 1)
          continue
        }
        const o = rp.life * rp.life * 0.2 * a
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${o})`
        ctx.lineWidth = 0.9 * rp.life + 0.25
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (lvl > 0.02) {
        const g = ctx.createLinearGradient(0, 0, w, 0)
        g.addColorStop(0, `rgba(${ar},${ag},${ab},0)`)
        g.addColorStop(0.5, `rgba(${br},${bg2},${bb},${0.06 * lvl * a})`)
        g.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
        ctx.fillStyle = g
        ctx.fillRect(0, H * 0.3, w, H * 0.4)
      }
    },
  }
}
