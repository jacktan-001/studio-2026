import { useMemo } from 'react'
import { SplitHeading } from '../../system/SplitHeading'
import { Reveal } from '../../system/Reveal'
import { PinnedChapter } from '../../system/PinnedChapter'
import { TransitionLink } from '../../system/transition'
import { ContactBar } from '../../system/ContactBar'
import { SiteAvatar } from '../../system/avatars'

const STATS = [
  { num: '48', label: '已发布节目' },
  { num: '60+', label: '行业嘉宾' },
  { num: '120h', label: '对谈时长' },
  { num: '12', label: '关注领域' },
]

const FEATURED = {
  no: 'EP.48',
  title: '当安全系统学会思考',
  guest: '对话 · 民航安全一线专家',
  topic: 'AI 在关键系统里的边界',
  duration: '58:24',
  date: '2026.07',
  note: '从规则引擎到自主决策——安全系统到底走到了哪一步，又卡在了哪里。',
}

const EPISODES = [
  { no: 'EP.48', title: '当安全系统学会思考', guest: '民航安全专家', dur: '58:24', date: '2026.07' },
  { no: 'EP.47', title: '一个人也能扛住一个系统', guest: '独立开发者', dur: '41:08', date: '2026.06' },
  { no: 'EP.46', title: '数据治理不是买个中台', guest: '数据平台负责人', dur: '52:37', date: '2026.06' },
  { no: 'EP.45', title: '工程文化是怎么烂掉的', guest: '技术管理者', dur: '47:12', date: '2026.05' },
  { no: 'EP.44', title: '产品的第一性原理', guest: '产品负责人', dur: '39:50', date: '2026.05' },
  { no: 'EP.43', title: '开源这件事值不值得', guest: '开源维护者', dur: '44:29', date: '2026.04' },
]

const FORMAT = [
  { k: 'TALK', t: '深度对谈', d: '每期一位真正做过的人，聊透一个真实问题，不堆概念。' },
  { k: 'FIELD', t: '一线视角', d: '只谈踩过、验证过、正在发生的事，而不是 PPT 上的趋势。' },
  { k: 'CUT', t: '可听剪辑', d: '长内容剪成能一次通勤听完的一集，不注水。' },
]

const TOPICS = [
  '航空安全', '系统设计', 'AI 落地', '工程文化', '产品思维', '数据治理', '技术管理', '开源协作', '职业成长',
]

/** Deterministic mini waveform — purely decorative, no audio. */
function Waveform({ bars = 28, className }: { bars?: number; className?: string }) {
  const hs = useMemo(() => {
    const arr: number[] = []
    let s = 7
    for (let i = 0; i < bars; i++) {
      s = (s * 9301 + 49297) % 233280
      // a soft bell so the middle is taller — reads like a real waveform
      const bell = 0.5 + 0.5 * Math.sin((i / bars) * Math.PI)
      arr.push(0.22 + (s / 233280) * 0.55 * bell + 0.18 * bell)
    }
    return arr
  }, [bars])
  return (
    <span className={`waveform ${className || ''}`} aria-hidden="true">
      {hs.map((v, i) => (
        <i key={i} style={{ height: `${Math.min(100, v * 100)}%` }} />
      ))}
    </span>
  )
}

/**
 * Jack Talk — a podcast of industry conversations.
 * Hero (split-open statement) → pinned manifesto → About → Featured episode
 * (waveform flourish) → Episodes list (per-row mini waveforms) → Format →
 * Topics → Contact. Orange theme: "split" personality, ring cursor. Theming is
 * route-driven; the persistent global audio is this show's natural bed.
 */
