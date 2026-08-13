import type { CSSProperties } from 'react'
import { TransitionLink } from '../../system/transition'
import { HoverPreviewCard } from '../../system/HoverPreviewCard'
import { SplitHeading } from '../../system/SplitHeading'
import { Reveal } from '../../system/Reveal'
import { ContactBar } from '../../system/ContactBar'
import { SiteAvatar } from '../../system/avatars'
import { PROJECTS } from '../../registry/projects'
import { getTheme } from '../../registry/themes'

/**
 * Portal landing — "暗色 Pacome 版面 + Apple 滚动叙事".
 * A column of huge type, then a numbered project index where each row unfolds a
 * cursor-following preview card (the Pacome interaction), then a quiet
 * narrative band, then the footer. Violet base; every sub-link is a
 * TransitionLink so navigation keeps the global audio alive.
 */
export default function Portal() {
  return (
    <div className="portal">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="portal-hero">
        <SiteAvatar siteId="portal" className="site-avatar-hero" />
        <span className="portal-eyebrow">PERSONAL · MULTIVERSE</span>
        <SplitHeading as="h1" className="portal-display" text="Jack Tan" splitBy="chars" />
        <div className="portal-display-sub">
          <span>Studio</span>
        </div>
        <div className="portal-scrollcue" aria-hidden="true">
          <span>SCROLL</span>
          <i />
        </div>
      </section>

      {/* ── Project index ────────────────────────────────────── */}
      <section className="portal-index">
        <Reveal as="div" className="portal-index-head">
          <span className="index-eyebrow">INDEX / 索引</span>
          <span className="index-count">{String(PROJECTS.length).padStart(2, '0')} PROJECTS</span>
        </Reveal>

        <ul className="portal-index-list">
          {PROJECTS.map((p, i) => {
            const t = getTheme(p.themeKey)
            return (
              <li key={p.id} style={{ '--row-accent': t.accent } as CSSProperties}>
                <HoverPreviewCard
                  preview={
                    <div
                      className="index-preview"
                      style={{
                        background: `linear-gradient(150deg, ${t.accent} 0%, ${t.accent2} 120%)`,
                      }}
                    >
                      <span className="index-preview-name">{p.name}</span>
                      <span className="index-preview-tag">{p.role}</span>
                      <span className="index-preview-dot" />
                    </div>
                  }
                >
                  <TransitionLink to={p.href} className="index-row" data-theme-key={p.themeKey}>
                    <span className="index-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="index-name">{p.name}</span>
                    <span className="index-role">{p.role}</span>
                    <span className="index-intro">
                      <TransitionLink to={`${p.href}/intro`} className="index-intro-link">
                        介绍
                      </TransitionLink>
                    </span>
                    <span className={`index-status ${p.status === 'coming-soon' ? 'is-soon' : ''}`}>
                      {p.status === 'coming-soon' ? 'SOON' : 'LIVE'}
                    </span>
                    <span className="index-arrow" aria-hidden="true">→</span>
                  </TransitionLink>
                </HoverPreviewCard>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── Modules (content sites that aren't product projects) ── */}
      <section className="portal-index portal-modules">
        <Reveal as="div" className="portal-index-head">
          <span className="index-eyebrow">MODULES / 模块</span>
          <span className="index-count">01 MODULE</span>
        </Reveal>

        <ul className="portal-index-list">
          <li style={{ '--row-accent': '#f5b301' } as CSSProperties}>
            <HoverPreviewCard
              preview={
                <div
                  className="index-preview"
                  style={{
                    background: 'linear-gradient(150deg, #f5b301 0%, #fcd34d 120%)',
                  }}
                >
                  <span className="index-preview-name">Jack Notes</span>
                  <span className="index-preview-tag">Journal</span>
                  <span className="index-preview-dot" />
                </div>
              }
            >
              <TransitionLink to="/notes" className="index-row" data-theme-key="gold">
                <span className="index-num">✎</span>
                <span className="index-name">Jack Notes</span>
                <span className="index-role">随笔 · Journal</span>
                <span className="index-status">LIVE</span>
                <span className="index-arrow" aria-hidden="true">→</span>
              </TransitionLink>
            </HoverPreviewCard>
          </li>
        </ul>
      </section>

      {/* ── Narrative band ───────────────────────────────────── */}
      <section className="portal-narrative">
        <Reveal as="p" className="portal-statement">
          耳听为律·眼见为序。在这座由代码、音符与像素编织的花园里，种着音乐的碎片，养着设计的灵光。欢迎你，<em>慢慢逛</em>。
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="portal-footer">
        <div className="portal-footer-motto">联系我</div>
        <div className="portal-footer-meta">
          <ContactBar />
        </div>
        <div className="portal-footer-copy">© Jack Tan Studio · Beijing</div>
      </footer>
    </div>
  )
}
