import { useParams, Link } from 'react-router-dom'
import { Reveal } from '../system/Reveal'
import { TransitionLink } from '../system/transition'
import { PROJECTS } from '../registry/projects'

function ScreenshotCarousel({ label }: { label: string }) {
  const slides = [
    { title: '主界面', tone: 1 },
    { title: '核心功能', tone: 0.66 },
    { title: '细节体验', tone: 0.33 },
  ]
  return (
    <div className="intro-shots">
      {slides.map((s, i) => (
        <Reveal key={s.title} delay={0.5 + i * 0.1} className="intro-shot" y={24}>
          <div
            className="intro-shot-grid"
            style={{ opacity: s.tone }}
            aria-hidden="true"
          />
          <span className="intro-shot-tag">{s.title}</span>
        </Reveal>
      ))}
      <Reveal delay={0.85} className="intro-shot intro-shot-note" y={24}>
        <span className="intro-shot-tag">{label}</span>
      </Reveal>
    </div>
  )
}

export function ProjectIntro() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = PROJECTS.find((p) => p.id === projectId)

  if (!project) {
    return (
      <main className="site-root intro-page">
        <div className="intro-missing">
          <p>没有找到这个项目。</p>
          <TransitionLink to="/" className="intro-back">
            ← 返回 Studio
          </TransitionLink>
        </div>
      </main>
    )
  }

  const isLive = project.status === 'live'

  return (
    <main className="site-root intro-page">
      <article className="intro-shell">
        <Reveal delay={0.05} className="intro-backwrap" y={16}>
          <TransitionLink to={project.href} className="intro-back">
            ← 返回 {project.name}
          </TransitionLink>
        </Reveal>

        <Reveal delay={0.12} className="intro-head" y={24}>
          <span className="intro-badge">{project.shortName}</span>
          <div className="intro-head-text">
            <span className={`intro-status ${isLive ? 'is-live' : 'is-soon'}`}>
              {isLive ? 'LIVE' : 'COMING SOON'}
            </span>
            <h1 className="intro-title">{project.name}</h1>
            <p className="intro-tagline">{project.tagline}</p>
          </div>
        </Reveal>

        <Reveal delay={0.2} className="intro-desc" y={24}>
          {project.description}
        </Reveal>

        <Reveal delay={0.28} y={20}>
          <h2 className="intro-h2">功能特性</h2>
          <ul className="intro-features">
            {(project.features ?? []).map((f, i) => (
              <Reveal key={f} delay={0.34 + i * 0.05} as="li" className="intro-feature" y={14}>
                <span className="intro-dot" aria-hidden="true" />
                {f}
              </Reveal>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.4} y={20}>
          <h2 className="intro-h2">技术栈</h2>
          <div className="intro-tech">
            {(project.tech ?? []).map((t) => (
              <span key={t} className="intro-tech-chip">
                {t}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.48} y={20}>
          <h2 className="intro-h2">界面预览</h2>
          <ScreenshotCarousel label="真实截图将在后续版本替换" />
        </Reveal>

        <Reveal delay={0.6} className="intro-cta" y={24}>
          <div>
            <h3 className="intro-cta-title">
              {isLive ? `准备好探索 ${project.name} 了吗？` : '第一时间获取上线通知'}
            </h3>
            <p className="intro-cta-sub">
              {isLive ? '点击进入子应用，体验完整功能。' : '项目上线时，我们会第一时间通知你。'}
            </p>
          </div>
          {isLive ? (
            <TransitionLink to={project.href} className="intro-cta-btn">
              进入应用 →
            </TransitionLink>
          ) : (
            <Link to="/" className="intro-cta-btn">
              了解更多
            </Link>
          )}
        </Reveal>
      </article>
    </main>
  )
}
