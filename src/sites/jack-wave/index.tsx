import { SplitHeading } from '../../system/SplitHeading'
import { Reveal } from '../../system/Reveal'
import { PinnedChapter } from '../../system/PinnedChapter'
import { TransitionLink } from '../../system/transition'
import { ContactBar } from '../../system/ContactBar'
import { SiteAvatar } from '../../system/avatars'
import { MoodGallery } from './MoodGallery'
import { MonthlyShare } from './MonthlyShare'
import { SubmitForm } from './SubmitForm'

const ISSUES = [
  { no: '01', title: '凌晨的城市', mood: '静谧 / 蓝调', date: '2026.01', tracks: 8, note: '写给深夜还亮着灯的人。' },
  { no: '02', title: '雨天的窗', mood: '温柔 / 民谣', date: '2026.02', tracks: 7, note: '雨声是最好的伴唱。' },
  { no: '03', title: '通勤频率', mood: '律动 / 电子', date: '2026.03', tracks: 9, note: '把地铁的节奏听成鼓点。' },
  { no: '04', title: '周末的留白', mood: '松弛 / 轻爵士', date: '2026.04', tracks: 6, note: '什么都不做的下午。' },
  { no: '05', title: '远行的预感', mood: '辽阔 / 后摇', date: '2026.05', tracks: 8, note: '出发前夜的兴奋。' },
  { no: '06', title: '归途', mood: '温暖 / 民谣', date: '2026.06', tracks: 7, note: '回家的路最安心。' },
]

const SECTIONS = [
  { k: 'MOOD', t: '一种心情', d: '每期从一个情绪出发，而不是从歌单出发。' },
  { k: 'PLAYLIST', t: '一组声音', d: '8 首左右，串成一条能从头听到尾的线。' },
  { k: 'NOTES', t: '一段手记', d: '为什么是这些歌，以及它们此刻意味着什么。' },
]

/**
 * Jack Wave — a music & mood journal.
 * Animated wave hero → latest issue (equalizer flourish) → pinned manifesto →
 * About → Inside sections → Issues archive → Contact. Cyan theme: fluid,
 * "scale" personality, SVG waves. Theming is route-driven (ThemeProvider); the
 * persistent global audio is this journal's natural BGM.
 */
export default function JackWave() {
  return (
    <div className="wave">
      {/* ── Fluid wave backdrop (CSS-driven, seamless drift) ── */}
      <div className="wave-bg" aria-hidden="true" />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="wave-hero">
        <SiteAvatar siteId="jack-wave" className="site-avatar-hero" />
        <span className="wave-eyebrow">MUSIC JOURNAL · 音乐与心情期刊</span>
        <SplitHeading as="h1" className="wave-name" text="Jack Wave" splitBy="chars" />
        <p className="wave-statement">
          声音是情绪的<strong>记事本</strong>。Jack Wave 是一本音乐期刊——
          每期用一份歌单与一段手记，记下一种心情。
        </p>
      </section>

      {/* ── 月度歌单（提至首位，视觉仿 Latest issue 风格） ──── */}
      <MonthlyShare />

      {/* ── 心情歌单 · 3D 回环长廊 ─────────────────────────── */}
      <section className="wave-section">
        <div className="wave-works-head">
          <SplitHeading as="h2" className="wave-h2" text="心情歌单" splitBy="chars" />
          <span className="wave-works-badge">MOOD · 3D 长廊</span>
        </div>
        <Reveal className="wave-listen">
          <MoodGallery />
        </Reveal>
      </section>

      {/* ── Submit (user contributions → /api/submit) ──────── */}
      <section className="wave-section">
        <div className="wave-works-head">
          <SplitHeading as="h2" className="wave-h2" text="投稿" splitBy="chars" />
          <span className="wave-works-badge">SUBMIT</span>
        </div>
        <Reveal className="wave-submit-wrap">
          <p className="wave-submit-intro">
            有一份想分享的歌单？贴上链接或写下歌单内容，我们会在后台审核后收录。
          </p>
          <SubmitForm />
        </Reveal>
      </section>

      {/* ── Pinned manifesto ────────────────────────────────── */}
      <PinnedChapter distance={68} className="wave-manifesto-chapter">
        <div className="wave-manifesto">
          <span className="wave-manifesto-eyebrow">MANIFESTO</span>
          <h2 className="wave-manifesto-title">
            声音是
            <br />
            情绪的
            <br />
            记事本
          </h2>
          <div className="wave-manifesto-progress" aria-hidden="true">
            <i />
          </div>
        </div>
      </PinnedChapter>

      {/* ── About ───────────────────────────────────────────── */}
      <section className="wave-section">
        <SplitHeading as="h2" className="wave-h2" text="About" splitBy="chars" />
        <Reveal as="p" className="wave-prose">
          Jack Wave 不是播放器，而是一本刊物。它把「此刻的心情」作为选题，
          用一组声音与一段手记把它固定下来——于是某天你再翻开，
          仍能找回写那期时的温度。而此刻持续播放的全局背景音乐，正是这本期刊的 BGM。
        </Reveal>
      </section>

      {/* ── Inside ──────────────────────────────────────────── */}
      <section className="wave-section">
        <SplitHeading as="h2" className="wave-h2" text="Inside" splitBy="chars" />
        <div className="wave-features">
          {SECTIONS.map((s) => (
            <Reveal key={s.k} className="wave-feature">
              <span className="wave-feature-k">{s.k}</span>
              <span className="wave-feature-t">{s.t}</span>
              <span className="wave-feature-d">{s.d}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Archive ─────────────────────────────────────────── */}
      <section className="wave-section">
        <div className="wave-works-head">
          <SplitHeading as="h2" className="wave-h2" text="Archive" splitBy="chars" />
          <span className="wave-works-badge">{ISSUES.length} ISSUES</span>
        </div>
        <ul className="wave-list">
          {ISSUES.map((it) => (
            <Reveal as="li" key={it.no} className="wave-item">
              <span className="wave-item-no">{it.no}</span>
              <span className="wave-item-title">{it.title}</span>
              <span className="wave-item-mood">{it.mood}</span>
              <span className="wave-item-tracks">{it.tracks} TRACKS</span>
              <span className="wave-item-date">{it.date}</span>
              <span className="wave-item-arrow" aria-hidden="true">
                →
              </span>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── Contact ─────────────────────────────────────────── */}
      <footer className="wave-contact">
        <SplitHeading as="h2" className="wave-contact-title" text="翻开一期。" splitBy="chars" />
        <div className="wave-contact-links">
          <ContactBar />
        </div>
        <TransitionLink to="/" className="wave-back">
          ← 返回工作室
        </TransitionLink>
      </footer>
    </div>
  )
}
