// ============================================================
// Notes · 随笔（内容中枢 P1 首个公开内容类型）
// /notes        列表：仅展示 published 文章
// /notes/:slug  详情：Markdown 渲染（marked + DOMPurify，打包内渲染遵守 CSP）
// 数据源：/api/public-articles（公开只读，max-age=60）
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

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

// ── 列表页 ─────────────────────────────────────────────────
export default function Notes() {
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

  return (
    <div className="notes-page">
      <header className="notes-head">
        <div className="notes-eyebrow">STUDIO · NOTES</div>
        <h1 className="notes-title">随笔</h1>
        <p className="notes-sub">
          安全监管与创意宇宙的两条线——偶尔交叉，记下来。
        </p>
      </header>

      {loading ? (
        <div className="notes-empty">读取中…</div>
      ) : failed ? (
        <div className="notes-empty">加载失败，请稍后再试</div>
      ) : articles.length === 0 ? (
        <div className="notes-empty">还没有发布的文章，敬请期待。</div>
      ) : (
        <div className="notes-list">
          {articles.map((a) => (
            <Link key={a.slug} to={`/notes/${a.slug}`} className="notes-card">
              <div className="notes-card-date">{fmtDate(a.publishedAt)}</div>
              <h2 className="notes-card-title">{a.title}</h2>
              {a.summary && <p className="notes-card-summary">{a.summary}</p>}
              {a.tags.length > 0 && (
                <div className="notes-card-tags">
                  {a.tags.map((t) => (
                    <span key={t} className="notes-tag">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <footer className="notes-foot">
        <Link to="/" className="notes-back">
          ← 返回工作室
        </Link>
      </footer>
    </div>
  )
}

// ── 详情页 ─────────────────────────────────────────────────
export function NoteArticle() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<ArticleFull | null>(null)
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

  const html = useMemo(
    () => (article ? renderMarkdown(article.body) : ''),
    [article],
  )

  return (
    <div className="notes-page">
      {loading ? (
        <div className="notes-empty">读取中…</div>
      ) : notFound || !article ? (
        <>
          <div className="notes-empty">文章不存在或尚未发布。</div>
          <footer className="notes-foot">
            <Link to="/notes" className="notes-back">
              ← 返回随笔列表
            </Link>
          </footer>
        </>
      ) : (
        <>
          <header className="notes-head">
            <div className="notes-eyebrow">{fmtDate(article.publishedAt)}</div>
            <h1 className="notes-title">{article.title}</h1>
            {article.tags.length > 0 && (
              <div className="notes-card-tags">
                {article.tags.map((t) => (
                  <span key={t} className="notes-tag">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </header>
          <article className="notes-body" dangerouslySetInnerHTML={{ __html: html }} />
          <footer className="notes-foot">
            <Link to="/notes" className="notes-back">
              ← 返回随笔列表
            </Link>
          </footer>
        </>
      )}
    </div>
  )
}
