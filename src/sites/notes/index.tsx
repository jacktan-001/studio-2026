// ============================================================
// Notes · 随笔 — 内容中枢对外的"期刊"页面
// /notes        列表：仅展示 published 文章
// /notes/:slug  详情：Markdown 渲染（marked + DOMPurify，打包内渲染遵守 CSP）
//
// 设计上对齐现有子站语言：SiteAvatar 头像 + SplitHeading 标题 +
// Reveal 进场 + ContactBar 页脚 + 路由主题（/notes → gold 金色主题，
// 由 registry/projects.ts 的 getThemeKeyForPath 解析）。动效接入全局
// AmbientCanvas（registry 中 notes → arcLattice 金色高压电弧网）。
// 数据源：/api/public-articles（公开只读，max-age=60）。
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { SplitHeading } from '../../system/SplitHeading'
import { Reveal } from '../../system/Reveal'
import { TransitionLink } from '../../system/transition'
import { ContactBar } from '../../system/ContactBar'
import { SiteAvatar } from '../../system/avatars'
import { SiteBadge } from '../../system/SiteBadge'

interface ArticleSummary {
  slug: string
  title: string
  summary: string
  tags: string[]
  publishedAt: string
}

interface ArticleFull extends ArticleSummary {
  body: string
}

marked.setOptions({ gfm: true, breaks: true })

function renderMarkdown(md: string): string {
  const html = marked.parse(md || '') as string
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

/** 拉取全部已发布文章（列表与统计共用）。 */
function useArticles() {
  const [articles, setArticles] = useState<ArticleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/public-articles', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => setArticles(json.articles || []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])

  return { articles, loading, failed }
}

// ── 电流感交互：滋啦颤动 / 高频闪烁描边 / 闪电划过过渡 ──────────
function prefersReduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** 在元素上触发一次性的「微电流颤动 + 高频闪烁描边」。 */
function zapEl(el: Element | null) {
  if (!el) return
  const node = el as HTMLElement
  node.classList.remove('is-zapping')
  void node.offsetWidth // 强制 reflow，重新触发动画
  node.classList.add('is-zapping')
  window.setTimeout(() => node.classList.remove('is-zapping'), 380)
}

/** 闪电划过：全屏覆盖层，亮金色电光斜划而过 + 点击点辉光。 */
function ElectricSwipe({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 400)
    return () => window.clearTimeout(t)
  }, [onDone])
  return (
    <div
      className="elec-swipe"
      aria-hidden="true"
      style={{ ['--ox' as string]: `${x}px`, ['--oy' as string]: `${y}px` } as any}
    >
      <span className="elec-flash" />
      <span className="elec-ray" />
      <span className="elec-ray b" />
      <span className="elec-ray c" />
    </div>
  )
}

/** 点击迸发的分支电火花，从点击点向四周飞散（距离/角度各异）。 */
function SparkBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 340)
    return () => window.clearTimeout(t)
  }, [onDone])
  const N = 14
  return (
    <span className="elec-spark" style={{ left: `${x}px`, top: `${y}px` }} aria-hidden="true">
      {Array.from({ length: N }).map((_, i) => {
        const jitter = Math.random() * 18 - 9
        const dist = (14 + Math.random() * 22).toFixed(1)
        return (
          <i
            key={i}
            style={
              {
                ['--a' as string]: `${((360 / N) * i + jitter).toFixed(1)}deg`,
                ['--d' as string]: `${dist}px`,
              } as any
            }
          />
        )
      })}
    </span>
  )
}

/** 提供 zap(元素) / fireCrackle(x,y) 以及需要渲染的 overlay 节点。 */
function useElectric() {
  const [swipe, setSwipe] = useState<{ x: number; y: number; id: number } | null>(null)
  const [sparks, setSparks] = useState<{ x: number; y: number; id: number } | null>(null)

  const zap = (el: Element | null) => zapEl(el)

  const fireCrackle = (x: number, y: number) => {
    setSparks({ x, y, id: Date.now() })
    setSwipe({ x, y, id: Date.now() })
  }

  const overlay = (
    <>
      {swipe && (
        <ElectricSwipe key={swipe.id} x={swipe.x} y={swipe.y} onDone={() => setSwipe(null)} />
      )}
      {sparks && (
        <SparkBurst key={sparks.id} x={sparks.x} y={sparks.y} onDone={() => setSparks(null)} />
      )}
    </>
  )

  return { zap, fireCrackle, overlay }
}

