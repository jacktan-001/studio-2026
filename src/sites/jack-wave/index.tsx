import { SplitHeading } from '../../system/SplitHeading'
import { Reveal } from '../../system/Reveal'
import { PinnedChapter } from '../../system/PinnedChapter'
import { TransitionLink } from '../../system/transition'
import { ContactBar } from '../../system/ContactBar'
import { SiteAvatar } from '../../system/avatars'
import { MoodGallery } from './MoodGallery'
import { MonthlyShare } from './MonthlyShare'
import { SubmitForm } from './SubmitForm'

/**
 * Jack Wave — a music & mood journal.
 * Animated wave hero → monthly share → mood 3D gallery → submit → pinned
 * manifesto → About → Contact. Cyan theme: fluid, "scale" personality, SVG
 * waves. Theming is route-driven (ThemeProvider); the persistent global audio
 * is this journal's natural BGM.
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
