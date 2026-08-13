// ============================================================
// 后台管理 /admin
// 密码登录（x-admin-password，存 sessionStorage）→ 歌单管理 + 投稿审核
// 风格跟随全站暗色玻璃体系
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOOD_PLAYLISTS } from '../jack-wave/musicData'
import { MONTHLY_SHARES } from '../jack-wave/monthlyData'

const TOKEN_KEY = 'studio_admin_pw'

type Tab = 'playlists' | 'submissions' | 'stats'

// ── 统一 API 封装：自动带鉴权头，401 视为登录失效 ──────────
async function api(path: string, opts: RequestInit = {}): Promise<Response> {
  const pw = sessionStorage.getItem(TOKEN_KEY) || ''
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(pw ? { 'x-admin-password': pw } : {}),
    },
  })
  if (res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY)
    throw new Error('AUTH')
  }
  return res
}

export default function Admin() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>('playlists')
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const flash = useCallback((kind: 'ok' | 'err', msg: string) => {
    setToast({ kind, msg })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const doLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setBusy(true)
      setLoginErr('')
      try {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
        })
        if (res.ok) {
          sessionStorage.setItem(TOKEN_KEY, pw)
          setAuthed(true)
        } else {
          setLoginErr('密码错误')
        }
      } catch {
        setLoginErr('网络错误，请重试')
      } finally {
        setBusy(false)
      }
    },
    [pw],
  )

  const doLogout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setAuthed(false)
    setTab('playlists')
  }, [])

  // 进入即检查是否已有会话
  useEffect(() => {
    if (sessionStorage.getItem(TOKEN_KEY)) {
      // 用 verify 探活
      fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': sessionStorage.getItem(TOKEN_KEY) || '' },
      })
        .then((r) => setAuthed(r.ok))
        .catch(() => setAuthed(false))
    }
  }, [])

  if (!authed) {
    return (
      <div className="admin-login">
        <form className="admin-login-card" onSubmit={doLogin}>
          <div className="admin-login-mark">JACK</div>
          <h1 className="admin-login-title">管理后台</h1>
          <p className="admin-login-sub">请输入管理密码以进入</p>
          <input
            className="admin-input"
            type="password"
            placeholder="管理密码"
            value={pw}
            autoFocus
            onChange={(e) => setPw(e.target.value)}
          />
          {loginErr && <div className="admin-login-err">{loginErr}</div>}
          <button className="admin-btn admin-btn--primary" type="submit" disabled={busy || !pw}>
            {busy ? '验证中…' : '进入'}
          </button>
          <button className="admin-link" type="button" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <header className="admin-head">
        <div className="admin-head-left">
          <span className="admin-head-mark">JACK</span>
          <span className="admin-head-name">管理后台</span>
        </div>
        <div className="admin-head-right">
          <span className="admin-head-hint">会话已激活</span>
          <button className="admin-btn admin-btn--ghost" onClick={doLogout}>
            登出
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'playlists' ? 'is-active' : ''}`}
          onClick={() => setTab('playlists')}
        >
          歌单管理
        </button>
        <button
          className={`admin-tab ${tab === 'submissions' ? 'is-active' : ''}`}
          onClick={() => setTab('submissions')}
        >
          投稿审核
        </button>
        <button
          className={`admin-tab ${tab === 'stats' ? 'is-active' : ''}`}
          onClick={() => setTab('stats')}
        >
          访问统计
        </button>
      </nav>

      <main className="admin-main">
        {tab === 'playlists' ? (
          <PlaylistsPanel onToast={flash} />
        ) : tab === 'submissions' ? (
          <SubmissionsPanel onToast={flash} />
        ) : (
          <StatsPanel />
        )}
      </main>

      {toast && <div className={`admin-toast admin-toast--${toast.kind}`}>{toast.msg}</div>}
    </div>
  )
}

// ── 歌单管理 ──────────────────────────────────────────────
function PlaylistsPanel({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [draft, setDraft] = useState('')
  const [meta, setMeta] = useState<{ source?: string; updatedAt?: string }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [valid, setValid] = useState<boolean | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api('/api/data')
      const json = await res.json()
      if (json.data) {
        setDraft(JSON.stringify(json.data, null, 2))
        setMeta({ source: json.source, updatedAt: json.updatedAt || json.data.updatedAt })
      } else {
        setDraft(JSON.stringify({ moodPlaylists: [], monthlyShares: [], allTags: [] }, null, 2))
        setMeta({ source: 'empty' })
      }
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', '加载失败')
    } finally {
      setLoading(false)
    }
  }, [onToast])

  useEffect(() => {
    load()
  }, [load])

  const onDraftChange = (v: string) => {
    setDraft(v)
    try {
      const o = JSON.parse(v)
      const ok = Array.isArray(o.moodPlaylists) && Array.isArray(o.monthlyShares) && Array.isArray(o.allTags)
      setValid(ok)
    } catch {
      setValid(false)
    }
  }

  const save = async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(draft)
    } catch {
      onToast('err', 'JSON 格式错误，无法保存')
      return
    }
    setSaving(true)
    try {
      const res = await api('/api/data', { method: 'PUT', body: JSON.stringify(parsed) })
      const json = await res.json()
      if (res.ok) {
        onToast('ok', '已保存到 KV')
        setMeta({ source: 'kv', updatedAt: new Date().toISOString() })
      } else {
        onToast('err', json.error || '保存失败')
      }
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const clear = async () => {
    if (!confirm('确认清空线上歌单数据？前端将回退到静态种子。')) return
    try {
      const res = await api('/api/data', { method: 'DELETE' })
      if (res.ok) {
        onToast('ok', '已清空，回退静态种子')
        load()
      } else onToast('err', '清空失败')
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', '清空失败')
    }
  }

  const loadSeed = () => {
    setDraft(
      JSON.stringify(
        { moodPlaylists: MOOD_PLAYLISTS, monthlyShares: MONTHLY_SHARES, allTags: [] },
        null,
        2,
      ),
    )
    setValid(true)
    onToast('ok', '已载入站点静态种子，可编辑后保存')
  }

  const exportJson = () => {
    const blob = new Blob([draft], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jack-wave-playlists.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setDraft(String(reader.result))
      onDraftChange(String(reader.result))
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2 className="admin-h2">歌单数据</h2>
          <p className="admin-meta">
            来源：
            <span className="admin-tag">{meta.source === 'kv' ? '线上 KV' : meta.source === 'seed' ? '静态种子' : meta.source === 'empty' ? '空' : '—'}</span>
            {meta.updatedAt && <> · 更新于 {new Date(meta.updatedAt).toLocaleString('zh-CN')}</>}
          </p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn admin-btn--ghost" onClick={loadSeed}>
            载入静态种子
          </button>
          <button className="admin-btn admin-btn--ghost" onClick={() => fileRef.current?.click()}>
            导入 JSON
          </button>
          <button className="admin-btn admin-btn--ghost" onClick={exportJson}>
            导出
          </button>
          <button className="admin-btn admin-btn--danger" onClick={clear}>
            清空
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={importFile} />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">读取中…</div>
      ) : (
        <>
          <textarea
            className="admin-textarea"
            spellCheck={false}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
          />
          <div className="admin-panel-foot">
            <span className={`admin-valid ${valid === false ? 'is-bad' : valid ? 'is-good' : ''}`}>
              {valid === false ? 'JSON 无效' : valid ? 'JSON 有效' : ''}
            </span>
            <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving || valid === false}>
              {saving ? '保存中…' : '保存到 KV'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}

// ── 投稿审核 ──────────────────────────────────────────────
type Submission = {
  id: string
  type: string
  linkUrl?: string
  songList?: string
  playlistName: string
  authorName: string
  description?: string
  tags?: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

function SubmissionsPanel({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [list, setList] = useState<Submission[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = filter === 'all' ? '' : `?status=${filter}`
      const res = await api(`/api/submissions${qs}`)
      const json = await res.json()
      if (res.ok) {
        setList(json.submissions || [])
        setCounts(json.counts || counts)
      } else onToast('err', json.error || '加载失败')
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', '加载失败')
    } finally {
      setLoading(false)
    }
  }, [filter, onToast])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id: string, status: 'approved' | 'rejected', verb: string) => {
    setBusyId(id)
    try {
      const res = await api('/api/submissions', {
        method: 'PATCH',
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (res.ok) {
        onToast('ok', `${verb}成功`)
        load()
      } else onToast('err', json.error || `${verb}失败`)
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', `${verb}失败`)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('确认删除这条投稿？')) return
    setBusyId(id)
    try {
      const res = await api(`/api/submissions?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) {
        onToast('ok', '已删除')
        load()
      } else onToast('err', '删除失败')
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', '删除失败')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2 className="admin-h2">用户投稿</h2>
          <p className="admin-meta">
            待审 <span className="admin-tag">{counts.pending}</span> · 通过 {counts.approved} · 拒绝{' '}
            {counts.rejected} · 共 {counts.total}
          </p>
        </div>
        <div className="admin-filters">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              className={`admin-filter ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : f === 'pending' ? '待审' : f === 'approved' ? '通过' : '拒绝'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">读取中…</div>
      ) : list.length === 0 ? (
        <div className="admin-empty">暂无投稿</div>
      ) : (
        <div className="admin-cards">
          {list.map((s) => (
            <article key={s.id} className="admin-card">
              <div className="admin-card-top">
                <div>
                  <div className="admin-card-title">{s.playlistName}</div>
                  <div className="admin-card-author">by {s.authorName}</div>
                </div>
                <span className={`admin-status admin-status--${s.status}`}>
                  {s.status === 'pending' ? '待审' : s.status === 'approved' ? '已通过' : '已拒绝'}
                </span>
              </div>
              {s.description && <p className="admin-card-desc">{s.description}</p>}
              {s.songList && <pre className="admin-card-songs">{s.songList}</pre>}
              {s.linkUrl && (
                <a className="admin-card-link" href={s.linkUrl} target="_blank" rel="noreferrer">
                  {s.linkUrl}
                </a>
              )}
              {s.tags && s.tags.length > 0 && (
                <div className="admin-card-tags">
                  {s.tags.map((t, i) => (
                    <span key={i} className="admin-chip">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="admin-card-foot">
                <span className="admin-card-time">{new Date(s.createdAt).toLocaleString('zh-CN')}</span>
                <div className="admin-card-actions">
                  {s.status !== 'approved' && (
                    <button
                      className="admin-btn admin-btn--ok"
                      disabled={busyId === s.id}
                      onClick={() => act(s.id, 'approved', '通过')}
                    >
                      通过
                    </button>
                  )}
                  {s.status !== 'rejected' && (
                    <button
                      className="admin-btn admin-btn--warn"
                      disabled={busyId === s.id}
                      onClick={() => act(s.id, 'rejected', '拒绝')}
                    >
                      拒绝
                    </button>
                  )}
                  <button
                    className="admin-btn admin-btn--danger"
                    disabled={busyId === s.id}
                    onClick={() => remove(s.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

// ── 访问统计面板 ─────────────────────────────────────────────
interface StatDay {
  date: string
  pv: number
  uv: number
  paths: Record<string, number>
  refs: Record<string, number>
}

const ROUTE_NAMES: Record<string, string> = {
  '/': '门户',
  '/jack-tan': 'Jack Tan',
  '/jack-pose': 'Jack Pose',
  '/jack-wave': 'Jack Wave',
  '/jack-talk': 'Jack Talk',
  '/jack-craft': 'Jack Craft',
}

function StatsPanel() {
  const [days, setDays] = useState<StatDay[]>([])
  const [totalPv, setTotalPv] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(false)
    try {
      const res = await api('/api/stats?days=14')
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const json = await res.json()
      setDays(Array.isArray(json.days) ? json.days : [])
      setTotalPv(json.totalPv || 0)
    } catch (e) {
      if ((e as Error).message !== 'AUTH') setErr(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const top = (m: Record<string, number>, n: number) =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2 className="admin-h2">访问统计 · 近 14 天</h2>
          <p className="admin-meta">
            自托管轻量统计：仅记录路径与来源域，无 Cookie、无指纹、尊重 DNT · 合计{' '}
            <span className="admin-tag">{totalPv} 次浏览</span>
          </p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn admin-btn--ghost" onClick={load}>
            刷新
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">加载中…</div>
      ) : err ? (
        <div className="admin-empty">统计读取失败，请稍后重试</div>
      ) : (
        <table className="admin-stats-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>PV</th>
              <th>UV</th>
              <th>页面分布</th>
              <th>外部来源</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td className="admin-stats-num">{d.date}</td>
                <td className="admin-stats-num">{d.pv}</td>
                <td className="admin-stats-num">{d.uv}</td>
                <td>
                  {d.pv === 0 ? (
                    <span className="admin-meta">—</span>
                  ) : (
                    top(d.paths, 6).map(([k, v]) => (
                      <span className="admin-chip" key={k}>
                        {ROUTE_NAMES[k] || k} {v}
                      </span>
                    ))
                  )}
                </td>
                <td>
                  {Object.keys(d.refs).length === 0 ? (
                    <span className="admin-meta">—</span>
                  ) : (
                    top(d.refs, 4).map(([k, v]) => (
                      <span className="admin-chip" key={k}>
                        {k} {v}
                      </span>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
