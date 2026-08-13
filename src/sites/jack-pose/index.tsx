import { SplitHeading } from '../../system/SplitHeading'
import { Reveal } from '../../system/Reveal'
import { PinnedChapter } from '../../system/PinnedChapter'
import { TransitionLink } from '../../system/transition'
import { ContactBar } from '../../system/ContactBar'
import { SiteAvatar } from '../../system/avatars'
import { SiteBadge } from '../../system/SiteBadge'

const STATS = [
  { num: '30+', label: '排版模板' },
  { num: '9:16', label: '社媒黄金比例' },
  { num: '1 键', label: '导出高清 PNG' },
  { num: '∞', label: '可复用品牌色' },
]

const FEATURES = [
  { k: 'TEMPLATES', t: '模板库', d: '从封面到长图，覆盖小红书、公众号、知识卡片等常见版式。' },
  { k: 'DRAG', t: '拖拽排版', d: '块级编辑，文字、图片、分割线自由排布，所见即所得。' },
  { k: 'BRAND', t: '品牌色板', d: '保存专属配色与字体，一键套用到任意模板，保持一致性。' },
  { k: 'EXPORT', t: '一键导出', d: '高清 PNG / 长图拼接，适配各平台上传规格，不丢细节。' },
  { k: 'RATIO', t: '多比例', d: '9:16、3:4、1:1 自由切换，单稿多端复用。' },
  { k: 'DRAFT', t: '云端草稿', d: '草稿自动保存，跨设备继续编辑，灵感不中断。' },
]

/** Tall 9:16 mock of a social long-image — purely decorative preview. */
function LongImageMock({ c1, c2, label }: { c1: string; c2: string; label: string }) {
  return (
    <div className="pose-mock" style={{ background: `linear-gradient(160deg, ${c1}, ${c2})` }}>
      <div className="pose-mock-top">{label}</div>
      <div className="pose-mock-lines">
        <i style={{ width: '78%' }} />
        <i style={{ width: '64%' }} />
        <i style={{ width: '88%' }} />
        <i style={{ width: '52%' }} />
      </div>
      <div className="pose-mock-block" />
      <div className="pose-mock-foot">JACK POSE</div>
    </div>
  )
}

const TEMPLATES = [
  { id: 'cover', label: '小红书封面', c1: '#fbcfe8', c2: '#ec4899' },
  { id: 'long', label: '公众号长图', c1: '#f9a8d4', c2: '#db2777' },
  { id: 'card', label: '知识卡片', c1: '#fce7f3', c2: '#f472b6' },
  { id: 'weekly', label: '周报拼图', c1: '#fbcfe8', c2: '#be185d' },
  { id: 'quote', label: '金句海报', c1: '#fda4af', c2: '#ec4899' },
  { id: 'recipe', label: '教程步骤', c1: '#fbcfe8', c2: '#9d174d' },
]

const USECASES = [
  '小红书封面', '公众号长图', '知识卡片', '旅行手账', '读书笔记', '周报拼图', '产品介绍', '活动海报',
]

const PIPELINE = [
  { n: '01', t: '撰写', d: '在编辑器里写下文案与要点。' },
  { n: '02', t: '排版', d: '拖入模板，调整块与间距。' },
  { n: '03', t: '上色', d: '套用品牌色板，定下基调。' },
  { n: '04', t: '导出', d: '一键生成高清长图，直接发布。' },
]

/**
 * Jack Pose — a social long-image layout & export tool.
 * Hero (soft blur-in) → pinned manifesto → About → Features → Template
 * gallery (tall 9:16 mocks) → Use cases → Export flow → Contact.
 * Pink theme: rounded, editorial, "blur" personality. All theming comes from
 * the route-driven CSS vars (ThemeProvider); reusable primitives do the motion.
 */
