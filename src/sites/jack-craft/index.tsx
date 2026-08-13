import { useEffect, useRef } from 'react'
import { SplitHeading } from '../../system/SplitHeading'
import { Reveal } from '../../system/Reveal'
import { PinnedChapter } from '../../system/PinnedChapter'
import { TransitionLink } from '../../system/transition'
import { ContactBar } from '../../system/ContactBar'
import { SiteAvatar } from '../../system/avatars'
import { SiteBadge } from '../../system/SiteBadge'
import { useMotionPrefs } from '../../core/MotionPrefsProvider'

const STATS = [
  { num: '120+', label: '生成作品' },
  { num: '9', label: '收录系列' },
  { num: '4', label: '展出项目' },
  { num: 'WebGL', label: '实时渲染' },
]

const COLLECTIONS = [
  { id: 'FLUX', title: '流场', medium: 'Canvas Flow-field', year: '2025', note: '上千粒子顺着噪声场流动，留下被时间擦淡的轨迹。' },
  { id: 'GRID', title: '格律', medium: 'Shader Grid', year: '2025', note: '把网格当作乐器，让频率在像素之间共振。' },
  { id: 'SEED', title: '种子', medium: 'L-System', year: '2026', note: '一条规则，递归生长出整片不重复的森林。' },
  { id: 'NOISE', title: '噪声', medium: 'Perlin Study', year: '2026', note: '关于随机如何假装成自然的一次长期练习。' },
]

const PROCESS = [
  { k: 'RULE', t: '一条规则', d: '先写下最简单的约束，让它成为唯一的主宰。' },
  { k: 'SEED', t: '一颗种子', d: '一个随机数，或一段坐标，决定了全部走向。' },
  { k: 'RENDER', t: '实时渲染', d: '用 WebGL 在浏览器里跑起来，每一帧都是新作品。' },
  { k: 'CAPTURE', t: '定格收藏', d: '觉得好看的某一帧，截下来，成为一件藏品。' },
]

const EXHIBITIONS = [
  { year: '2026', title: '静默生成', place: '线上个展 · studio-2026' },
  { year: '2025', title: '流动的边界', place: ' generative art 群展' },
  { year: '2025', title: '代码即笔触', place: ' 数字艺术联展' },
  { year: '2024', title: '随机的形状', place: ' 个人作品集首发' },
]

/**
 * Holographic gallery backdrop: iridescent particle flow-field on 2D canvas.
 * Particles cycle through violet→indigo→blue→cyan based on position + time,
 * creating a shimmering holographic gallery effect. Under reduced-motion
 * it draws ~36 static frames and stops — no loop.
 */
function GenerativeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { reduced } = useMotionPrefs()

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const N = 820
    const px = new Float32Array(N)
    const py = new Float32Array(N)
    const life = new Float32Array(N)
    let w = 0
    let h = 0
    let dpr = 1
    let raf = 0
    let running = false

    // Iridescence palette: teal → emerald → spring green → lime
    // (emerald family — Jack Craft's exclusive hue in the studio directory)
    const holo = (norm: number): string => {
      const t = ((norm % 1) + 1) % 1
      if (t < 0.33) {
        const s = t / 0.33
        return `rgb(${Math.round(13 + 3*s)},${Math.round(148 + 37*s)},${Math.round(136 - 7*s)})`
      } else if (t < 0.66) {
        const s = (t - 0.33) / 0.33
        return `rgb(${Math.round(16 + 36*s)},${Math.round(185 + 26*s)},${Math.round(129 + 24*s)})`
      } else {
        const s = (t - 0.66) / 0.34
        return `rgb(${Math.round(52 + 111*s)},${Math.round(211 + 19*s)},${Math.round(153 - 100*s)})`
      }
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = canvas.getBoundingClientRect()
      w = Math.max(1, r.width)
      h = Math.max(1, r.height)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#07060d'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < N; i++) {
        px[i] = Math.random() * w
        py[i] = Math.random() * h
        life[i] = Math.random()
      }
    }

    const angle = (x: number, y: number, t: number) =>
      (Math.sin(x * 0.0022 + t * 0.0003) +
        Math.cos(y * 0.0022 - t * 0.00021) +
        Math.sin((x + y) * 0.0012 + t * 0.0004)) *
      Math.PI

    // ---- pointer interaction state ---------------------------------------
    let mx = -9999
    let my = -9999
    let active = false
    let mvx = 0 // smoothed pointer velocity (px / event)
    let mvy = 0
    let energy = 0 // 0..1 disturbance energy derived from pointer speed
    let lastMx = 0
    let lastMy = 0
    let hasLast = false

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const nx = e.clientX - r.left
      const ny = e.clientY - r.top
      if (hasLast) {
        mvx = mvx * 0.55 + (nx - lastMx) * 0.45
        mvy = mvy * 0.55 + (ny - lastMy) * 0.45
      }
      lastMx = nx
      lastMy = ny
      hasLast = true
      mx = nx
      my = ny
      // generous margin so the field keeps reacting just outside the hero
      active = nx > -180 && ny > -180 && nx < r.width + 180 && ny < r.height + 180
    }
    const onLeave = () => {
      active = false
      hasLast = false
    }

    // fused-particle buffers (rebuilt每帧, additive pass near the cursor)
    const fx: number[] = []
    const fy: number[] = []
    const fp: number[] = []
    const ff: number[] = []

    let t = 0
    const draw = () => {
      ctx.fillStyle = 'rgba(7,6,13,0.035)'
      ctx.fillRect(0, 0, w, h)

      // pointer energy easing + velocity decay
      const speed = Math.hypot(mvx, mvy)
      const targetE = active ? Math.min(1, speed / 26) : 0
      energy += (targetE - energy) * 0.1
      mvx *= 0.86
      mvy *= 0.86
      const RAD = 150 + 120 * energy
      const RAD2 = RAD * RAD
      fx.length = 0
      fy.length = 0
      fp.length = 0
      ff.length = 0

      ctx.lineWidth = 1.1
      ctx.beginPath()
      for (let i = 0; i < N; i++) {
        const a = angle(px[i], py[i], t)
        let nx = px[i] + Math.cos(a) * 1.4
        let ny = py[i] + Math.sin(a) * 1.4
        const phase = (px[i] / w + py[i] / h + t * 0.00008) % 1

        if (active) {
          const dx = px[i] - mx
          const dy = py[i] - my
          const d2 = dx * dx + dy * dy
          if (d2 < RAD2) {
            const d = Math.sqrt(d2) + 0.0001
            const f = 1 - d / RAD
            const inv = 1 / d
            const ux = dx * inv
            const uy = dy * inv
            // 1. swirl — the disturbance, scaled by how fast the mouse moves
            const swirl = (0.8 + 2.8 * energy) * f
            nx += -uy * swirl
            ny += ux * swirl
            // 2. inward pull — particles converge and fuse at the cursor
            const pull = 2.1 * f * f
            nx -= ux * pull
            ny -= uy * pull
            // 3. wake — dragged along the pointer's travel direction
            nx += mvx * f * 0.3
            ny += mvy * f * 0.3
            // 4. core repulsion keeps them orbiting instead of collapsing
            if (d < 26) {
              const push = (26 - d) * 0.17
              nx += ux * push
              ny += uy * push
            }
            // keep the gathered cloud alive while it is being held
            life[i] = Math.min(1, life[i] + 0.005 * f)
            if (d < 82) {
              fx.push(nx)
              fy.push(ny)
              fp.push(phase)
              ff.push(1 - d / 82)
            }
          }
        }

        ctx.strokeStyle = holo(phase)
        ctx.globalAlpha = 0.35 + life[i] * 0.35
        ctx.moveTo(px[i], py[i])
        ctx.lineTo(nx, ny)
        px[i] = nx
        py[i] = ny
        life[i] -= 0.0022
        if (life[i] <= 0 || nx < 0 || nx > w || ny < 0 || ny > h) {
          px[i] = Math.random() * w
          py[i] = Math.random() * h
          life[i] = 1
        }
      }
      ctx.stroke()
      ctx.globalAlpha = 1

      // ---- fusion pass: additive blobs make overlapping particles merge ----
      if (active && (fx.length > 0 || energy > 0.02)) {
        ctx.globalCompositeOperation = 'lighter'
        for (let j = 0; j < fx.length; j++) {
          const k = ff[j]
          ctx.fillStyle = holo(fp[j] + 0.12)
          ctx.globalAlpha = 0.08 + 0.3 * k * k
          ctx.beginPath()
          ctx.arc(fx[j], fy[j], 1.4 + 3.6 * k, 0, Math.PI * 2)
          ctx.fill()
        }
        const gr = 30 + 52 * energy
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, gr)
        g.addColorStop(0, 'rgba(160,255,214,0.20)')
        g.addColorStop(0.55, 'rgba(52,211,153,0.08)')
        g.addColorStop(1, 'rgba(16,185,129,0)')
        ctx.globalAlpha = 0.45 + 0.55 * energy
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(mx, my, gr, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
      }

      t += 16
    }

    const loop = () => {
      draw()
      if (running) raf = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    if (reduced) {
      for (let f = 0; f < 36; f++) draw()
    } else {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerleave', onLeave)
      window.addEventListener('blur', onLeave)
      running = true
      raf = requestAnimationFrame(loop)
    }

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [reduced])

  return <canvas ref={ref} className="craft-canvas" aria-hidden="true" />
}