export default function JackTalk() {
  return (
    <div className="talk">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="talk-hero">
        <SiteAvatar siteId="jack-talk" className="site-avatar-hero" />
        <span className="talk-badge">
          <i className="talk-badge-dot" /> ON AIR · 每周更新
        </span>
        <span className="talk-eyebrow">PODCAST · 行业对谈</span>
        <SplitHeading as="h1" className="talk-name" text="Jack Talk" splitBy="chars" />
        <p className="talk-statement">
          和<strong>真正在做的人</strong>聊——把行业里那些没说出口的事，
          摊开来谈一集。
        </p>
        <div className="talk-stats">
          {STATS.map((s, i) => (
            <Reveal key={s.label} className="talk-stat" delay={i * 0.06}>
              <span className="talk-stat-num">{s.num}</span>
              <span className="talk-stat-label">{s.label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Pinned manifesto ────────────────────────────────── */}
      <PinnedChapter distance={68} className="talk-manifesto-chapter">
        <div className="talk-manifesto">
          <span className="talk-manifesto-eyebrow">MANIFESTO</span>
          <h2 className="talk-manifesto-title">
            把行业里
            <br />
            没说出口的
            <br />
            摊开谈
          </h2>
          <div className="talk-manifesto-progress" aria-hidden="true">
            <i />
          </div>
        </div>
      </PinnedChapter>

      {/* ── About ──────────────────────────────────────────── */}
      <section className="talk-section">
        <SplitHeading as="h2" className="talk-h2" text="About" splitBy="chars" />
        <Reveal as="p" className="talk-prose">
          Jack Talk 是一档行业对谈播客。我们相信最好的洞察不在报告里，
          而在那些天天跟问题打交道的人嘴里——所以他们不是嘉宾，是共同主讲。
          而此刻持续播放的全局背景音乐，正是这档节目安静的底色。
        </Reveal>
      </section>

      {/* ── Featured episode ────────────────────────────────── */}
      <section className="talk-section">
        <div className="talk-works-head">
          <SplitHeading as="h2" className="talk-h2" text="Latest episode" splitBy="chars" />
          <span className="talk-works-badge">FEATURED</span>
        </div>
        <Reveal className="talk-featured">
          <div className="talk-featured-body">
            <span className="talk-featured-no">{FEATURED.no}</span>
            <h3 className="talk-featured-title">{FEATURED.title}</h3>
            <span className="talk-featured-guest">{FEATURED.guest}</span>
            <p className="talk-featured-note">{FEATURED.note}</p>
            <span className="talk-featured-meta">
              {FEATURED.topic} · {FEATURED.duration} · {FEATURED.date}
            </span>
          </div>
          <Waveform bars={34} className="talk-featured-wave" />
        </Reveal>
      </section>

      {/* ── Episodes ───────────────────────────────────────── */}
      <section className="talk-section">
        <div className="talk-works-head">
          <SplitHeading as="h2" className="talk-h2" text="Episodes" splitBy="chars" />
          <span className="talk-works-badge">{EPISODES.length} SHOWN</span>
        </div>
        <ul className="talk-list">
          {EPISODES.map((ep) => (
            <Reveal as="li" key={ep.no} className="talk-item">
              <span className="talk-item-no">{ep.no}</span>
              <span className="talk-item-title">{ep.title}</span>
              <span className="talk-item-guest">{ep.guest}</span>
              <Waveform bars={20} className="talk-item-wave" />
              <span className="talk-item-dur">{ep.dur}</span>
              <span className="talk-item-date">{ep.date}</span>
              <span className="talk-item-arrow" aria-hidden="true">
                →
              </span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── Format ─────────────────────────────────────────── */}
      <section className="talk-section">
        <SplitHeading as="h2" className="talk-h2" text="Format" splitBy="chars" />
        <div className="talk-features">
          {FORMAT.map((f) => (
            <Reveal key={f.k} className="talk-feature">
              <span className="talk-feature-k">{f.k}</span>
              <span className="talk-feature-t">{f.t}</span>
              <span className="talk-feature-d">{f.d}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Topics ─────────────────────────────────────────── */}
      <section className="talk-section">
        <SplitHeading as="h2" className="talk-h2" text="Topics" splitBy="chars" />
        <Reveal as="div" className="talk-chips">
          {TOPICS.map((t) => (
            <span key={t} className="talk-chip">
              {t}
            </span>
          ))}
        </Reveal>
      </section>

      {/* ── Contact ────────────────────────────────────────── */}
      <footer className="talk-contact">
        <SplitHeading as="h2" className="talk-contact-title" text="来一集对谈。" splitBy="chars" />
        <div className="talk-contact-links">
          <ContactBar />
        </div>
        <TransitionLink to="/" className="talk-back">
          ← 返回工作室
        </TransitionLink>
      </footer>
    </div>
  )
}