export default function JackPose() {
  return (
    <div className="pose">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pose-hero">
        <SiteAvatar siteId="jack-pose" className="site-avatar-hero" />
        <SiteBadge className="pose-badge">LAYOUT STUDIO · 社媒长图排版</SiteBadge>
        <SplitHeading as="h1" className="pose-name" text="Jack Pose" splitBy="chars" />
        <p className="pose-statement">
          把想法，<strong>排成一张图</strong>。一个面向社媒的长图排版与导出工具——
          模板、拖拽、品牌色，一键生成可分享的长图。
        </p>
        <div className="pose-stats">
          {STATS.map((s, i) => (
            <Reveal key={s.label} className="pose-stat" delay={i * 0.06}>
              <span className="pose-stat-num">{s.num}</span>
              <span className="pose-stat-label">{s.label}</span>
            </Reveal>
          ))}
        </div>
        <TransitionLink to="/jack-pose/studio" className="pose-cta">
          进入工作台 →
        </TransitionLink>
      </section>

      {/* ── Pinned manifesto ────────────────────────────────── */}
      <PinnedChapter distance={68} className="pose-manifesto-chapter">
        <div className="pose-manifesto">
          <span className="pose-manifesto-eyebrow">MANIFESTO</span>
          <h2 className="pose-manifesto-title">
            把想法
            <br />
            排成
            <br />
            一张图
          </h2>
          <div className="pose-manifesto-progress" aria-hidden="true">
            <i />
          </div>
        </div>
      </PinnedChapter>

      {/* ── About ───────────────────────────────────────────── */}
      <section className="pose-section">
        <SplitHeading as="h2" className="pose-h2" text="About" splitBy="chars" />
        <Reveal as="p" className="pose-prose">
          Jack Pose 是一个轻量的社媒长图排版与导出工具。它不追求复杂设计软件的全套能力，
          而是把「写文案 → 选模板 → 上色 → 导出」这条最常用的路径做到极致顺滑，
          让你在手机或电脑上几分钟就能产出一张能发的图。
        </Reveal>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="pose-section">
        <SplitHeading as="h2" className="pose-h2" text="Features" splitBy="chars" />
        <div className="pose-features">
          {FEATURES.map((f) => (
            <Reveal key={f.k} className="pose-feature">
              <span className="pose-feature-k">{f.k}</span>
              <span className="pose-feature-t">{f.t}</span>
              <span className="pose-feature-d">{f.d}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Template gallery ────────────────────────────────── */}
      <section className="pose-section">
        <div className="pose-works-head">
          <SplitHeading as="h2" className="pose-h2" text="Templates" splitBy="chars" />
          <span className="pose-works-badge">6 SAMPLES</span>
        </div>
        <div className="pose-tpl">
          {TEMPLATES.map((t) => (
            <Reveal key={t.id} className="pose-tpl-item">
              <div className="pose-tpl-card">
                <LongImageMock c1={t.c1} c2={t.c2} label={t.label} />
                <div className="pose-tpl-glow" aria-hidden="true" />
              </div>
              <span className="pose-tpl-label">{t.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Use cases ───────────────────────────────────────── */}
      <section className="pose-section">
        <SplitHeading as="h2" className="pose-h2" text="Use cases" splitBy="chars" />
        <Reveal as="div" className="pose-chips">
          {USECASES.map((u) => (
            <span key={u} className="pose-chip">
              {u}
            </span>
          ))}
        </Reveal>
      </section>

      {/* ── Export pipeline ─────────────────────────────────── */}
      <section className="pose-section">
        <SplitHeading as="h2" className="pose-h2" text="Export flow" splitBy="chars" />
        <div className="pose-pipeline">
          {PIPELINE.map((p) => (
            <Reveal key={p.n} className="pose-step">
              <span className="pose-step-n">{p.n}</span>
              <span className="pose-step-t">{p.t}</span>
              <span className="pose-step-d">{p.d}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────── */}
      <footer className="pose-contact">
        <SplitHeading as="h2" className="pose-contact-title" text="开始排版。" splitBy="chars" />
        <div className="pose-contact-links">
          <ContactBar />
        </div>
        <TransitionLink to="/" className="pose-back">
          ← 返回工作室
        </TransitionLink>
      </footer>
    </div>
  )
}