/**
 * Jack Craft — WebGL / generative art.
 * Hero (live generative canvas backdrop) → pinned manifesto → About →
 * Collections → Process → Exhibitions → Contact. Purple theme: "rise"
 * personality, dot cursor, paper-grain texture. Theming route-driven.
 */
export default function JackCraft() {
  return (
    <div className="craft">
      {/* ── Site-wide generative backdrop (persists across every craft page) ── */}
      <div className="craft-bg" aria-hidden="true">
        <GenerativeCanvas />
      </div>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="craft-hero">
        <div className="craft-hero-veil" aria-hidden="true" />
        <div className="craft-hero-inner">
          <SiteAvatar siteId="jack-craft" className="site-avatar-hero" />
          <SiteBadge className="craft-badge">GENERATIVE ART · 生成艺术</SiteBadge>
          <SplitHeading as="h1" className="craft-name" text="Jack Craft" splitBy="chars" />
          <p className="craft-statement">
            给机器<strong>一条规则</strong>，让它替我长出一片
            我从未想过的形状。
          </p>
        </div>
      </section>

      {/* ── Pinned manifesto ───────────────────────────────── */}
      <PinnedChapter distance={68} className="craft-manifesto-chapter">
        <div className="craft-manifesto">
          <span className="craft-manifesto-eyebrow">MANIFESTO</span>
          <h2 className="craft-manifesto-title">
            一条规则
            <br />
            长出
            <br />
            未见之形
          </h2>
          <div className="craft-manifesto-progress" aria-hidden="true">
            <i />
          </div>
        </div>
      </PinnedChapter>

      {/* ── About ──────────────────────────────────────────── */}
      <section className="craft-section">
        <SplitHeading as="h2" className="craft-h2" text="About" splitBy="chars" />
        <Reveal as="p" className="craft-prose">
          Jack Craft 是关于「生成」的实践。它不画具体的东西，而是写一套会自己生长的系统——
          一行约束、一颗种子，剩下的交给渲染循环。每一次刷新，看到的都不重样。
        </Reveal>
      </section>

      {/* ── Collections ───────────────────────────────────── */}
      <section className="craft-section">
        <div className="craft-works-head">
          <SplitHeading as="h2" className="craft-h2" text="Collections" splitBy="chars" />
          <span className="craft-works-badge">{COLLECTIONS.length} SERIES</span>
        </div>
        <div className="craft-collections">
          {COLLECTIONS.map((c) => (
            <Reveal key={c.id} className="craft-collection">
              <span className="craft-collection-id">{c.id}</span>
              <span className="craft-collection-title">{c.title}</span>
              <span className="craft-collection-medium">{c.medium}</span>
              <p className="craft-collection-note">{c.note}</p>
              <span className="craft-collection-year">{c.year}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Process ────────────────────────────────────────── */}
      <section className="craft-section">
        <SplitHeading as="h2" className="craft-h2" text="Process" splitBy="chars" />
        <div className="craft-features">
          {PROCESS.map((p) => (
            <Reveal key={p.k} className="craft-feature">
              <span className="craft-feature-k">{p.k}</span>
              <span className="craft-feature-t">{p.t}</span>
              <span className="craft-feature-d">{p.d}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Exhibitions ───────────────────────────────────── */}
      <section className="craft-section">
        <div className="craft-works-head">
          <SplitHeading as="h2" className="craft-h2" text="Exhibitions" splitBy="chars" />
          <span className="craft-works-badge">{EXHIBITIONS.length} SHOWN</span>
        </div>
        <ul className="craft-list">
          {EXHIBITIONS.map((ex) => (
            <Reveal as="li" key={ex.title} className="craft-item">
              <span className="craft-item-year">{ex.year}</span>
              <span className="craft-item-title">{ex.title}</span>
              <span className="craft-item-place">{ex.place}</span>
              <span className="craft-item-arrow" aria-hidden="true">
                →
              </span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── Contact ────────────────────────────────────────── */}
      <footer className="craft-contact">
        <SplitHeading as="h2" className="craft-contact-title" text="让规则生长。" splitBy="chars" />
        <div className="craft-contact-links">
          <ContactBar />
        </div>
        <TransitionLink to="/" className="craft-back">
          ← 返回工作室
        </TransitionLink>
      </footer>
    </div>
  )
}