// ── 列表页 ─────────────────────────────────────────────────
export default function Notes() {
  const { articles, loading, failed } = useArticles()
  const navigate = useNavigate()
  const elec = useElectric()

  const tagCount = useMemo(() => {
    const s = new Set<string>()
    articles.forEach((a) => a.tags.forEach((t) => s.add(t)))
    return s.size
  }, [articles])

  return (
    <div className="notes">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="notes-hero">
        <SiteAvatar siteId="notes" className="site-avatar-hero" />
        <SiteBadge className="notes-badge">NOTES · 随笔</SiteBadge>
        <SplitHeading as="h1" className="notes-name" text="随笔" splitBy="chars" />
        <p className="notes-statement">
          安全监管与创意宇宙的<strong>两条线</strong>——偶尔交叉，
          就记下来。
        </p>
        <div className="notes-stats">
          <Reveal className="notes-stat" delay={0}>
            <span className="notes-stat-num">{loading ? '…' : articles.length}</span>
            <span className="notes-stat-label">已发布</span>
          </Reveal>
          <Reveal className="notes-stat" delay={0.06}>
            <span className="notes-stat-num">{loading ? '…' : tagCount}</span>
            <span className="notes-stat-label">话题标签</span>
          </Reveal>
        </div>
      </section>

      {/* ── Articles ───────────────────────────────────────── */}
      <section className="notes-section">
        <div className="notes-works-head">
          <SplitHeading as="h2" className="notes-h2" text="Articles" splitBy="chars" />
          <span className="notes-works-badge">
            {loading ? '…' : `${articles.length} SHOWN`}
          </span>
        </div>

        {loading ? (
          <div className="notes-empty">读取中…</div>
        ) : failed ? (
          <div className="notes-empty">加载失败，请稍后再试。</div>
        ) : articles.length === 0 ? (
          <div className="notes-empty">还没有发布的文章，敬请期待。</div>
        ) : (
          <ul className="notes-list">
            {articles.map((a) => (
              <Reveal as="li" key={a.slug} className="notes-item">
                <Link
                  to={`/notes/${a.slug}`}
                  className="notes-item-link"
                  onMouseDown={(e) => elec.zap(e.currentTarget)}
                  onMouseEnter={(e) => elec.zap(e.currentTarget)}
                  onClick={(e) => {
                    e.preventDefault()
                    elec.fireCrackle(e.clientX, e.clientY)
                    window.setTimeout(() => navigate(`/notes/${a.slug}`), 320)
                  }}
                >
                  <span className="notes-item-date">{fmtDate(a.publishedAt)}</span>
                  <span className="notes-item-title">{a.title}</span>
                  {a.summary && <span className="notes-item-summary">{a.summary}</span>}
                  {a.tags.length > 0 && (
                    <span className="notes-item-tags">
                      {a.tags.map((t) => (
                        <span key={t} className="notes-chip" onMouseDown={(e) => elec.zap(e.currentTarget)}>
                          #{t}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="notes-item-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {/* ── Contact ────────────────────────────────────────── */}
      <footer className="notes-contact">
        <SplitHeading as="h2" className="notes-contact-title" text="写点想说的。" splitBy="chars" />
        <div className="notes-contact-links">
          <ContactBar />
        </div>
        <TransitionLink
          to="/"
          className="notes-back"
          onMouseDown={(e) => elec.zap(e.currentTarget)}
          onClick={(e) => elec.fireCrackle(e.clientX, e.clientY)}
        >
          ← 返回工作室
        </TransitionLink>
      </footer>
      {elec.overlay}
    </div>
  )
}

// ── 详情页 ─────────────────────────────────────────────────
export function NoteArticle() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleFull | null>(null)
  const elec = useElectric()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetch(`/api/public-articles?slug=${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true)
          return Promise.reject()
        }
        return r.ok ? r.json() : Promise.reject()
      })
      .then((json) => json && setArticle(json.article))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const html = useMemo(() => (article ? renderMarkdown(article.body) : ''), [article])

  if (loading) {
    return (
      <div className="notes notes-article">
        <div className="notes-empty">读取中…</div>
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="notes notes-article">
        <div className="notes-article-head">
          <span className="notes-eyebrow">NOTES · 随笔</span>
          <SplitHeading as="h1" className="notes-name" text="未找到" splitBy="chars" />
          <p className="notes-statement">这篇文章不存在，或尚未发布。</p>
        </div>
        <footer className="notes-contact">
          <TransitionLink
            to="/notes"
            className="notes-back"
            onMouseDown={(e) => elec.zap(e.currentTarget)}
            onClick={(e) => elec.fireCrackle(e.clientX, e.clientY)}
          >
            ← 返回随笔列表
          </TransitionLink>
        </footer>
        {elec.overlay}
      </div>
    )
  }

  return (
    <div className="notes notes-article">
      {/* ── Article hero ───────────────────────────────────── */}
      <header className="notes-article-head">
        <span className="notes-eyebrow">
          {fmtDate(article.publishedAt)}
          {article.tags.length > 0 && <> · {article.tags.map((t) => `#${t}`).join(' ')}</>}
        </span>
        <SplitHeading as="h1" className="notes-name" text={article.title} splitBy="words" />
        {article.summary && <p className="notes-statement">{article.summary}</p>}
      </header>

      {/* ── Body ───────────────────────────────────────────── */}
      <Reveal className="notes-article-bodywrap" y={24}>
        <article className="notes-body" dangerouslySetInnerHTML={{ __html: html }} />
      </Reveal>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="notes-contact">
        <div className="notes-contact-links">
          <ContactBar />
        </div>
        <TransitionLink
          to="/notes"
          className="notes-back"
          onMouseDown={(e) => elec.zap(e.currentTarget)}
          onClick={(e) => elec.fireCrackle(e.clientX, e.clientY)}
        >
          ← 返回随笔列表
        </TransitionLink>
      </footer>
      {elec.overlay}
    </div>
  )
}
