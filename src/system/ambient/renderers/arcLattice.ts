import type { AmbientFactory } from '../types'
import { parseRgb, clamp } from '../util'

/**
 * NOTES (方案 A) — 高压电弧网 "Arc Lattice".
 *
 * 稀疏的"电极"节点漂移在全屏，节点之间偶尔迸出锯齿状闪电电弧：
 * 一条亮白"电弧头"沿折线从一端窜到另一端，端点向四周弹射细小火花。
 * 光标是一根"活电极"——靠近时把电弧拉向自己、提高附近放电频率，
 * 并周期性向最近节点打出一道主电弧。
 *
 * 颜色沿用 Notes 金色主题（accent 金 + accent2 亮金），内核用白热
 * (#fff7d6) 拉高对比度，营造"酷炫"高压静电质感。复杂度对齐
 * studioLines（~48 节点 + ≤6 活跃电弧 + ≤40 火花，纯 2D 无 shader）。
 */
export const arcLattice: AmbientFactory = ({ ctx, theme, reduced }) => {
  const [ar, ag, ab] = parseRgb(theme.accentRgb)
  const [br, bg2, bb] = parseRgb(theme.accent2Rgb)
  const HOT = [255, 247, 214]
  let w = 0
  let h = 0

  interface Node {
    x: number
    y: number
    vx: number
    vy: number
    r: number
    ph: number
    heat: number
  }
  let nodes: Node[] = []

  interface Spark {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    size: number
  }
  let sparks: Spark[] = []

  interface Bolt {
    pts: { x: number; y: number }[]
    head: number // 0..1 电弧头沿折线行进
    life: number // 1 → 0 衰减
    hot: boolean // 主电弧（光标）更亮
  }
  let bolts: Bolt[] = []

  let nextDischarge = 0

  const seed = () => {
    const n = Math.min(52, Math.max(28, Math.round((w * h) / 26000)))
    nodes = []
    for (let i = 0; i < n; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        r: 1 + Math.random() * 1.4,
        ph: Math.random() * Math.PI * 2,
        heat: 0,
      })
    }
    sparks = []
    bolts = []
    nextDischarge = 0
  }

  /** 中点位移递归细分，生成锯齿闪电折线。 */
  function makeBolt(x1: number, y1: number, x2: number, y2: number): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
    const displace = (level: number) => {
      const jag = 0.34 * Math.pow(0.62, level)
      const next: { x: number; y: number }[] = []
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        const off = (Math.random() - 0.5) * 2 * len * jag
        next.push(a, { x: mx + (-dy / len) * off, y: my + (dx / len) * off })
      }
      next.push(pts[pts.length - 1])
      pts.length = 0
      pts.push(...next)
    }
    displace(0)
    displace(1)
    displace(2)
    return pts
  }

  const addBolt = (x1: number, y1: number, x2: number, y2: number, hot = false) => {
    if (bolts.length >= 6) return
    bolts.push({ pts: makeBolt(x1, y1, x2, y2), head: 0, life: 1, hot })
  }

  const burst = (x: number, y: number) => {
    const n = 4 + Math.floor(Math.random() * 5)
    for (let i = 0; i < n; i++) {
      if (sparks.length >= 40) break
      const a = Math.random() * Math.PI * 2
      const sp = 0.6 + Math.random() * 1.8
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        size: 0.6 + Math.random() * 1.2,
      })
    }
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      seed()
    },
    draw({ t, dt, intensity, pointer }) {
      ctx.clearRect(0, 0, w, h)
      const k = clamp((dt || 16) / 16, 0, 2.5)
      const time = t * 0.001
      const px = pointer.active ? pointer.x : -99999
      const py = pointer.active ? pointer.y : -99999

      // ── drift + heat decay ──
      for (const nd of nodes) {
        nd.x += nd.vx * (0.4 + 0.6 * intensity) * k
        nd.y += nd.vy * (0.4 + 0.6 * intensity) * k
        if (nd.x < -20) nd.x = w + 20
        if (nd.x > w + 20) nd.x = -20
        if (nd.y < -20) nd.y = h + 20
        if (nd.y > h + 20) nd.y = -20
        nd.heat = Math.max(0, nd.heat - 0.02 * k)
      }

      // ── 光标：拉弧到最近节点 + 提高附近放电 ──
      let nearest = -1
      let nearestD = 1e9
      if (pointer.active) {
        for (let i = 0; i < nodes.length; i++) {
          const d = Math.hypot(nodes[i].x - px, nodes[i].y - py)
          if (d < nearestD) {
            nearestD = d
            nearest = i
          }
        }
        if (nearest >= 0 && nearestD < 260) {
          const nd = nodes[nearest]
          nd.heat = Math.min(1, nd.heat + 0.35)
          // 周期性主电弧
          if (t - nextDischarge > 0 && Math.random() < 0.05 * (0.5 + 0.5 * intensity)) {
            addBolt(px, py, nd.x, nd.y, true)
          }
        }
      }

      // ── 节点间随机微放电 ──
      if (t - nextDischarge > 0 && Math.random() < 0.02 + 0.06 * intensity) {
        const i = Math.floor(Math.random() * nodes.length)
        const a = nodes[i]
        // 找最近邻
        let j = -1
        let best = 1e9
        for (let q = 0; q < nodes.length; q++) {
          if (q === i) continue
          const d = Math.hypot(nodes[q].x - a.x, nodes[q].y - a.y)
          if (d < best && d < 220) {
            best = d
            j = q
          }
        }
        if (j >= 0) addBolt(a.x, a.y, nodes[j].x, nodes[j].y)
      }

      // ── 电弧推进 + 火花迸发 ──
      for (const bl of bolts) {
        bl.head = Math.min(1, bl.head + (bl.hot ? 0.09 : 0.06) * k)
        bl.life -= 0.016 * k
        if (bl.head >= 1) {
          const last = bl.pts[bl.pts.length - 1]
          burst(last.x, last.y)
          bl.head = 1.0001 // mark done
        }
      }
      bolts = bolts.filter((b) => b.life > 0 && b.head <= 1)

      // ── 火花推进 ──
      for (const s of sparks) {
        s.x += s.vx * k
        s.y += s.vy * k
        s.vx *= 0.94
        s.vy *= 0.94
        s.life -= 0.05 * k
      }
      sparks = sparks.filter((s) => s.life > 0)

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      // ── 画电弧 ──
      for (const bl of bolts) {
        const alpha = bl.life * (bl.hot ? 0.9 : 0.6) * (0.35 + 0.65 * intensity)
        const segLen = bl.pts.length - 1
        const headIdx = bl.head * segLen
        // 整条幽灵折线
        ctx.beginPath()
        ctx.moveTo(bl.pts[0].x, bl.pts[0].y)
        for (let i = 1; i < bl.pts.length; i++) ctx.lineTo(bl.pts[i].x, bl.pts[i].y)
        ctx.strokeStyle = `rgba(${ar},${ag},${ab},${alpha * 0.5})`
        ctx.lineWidth = 1.1
        ctx.stroke()
        // 亮头：画到 head 位置
        ctx.beginPath()
        ctx.moveTo(bl.pts[0].x, bl.pts[0].y)
        let i = 1
        for (; i <= Math.floor(headIdx); i++) ctx.lineTo(bl.pts[i].x, bl.pts[i].y)
        if (i < bl.pts.length) {
          const f = headIdx - Math.floor(headIdx)
          const p0 = bl.pts[i - 1]
          const p1 = bl.pts[i]
          ctx.lineTo(p0.x + (p1.x - p0.x) * f, p0.y + (p1.y - p0.y) * f)
        }
        ctx.strokeStyle = `rgba(${br},${bg2},${bb},${alpha})`
        ctx.shadowBlur = 12 * intensity
        ctx.shadowColor = `rgba(${ar},${ag},${ab},0.5)`
        ctx.lineWidth = 2
        ctx.stroke()
        // 头部白热光点
        const hp = bl.pts[Math.min(bl.pts.length - 1, Math.max(0, Math.round(headIdx)))]
        ctx.shadowBlur = 16 * intensity
        ctx.shadowColor = `rgba(${HOT[0]},${HOT[1]},${HOT[2]},0.85)`
        ctx.fillStyle = `rgba(${HOT[0]},${HOT[1]},${HOT[2]},${alpha})`
        ctx.beginPath()
        ctx.arc(hp.x, hp.y, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── 电极节点 ──
      for (const nd of nodes) {
        const pulse = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(time * 1.4 + nd.ph)
        const boost = nd.heat
        const o = (0.25 + 0.4 * pulse + boost * 0.5) * (0.4 + 0.6 * intensity)
        const rad = nd.r * (1 + 0.4 * pulse + boost * 0.8)
        const grd = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, rad * 6)
        grd.addColorStop(0, `rgba(${br},${bg2},${bb},${o})`)
        grd.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
        ctx.shadowBlur = 0
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(nd.x, nd.y, rad * 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(${HOT[0]},${HOT[1]},${HOT[2]},${Math.min(1, o * 0.7 + boost * 0.5)})`
        ctx.beginPath()
        ctx.arc(nd.x, nd.y, rad * 0.55, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── 火花 ──
      for (const s of sparks) {
        ctx.shadowBlur = 8 * intensity
        ctx.shadowColor = `rgba(${br},${bg2},${bb},0.6)`
        ctx.fillStyle = `rgba(${HOT[0]},${HOT[1]},${HOT[2]},${s.life})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    },
  }
}
