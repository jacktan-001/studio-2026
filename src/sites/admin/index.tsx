// ============================================================
// 后台管理 /admin
// 密码登录（x-admin-password，存 sessionStorage）→ 歌单管理 + 投稿审核
// 风格跟随全站暗色玻璃体系
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOOD_PLAYLISTS } from '../jack-wave/musicData'
import { MONTHLY_SHARES } from '../jack-wave/monthlyData'
import { searchAppleMusic, formatDuration, type AppleSearchResult } from '../jack-wave/trackMeta'

const TOKEN_KEY = 'studio_admin_pw'

type Tab = 'playlists' | 'submissions' | 'content' | 'audit' | 'stats'

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
          className={`admin-tab ${tab === 'content' ? 'is-active' : ''}`}
          onClick={() => setTab('content')}
        >
          文章
        </button>
        <button
          className={`admin-tab ${tab === 'audit' ? 'is-active' : ''}`}
          onClick={() => setTab('audit')}
        >
          操作审计
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
        ) : tab === 'content' ? (
          <ContentPanel onToast={flash} />
        ) : tab === 'audit' ? (
          <AuditPanel />
        ) : (
          <StatsPanel />
        )}
      </main>

      {toast && <div className={`admin-toast admin-toast--${toast.kind}`}>{toast.msg}</div>}
    </div>
  )
}

// ── 歌单管理（两级结构：歌单为一级，歌曲为二级）──────────────
interface SongRow {
  id: string
  title: string
  artist?: string
  duration?: string
  src?: string
  appleTrackId?: number | string | null
  appleMusicUrl?: string
  applePreviewUrl?: string
  appleArtworkUrl?: string
  durationMs?: number | null
}
interface MoodPlaylistRow {
  id: string
  title: string
  mood?: string
  date?: string
  note?: string
  author?: string
  cover?: string
  songList: SongRow[]
}
interface MonthlyTrackRow {
  id: string
  title: string
  artist?: string
  appleMusicUrl?: string
  appleTrackId?: string | number | null
  applePreviewUrl?: string
  appleArtworkUrl?: string
  duration?: string
  durationMs?: number | null
}
interface MonthlyShareRow {
  id: string
  monthNo: number
  monthCn?: string
  monthEn?: string
  titleCn?: string
  titleEn?: string
  author?: string
  cover?: string
  tracks: MonthlyTrackRow[]
}
interface PlaylistData {
  moodPlaylists: MoodPlaylistRow[]
  monthlyShares: MonthlyShareRow[]
  allTags: string[]
}

/** 小型受控文本输入 */
function TField({
  label,
  value,
  onChange,
  placeholder,
  wide,
}: {
  label: string
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  wide?: boolean
}) {
  return (
    <label className={`pl-field ${wide ? 'pl-field--wide' : ''}`}>
      <span className="pl-field-label">{label}</span>
      <input
        className="admin-input"
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

// ── Apple Music 选歌器（搜索 / 试听 / 选择）──────────────────
function AppleSongPicker({
  onPick,
  onClose,
}: {
  onPick: (picked: Omit<SongRow, 'id'>) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<AppleSearchResult[]>([])
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [playingId, setPlayingId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const search = useCallback(async (term: string) => {
    const t = term.trim()
    if (!t) {
      setResults([])
      setPhase('idle')
      return
    }
    setPhase('loading')
    try {
      const r = await searchAppleMusic(t, 20)
      setResults(r)
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  const preview = (trackId: number, url: string | null) => {
    const audio = audioRef.current
    if (!audio) return
    if (playingId === trackId) {
      audio.pause()
      setPlayingId(null)
      return
    }
    if (!url) return
    audio.src = url
    void audio.play().catch(() => {})
    setPlayingId(trackId)
  }

  const choose = (r: AppleSearchResult) => {
    onPick({
      title: r.trackName,
      artist: r.artistName,
      duration: formatDuration(r.trackTimeMillis),
      src: r.previewUrl || '/audio/ambient.wav',
      appleTrackId: r.trackId,
      appleMusicUrl: r.trackViewUrl || '',
      applePreviewUrl: r.previewUrl || '',
      appleArtworkUrl: r.artworkUrl100,
      durationMs: r.trackTimeMillis,
    })
  }

  return (
    <div className="apicker" role="dialog" aria-modal="true" aria-label="从 Apple Music 选歌">
      <div className="apicker-head">
        <h3 className="pl-h3">从 Apple Music 选歌</h3>
        <button className="admin-btn admin-btn--ghost" onClick={onClose}>
          关闭
        </button>
      </div>
      <form
        className="apicker-search"
        onSubmit={(e) => {
          e.preventDefault()
          void search(q)
        }}
      >
        <input
          className="admin-input"
          autoFocus
          placeholder="搜索歌名 / 艺人 / 专辑…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="admin-btn admin-btn--primary" type="submit" disabled={phase === 'loading'}>
          搜索
        </button>
      </form>

      {phase === 'loading' ? (
        <div className="admin-loading">搜索中…</div>
      ) : phase === 'error' ? (
        <div className="admin-empty">搜索失败，请重试</div>
      ) : phase === 'idle' ? (
        <div className="admin-empty">输入关键词，从 Apple Music 曲库检索歌曲</div>
      ) : results.length === 0 ? (
        <div className="admin-empty">没有匹配结果</div>
      ) : (
        <ul className="apicker-list">
          {results.map((r) => (
            <li className="apicker-item" key={r.trackId}>
              {r.artworkUrl100 ? (
                <img className="apicker-art" src={r.artworkUrl100} alt="" loading="lazy" />
              ) : (
                <span className="apicker-art apicker-art--ph">♪</span>
              )}
              <div className="apicker-meta">
                <div className="apicker-title" title={r.trackName}>
                  {r.trackName}
                </div>
                <div className="apicker-sub">
                  {r.artistName}
                  {r.collectionName ? ` · ${r.collectionName}` : ''}
                </div>
              </div>
              <span className="apicker-dur">{formatDuration(r.trackTimeMillis)}</span>
              <button
                className="admin-btn admin-btn--ghost"
                title="试听 30s"
                disabled={!r.previewUrl}
                onClick={() => preview(r.trackId, r.previewUrl)}
              >
                {playingId === r.trackId ? '⏸' : '▶'}
              </button>
              <button className="admin-btn admin-btn--ok" onClick={() => choose(r)}>
                选择
              </button>
            </li>
          ))}
        </ul>
      )}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} hidden />
    </div>
  )
}

// ── 歌曲行（二级：试听 / 换歌 / 排序 / 删除 / 改名）──────────
function SongEditorRow({
  song,
  index,
  total,
  onChange,
  onDelete,
  onMove,
  onReplace,
}: {
  song: SongRow
  index: number
  total: number
  onChange: (s: SongRow) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
  onReplace: () => void
}) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewUrl = song.applePreviewUrl || song.src || ''

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
      return
    }
    if (!previewUrl) return
    a.src = previewUrl
    void a.play().catch(() => {})
    setPlaying(true)
  }

  return (
    <div className="pl-song-row">
      {song.appleArtworkUrl ? (
        <img className="pl-track-art" src={song.appleArtworkUrl} alt="" loading="lazy" />
      ) : (
        <span className="pl-track-art pl-track-art--ph">♪</span>
      )}
      <div className="pl-song-main">
        <input
          className="admin-input"
          placeholder="歌名"
          value={song.title || ''}
          onChange={(e) => onChange({ ...song, title: e.target.value })}
        />
        <input
          className="admin-input"
          placeholder="艺人"
          value={song.artist || ''}
          onChange={(e) => onChange({ ...song, artist: e.target.value })}
        />
      </div>
      <div className="pl-song-side">
        <span className="pl-song-dur">{song.duration || formatDuration(song.durationMs)}</span>
        <button className="admin-btn admin-btn--ghost" title="试听" disabled={!previewUrl} onClick={toggle}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="admin-btn admin-btn--ghost" onClick={onReplace} title="从 Apple Music 重新选歌">
          换一首
        </button>
        <button className="admin-btn admin-btn--ghost" onClick={() => onMove(-1)} disabled={index === 0}>
          ↑
        </button>
        <button className="admin-btn admin-btn--ghost" onClick={() => onMove(1)} disabled={index === total - 1}>
          ↓
        </button>
        <button className="admin-btn admin-btn--danger" onClick={onDelete}>
          删
        </button>
      </div>
      <audio ref={audioRef} onEnded={() => setPlaying(false)} hidden />
    </div>
  )
}

// ── 歌曲列表编辑器（二级视图）────────────────────────────────
function SongListEditor({
  kind,
  plId,
  songs,
  onChange,
}: {
  kind: 'mood' | 'monthly'
  plId: string
  songs: SongRow[]
  onChange: (next: SongRow[]) => void
}) {
  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'replace'; idx: number } | null>(null)

  const newId = () => `${plId}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

  const handlePick = (picked: Omit<SongRow, 'id'>) => {
    if (!picker) return
    if (picker.mode === 'add') {
      onChange([...songs, { ...picked, id: newId() }])
    } else {
      const idx = picker.idx
      onChange(songs.map((s, i) => (i === idx ? { ...picked, id: s.id } : s)))
    }
    setPicker(null)
  }

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= songs.length) return
    const next = songs.slice()
    const [tmp] = next.splice(idx, 1)
    next.splice(j, 0, tmp)
    onChange(next)
  }

  return (
    <div>
      <div className="pl-edit-songs-head" style={{ marginBottom: 12 }}>
        <span className="pl-group-count">共 {songs.length} 首 · 支持试听 / 换歌 / 排序 / 删除</span>
        <button className="admin-btn admin-btn--primary" onClick={() => setPicker({ mode: 'add' })}>
          ＋ 从 Apple Music 添加歌曲
        </button>
      </div>

      {songs.length === 0 ? (
        <div className="admin-empty">还没有歌曲，点右上角「从 Apple Music 添加歌曲」开始</div>
      ) : (
        songs.map((s, i) => (
          <SongEditorRow
            key={s.id || `${kind}-${i}`}
            song={s}
            index={i}
            total={songs.length}
            onChange={(next) => onChange(songs.map((x, k) => (k === i ? next : x)))}
            onDelete={() => onChange(songs.filter((_, k) => k !== i))}
            onMove={(d) => move(i, d)}
            onReplace={() => setPicker({ mode: 'replace', idx: i })}
          />
        ))
      )}

      {picker && (
        <div className="apicker-overlay" onClick={() => setPicker(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <AppleSongPicker onPick={handlePick} onClose={() => setPicker(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

function PlaylistsPanel({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [data, setData] = useState<PlaylistData>({ moodPlaylists: [], monthlyShares: [], allTags: [] })
  const [meta, setMeta] = useState<{ source?: string; updatedAt?: string }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  /** 二级视图：当前打开的歌单（null = 歌单列表） */
  const [open, setOpen] = useState<{ kind: 'mood' | 'monthly'; id: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api('/api/data')
      const json = await res.json()
      if (json.data) {
        setData({
          moodPlaylists: json.data.moodPlaylists || [],
          monthlyShares: json.data.monthlyShares || [],
          allTags: json.data.allTags || [],
        })
        setMeta({ source: json.source, updatedAt: json.updatedAt })
      } else {
        setData({ moodPlaylists: [], monthlyShares: [], allTags: [] })
        setMeta({ source: 'empty' })
      }
      setDirty(false)
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

  /** 在可变副本上执行修改 */
  const upd = (fn: (d: PlaylistData) => void) => {
    setData((prev) => {
      const d = structuredClone(prev) as PlaylistData
      fn(d)
      return d
    })
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await api('/api/data', { method: 'PUT', body: JSON.stringify(data) })
      const json = await res.json()
      if (res.ok) {
        onToast('ok', '已保存到 KV')
        setMeta({ source: 'kv', updatedAt: new Date().toISOString() })
        setDirty(false)
      } else onToast('err', json.error || '保存失败')
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const loadSeed = () => {
    setData(
      structuredClone({
        moodPlaylists: MOOD_PLAYLISTS,
        monthlyShares: MONTHLY_SHARES,
        allTags: [],
      }) as PlaylistData,
    )
    setDirty(true)
    onToast('ok', '已载入静态种子，编辑后点保存')
  }

  const addMood = () =>
    upd((d) => {
      const next = String(d.moodPlaylists.length + 1).padStart(2, '0')
      d.moodPlaylists.push({ id: next, title: '新歌单', mood: '', date: '', note: '', author: '', cover: '', songList: [] })
    })
  const addMonthly = () =>
    upd((d) => {
      const n = d.monthlyShares.length + 1
      d.monthlyShares.push({ id: `m${String(n).padStart(2, '0')}`, monthNo: n, monthCn: `${n}月`, monthEn: '', titleCn: '', titleEn: '', author: '', cover: '', tracks: [] })
    })

  // ── 二级视图：管理歌单内的歌曲 ──
  if (open) {
    const kind = open.kind
    const id = open.id
    const target =
      kind === 'mood' ? data.moodPlaylists.find((p) => p.id === id) : data.monthlyShares.find((m) => m.id === id)
    if (!target) return null
    const title =
      kind === 'mood'
        ? (target as MoodPlaylistRow).title
        : (target as MonthlyShareRow).titleCn || (target as MonthlyShareRow).monthCn || ''
    const songs: SongRow[] = kind === 'mood' ? (target as MoodPlaylistRow).songList : (target as MonthlyShareRow).tracks

    const setSongs = (next: SongRow[]) =>
      upd((d) => {
        if (kind === 'mood') {
          const p = d.moodPlaylists.find((x) => x.id === id)
          if (p) p.songList = next
        } else {
          const m = d.monthlyShares.find((x) => x.id === id)
          if (m) m.tracks = next
        }
      })

    return (
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-h2">歌曲管理 · {title}</h2>
            <p className="admin-meta">
              二级 · 歌曲在歌单下独立增删改 · <span className="admin-tag">{songs.length} 首</span>
              {dirty && (
                <span className="admin-tag" style={{ marginLeft: 6 }}>
                  未保存
                </span>
              )}
            </p>
          </div>
          <div className="admin-actions">
            <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving || !dirty}>
              {saving ? '保存中…' : '保存'}
            </button>
            <button className="admin-btn admin-btn--ghost" onClick={() => setOpen(null)}>
              ← 返回歌单列表
            </button>
          </div>
        </div>
        <SongListEditor kind={kind} plId={id} songs={songs} onChange={setSongs} />
      </section>
    )
  }

  // ── 一级视图：歌单列表（编辑歌单信息）──
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2 className="admin-h2">歌单内容管理</h2>
          <p className="admin-meta">
            来源：
            <span className="admin-tag">
              {meta.source === 'kv' ? '线上 KV' : meta.source === 'empty' ? '空' : '—'}
            </span>
            {' · 心情刊 '}<span className="admin-tag">{data.moodPlaylists.length}</span>
            {' · 月度 '}<span className="admin-tag">{data.monthlyShares.length}</span>
            {dirty && <span className="admin-tag" style={{ marginLeft: 6 }}>未保存</span>}
            {meta.updatedAt && <> · 更新于 {new Date(meta.updatedAt).toLocaleString('zh-CN')}</>}
          </p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving || !dirty}>
            {saving ? '保存中…' : '保存'}
          </button>
          <button className="admin-btn admin-btn--ghost" onClick={loadSeed}>
            载入种子
          </button>
          <button className="admin-btn admin-btn--ghost" onClick={addMood}>
            ＋ 心情刊
          </button>
          <button className="admin-btn admin-btn--ghost" onClick={addMonthly}>
            ＋ 月度
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">读取中…</div>
      ) : (
        <div className="pl-edit-wrap">
          {/* ── 心情歌单（一级） ── */}
          <div className="pl-group-head">
            <h3 className="pl-h3">心情歌单</h3>
            <span className="pl-group-count">{data.moodPlaylists.length} 期</span>
          </div>
          {data.moodPlaylists.map((pl, i) => (
            <div className="pl-edit-card" key={pl.id || i}>
              <div className="pl-edit-card-head">
                <span className="pl-card-id">心情刊 {pl.id}</span>
                <div className="pl-card-foot-actions">
                  <button className="admin-btn admin-btn--primary" onClick={() => setOpen({ kind: 'mood', id: pl.id })}>
                    管理歌曲（{pl.songList.length}）
                  </button>
                  <button
                    className="admin-btn admin-btn--danger"
                    onClick={() => {
                      if (confirm(`删除歌单「${pl.title}」？`)) upd((d) => d.moodPlaylists.splice(i, 1))
                    }}
                  >
                    删除歌单
                  </button>
                </div>
              </div>

              <div className="pl-edit-grid">
                <TField label="名称" value={pl.title} onChange={(v) => upd((d) => (d.moodPlaylists[i].title = v))} />
                <TField label="作者" value={pl.author} placeholder="Jack Tan" onChange={(v) => upd((d) => (d.moodPlaylists[i].author = v))} />
                <TField label="心情" value={pl.mood} onChange={(v) => upd((d) => (d.moodPlaylists[i].mood = v))} />
                <TField label="日期" value={pl.date} placeholder="2026.01" onChange={(v) => upd((d) => (d.moodPlaylists[i].date = v))} />
                <TField label="封面 URL" value={pl.cover} placeholder="留空用首曲目封面" onChange={(v) => upd((d) => (d.moodPlaylists[i].cover = v))} wide />
              </div>
              <TField label="手记" value={pl.note} onChange={(v) => upd((d) => (d.moodPlaylists[i].note = v))} wide />
            </div>
          ))}

          {/* ── 月度精选（一级） ── */}
          <div className="pl-group-head" style={{ marginTop: 32 }}>
            <h3 className="pl-h3">月度精选</h3>
            <span className="pl-group-count">{data.monthlyShares.length} 期</span>
          </div>
          {data.monthlyShares.map((m, i) => (
            <div className="pl-edit-card" key={m.id || i}>
              <div className="pl-edit-card-head">
                <span className="pl-card-id">{m.monthCn || m.id}</span>
                <div className="pl-card-foot-actions">
                  <button className="admin-btn admin-btn--primary" onClick={() => setOpen({ kind: 'monthly', id: m.id })}>
                    管理歌曲（{m.tracks.length}）
                  </button>
                  <button
                    className="admin-btn admin-btn--danger"
                    onClick={() => {
                      if (confirm(`删除月度「${m.titleCn || m.monthCn}」？`)) upd((d) => d.monthlyShares.splice(i, 1))
                    }}
                  >
                    删除月度
                  </button>
                </div>
              </div>

              <div className="pl-edit-grid">
                <TField label="中文标题" value={m.titleCn} onChange={(v) => upd((d) => (d.monthlyShares[i].titleCn = v))} />
                <TField label="英文标题" value={m.titleEn} onChange={(v) => upd((d) => (d.monthlyShares[i].titleEn = v))} />
                <TField label="月份" value={m.monthCn} onChange={(v) => upd((d) => (d.monthlyShares[i].monthCn = v))} />
                <TField label="作者" value={m.author} placeholder="Jack Tan" onChange={(v) => upd((d) => (d.monthlyShares[i].author = v))} />
                <TField label="封面 URL" value={m.cover} placeholder="留空用首曲目封面" onChange={(v) => upd((d) => (d.monthlyShares[i].cover = v))} wide />
              </div>
            </div>
          ))}

          <p className="pl-hint">
            歌单为一级（此处编辑信息），点「管理歌曲」进入二级管理歌曲；歌曲可从 Apple Music 曲库检索选择、试听并自动带入 URL 等字段。所有修改需点右上「保存」写入线上 KV，前端 ≤60s 内可见。
          </p>
        </div>
      )}
    </section>
  )
}

// ── 投稿审核 ──────────────────────────────────────────────
type Submission = {
  id: string
  siteId?: string
  type: string
  linkUrl?: string
  songList?: string
  playlistName: string
  authorName: string
  description?: string
  tags?: string[]
  status: 'pending' | 'approved' | 'rejected' | 'merged'
  reviewNote?: string
  createdAt: string
}

const SITE_LABELS: Record<string, string> = {
  studio: '门户',
  'jack-tan': 'Jack Tan',
  'jack-pose': 'Jack Pose',
  'jack-wave': 'Jack Wave',
  'jack-talk': 'Jack Talk',
  'jack-craft': 'Jack Craft',
}

function SubmissionsPanel({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [list, setList] = useState<Submission[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'merged'>('all')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (filter !== 'all') qs.set('status', filter)
      const suffix = qs.toString() ? `?${qs.toString()}` : ''
      const res = await api(`/api/submissions${suffix}`)
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
        body: JSON.stringify({ id, status, reviewNote: notes[id] || undefined }),
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

  const merge = async (id: string) => {
    if (!confirm('将该投稿并入 Jack Wave 已发布歌单？（曲目为文本行，可稍后在歌单管理补全音源）')) return
    setBusyId(id)
    try {
      const res = await api('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({ action: 'merge', id }),
      })
      const json = await res.json()
      if (res.ok) {
        onToast('ok', '已并入歌单（≤60s 前端可见）')
        load()
      } else onToast('err', json.error || '并入失败')
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', '并入失败')
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
          <h2 className="admin-h2">Jack Wave 歌单投稿</h2>
          <p className="admin-meta">
            待审 <span className="admin-tag">{counts.pending}</span> · 通过 {counts.approved} · 拒绝{' '}
            {counts.rejected} · 共 {counts.total}
          </p>
        </div>
        <div className="admin-filters">
          {(['all', 'pending', 'approved', 'rejected', 'merged'] as const).map((f) => (
            <button
              key={f}
              className={`admin-filter ${filter === f ? 'is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all'
                ? '全部'
                : f === 'pending'
                  ? '待审'
                  : f === 'approved'
                    ? '通过'
                    : f === 'merged'
                      ? '已并入'
                      : '拒绝'}
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
                  <div className="admin-card-title">{s.playlistName || '（反馈）'}</div>
                  <div className="admin-card-author">
                    {s.authorName ? `by ${s.authorName}` : '匿名'} ·{' '}
                    {SITE_LABELS[s.siteId || 'jack-wave'] || s.siteId} · {s.type}
                  </div>
                </div>
                <span className={`admin-status admin-status--${s.status === 'merged' ? 'approved' : s.status}`}>
                  {s.status === 'pending'
                    ? '待审'
                    : s.status === 'approved'
                      ? '已通过'
                      : s.status === 'merged'
                        ? '已并入'
                        : '已拒绝'}
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
              {s.reviewNote && <p className="admin-card-desc">审核备注：{s.reviewNote}</p>}
              <div className="admin-card-foot">
                <span className="admin-card-time">{new Date(s.createdAt).toLocaleString('zh-CN')}</span>
                <div className="admin-card-actions">
                  {s.status === 'approved' &&
                    (s.siteId || 'jack-wave') === 'jack-wave' &&
                    ['link', 'manual', 'screenshot'].includes(s.type) && (
                      <button
                        className="admin-btn admin-btn--primary"
                        disabled={busyId === s.id}
                        onClick={() => merge(s.id)}
                      >
                        并入歌单
                      </button>
                    )}
                  {s.status !== 'approved' && s.status !== 'merged' && (
                    <button
                      className="admin-btn admin-btn--ok"
                      disabled={busyId === s.id}
                      onClick={() => act(s.id, 'approved', '通过')}
                    >
                      通过
                    </button>
                  )}
                  {s.status !== 'rejected' && s.status !== 'merged' && (
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
              {s.status === 'pending' && (
                <input
                  className="admin-input"
                  style={{ marginTop: 10 }}
                  placeholder="审核备注（可选，随通过/拒绝保存）"
                  value={notes[s.id] || ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [s.id]: e.target.value }))}
                />
              )}
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

// ── 文章内容中枢（P1）──────────────────────────────────────
interface ContentItem {
  id: string
  siteId: string
  type: string
  status: 'draft' | 'published' | 'archived'
  title: string
  summary?: string
  body?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

const CONTENT_SITE = 'studio'
const CONTENT_TYPE = 'article'

function contentKey(siteId: string, type: string, id: string): string {
  return `site:${siteId}:content:${type}:${id}`
}

function newSlug(): string {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '')
  return `note-${ymd}-${Math.random().toString(36).slice(2, 6)}`
}

function ContentPanel({ onToast }: { onToast: (k: 'ok' | 'err', m: string) => void }) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ siteId: CONTENT_SITE, type: CONTENT_TYPE, limit: '100' })
      if (statusFilter !== 'all') qs.set('status', statusFilter)
      const res = await api(`/api/content?${qs.toString()}`)
      const json = await res.json()
      if (res.ok) setItems(json.items || [])
      else onToast('err', json.error || '加载失败')
    } catch (e) {
      if ((e as Error).message === 'AUTH') return
      onToast('err', '加载失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, onToast])

  useEffect(() => {
    load()
  }, [load])

  const startNew = () => {
    const now = new Date().toISOString()
    setEditing({
      id: newSlug(),
      siteId: CONTENT_SITE,
      type: CONTENT_TYPE,
      status: 'draft',
      title: '',
      summary: '',
      body: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    })
  }

  const openItem = async (item: ContentItem) => {
    try {
      const res = await api(`/api/content?key=${encodeURIComponent(contentKey(item.siteId, item.type, item.id))}`)
      const json = await res.json()
      if (res.ok) setEditing(json.content)
      else onToast('err', json.error || '读取失败')
    } catch (e) {
      if ((e as Error).message !== 'AUTH') onToast('err', '读取失败')
    }
  }

  const save = async (statusOverride?: ContentItem['status']) => {
    if (!editing) return
    if (!editing.title.trim()) {
      onToast('err', '标题不能为空')
      return
    }
    setSaving(true)
    try {
      const payload = { ...editing, status: statusOverride || editing.status }
      const key = contentKey(editing.siteId, editing.type, editing.id)
      const res = await api(`/api/content?key=${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok) {
        onToast('ok', statusOverride === 'published' ? '已保存并发布' : '已保存')
        setEditing(json.content)
        load()
      } else onToast('err', json.error || '保存失败')
    } catch (e) {
      if ((e as Error).message !== 'AUTH') onToast('err', '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (action: 'publish' | 'unpublish' | 'archive') => {
    if (!editing) return
    setSaving(true)
    try {
      const key = contentKey(editing.siteId, editing.type, editing.id)
      const res = await api('/api/content', {
        method: 'POST',
        body: JSON.stringify({ action, key }),
      })
      const json = await res.json()
      if (res.ok) {
        onToast('ok', action === 'publish' ? '已发布' : action === 'unpublish' ? '已下线' : '已归档')
        setEditing(json.content)
        load()
      } else onToast('err', json.error || '操作失败')
    } catch (e) {
      if ((e as Error).message !== 'AUTH') onToast('err', '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!editing) return
    if (!confirm('确认删除这篇文章？（不可恢复）')) return
    setSaving(true)
    try {
      const key = contentKey(editing.siteId, editing.type, editing.id)
      const res = await api(`/api/content?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (res.ok) {
        onToast('ok', '已删除')
        setEditing(null)
        load()
      } else onToast('err', '删除失败')
    } catch (e) {
      if ((e as Error).message !== 'AUTH') onToast('err', '删除失败')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-h2">编辑文章</h2>
            <p className="admin-meta">
              {contentKey(editing.siteId, editing.type, editing.id)} · 状态{' '}
              <span className="admin-tag">{editing.status}</span>
            </p>
          </div>
          <div className="admin-actions">
            <button className="admin-btn admin-btn--ghost" onClick={() => setEditing(null)}>
              ← 返回列表
            </button>
          </div>
        </div>

        <label className="admin-meta">标题</label>
        <input
          className="admin-input"
          value={editing.title}
          maxLength={120}
          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
        />
        <label className="admin-meta" style={{ display: 'block', marginTop: 10 }}>
          Slug（URL 标识，创建后不可改）
        </label>
        <input className="admin-input" value={editing.id} disabled />
        <label className="admin-meta" style={{ display: 'block', marginTop: 10 }}>
          摘要（列表页与分享卡片用，≤300 字）
        </label>
        <textarea
          className="admin-textarea"
          rows={2}
          value={editing.summary || ''}
          onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
        />
        <label className="admin-meta" style={{ display: 'block', marginTop: 10 }}>
          标签（逗号分隔，≤8 个）
        </label>
        <input
          className="admin-input"
          value={(editing.tags || []).join(', ')}
          onChange={(e) =>
            setEditing({
              ...editing,
              tags: e.target.value
                .split(/[,，]/)
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 8),
            })
          }
        />
        <label className="admin-meta" style={{ display: 'block', marginTop: 10 }}>
          正文（Markdown）
        </label>
        <textarea
          className="admin-textarea"
          rows={18}
          value={editing.body || ''}
          onChange={(e) => setEditing({ ...editing, body: e.target.value })}
        />

        <div className="admin-actions" style={{ marginTop: 14, flexWrap: 'wrap' }}>
          <button className="admin-btn admin-btn--ghost" disabled={saving} onClick={() => save()}>
            保存草稿
          </button>
          {editing.status !== 'published' ? (
            <button className="admin-btn admin-btn--primary" disabled={saving} onClick={() => save('published')}>
              保存并发布
            </button>
          ) : (
            <button className="admin-btn admin-btn--warn" disabled={saving} onClick={() => changeStatus('unpublish')}>
              下线
            </button>
          )}
          {editing.status === 'published' && (
            <button className="admin-btn admin-btn--ghost" disabled={saving} onClick={() => changeStatus('archive')}>
              归档
            </button>
          )}
          <button className="admin-btn admin-btn--danger" disabled={saving} onClick={remove}>
            删除
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2 className="admin-h2">文章（Notes）</h2>
          <p className="admin-meta">内容中枢首个跨站内容类型 · 发布后经 /notes 对外可见（≤60s）</p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn admin-btn--primary" onClick={startNew}>
            ＋ 新文章
          </button>
        </div>
      </div>

      <div className="admin-filters">
        {(['all', 'draft', 'published', 'archived'] as const).map((f) => (
          <button
            key={f}
            className={`admin-filter ${statusFilter === f ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(f)}
          >
            {f === 'all' ? '全部' : f === 'draft' ? '草稿' : f === 'published' ? '已发布' : '已归档'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-loading">读取中…</div>
      ) : items.length === 0 ? (
        <div className="admin-empty">暂无文章，点右上角「新文章」开始</div>
      ) : (
        <div className="admin-cards">
          {items.map((it) => (
            <article key={it.id} className="admin-card">
              <div className="admin-card-top">
                <div>
                  <div className="admin-card-title">{it.title || '（无标题）'}</div>
                  <div className="admin-card-author">
                    /notes/{it.id} · 更新于 {new Date(it.updatedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <span
                  className={`admin-status admin-status--${it.status === 'published' ? 'approved' : it.status === 'draft' ? 'pending' : 'rejected'}`}
                >
                  {it.status === 'draft' ? '草稿' : it.status === 'published' ? '已发布' : '已归档'}
                </span>
              </div>
              {it.summary && <p className="admin-card-desc">{it.summary}</p>}
              <div className="admin-card-foot">
                <span className="admin-card-time">{(it.tags || []).map((t) => `#${t}`).join(' ')}</span>
                <div className="admin-card-actions">
                  <button className="admin-btn admin-btn--ghost" onClick={() => openItem(it)}>
                    编辑
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

// ── 操作审计面板（P0-4 + 迷你回滚）──────────────────────────
interface AuditEntry {
  at: string
  op: string
  actor: string
  target: string
  summary: string
  before?: any
  after?: any
}

function AuditPanel() {
  const now = new Date(Date.now() + 8 * 3600 * 1000)
  const [month, setMonth] = useState(now.toISOString().slice(0, 7))
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api(`/api/audit?month=${month}`)
      const json = await res.json()
      if (res.ok) setEntries(json.entries || [])
    } catch {
      /* AUTH 等静默 */
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    load()
  }, [load])

  const canRollback = (e: AuditEntry) =>
    !!e.before && (e.target.startsWith('site:') || e.target === 'data:playlists')

  const rollback = async (e: AuditEntry) => {
    if (!confirm(`将「${e.target}」还原到该操作之前的状态？`)) return
    setBusy(true)
    try {
      let res: Response
      if (e.target === 'data:playlists') {
        res = await api('/api/data', { method: 'PUT', body: JSON.stringify(e.before) })
      } else {
        res = await api(`/api/content?key=${encodeURIComponent(e.target)}`, {
          method: 'PUT',
          body: JSON.stringify(e.before),
        })
      }
      const json = await res.json().catch(() => ({}))
      alert(res.ok ? '已还原（≤60s 前端可见）' : json.error || '还原失败')
      load()
    } catch {
      alert('还原失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2 className="admin-h2">操作审计</h2>
          <p className="admin-meta">所有写操作留痕 · 带快照的条目可一键还原</p>
        </div>
        <div className="admin-actions">
          <input
            className="admin-input"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || month)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">读取中…</div>
      ) : entries.length === 0 ? (
        <div className="admin-empty">本月暂无操作记录</div>
      ) : (
        <table className="admin-stats-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>操作</th>
              <th>对象</th>
              <th>摘要</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td className="admin-stats-num">{new Date(e.at).toLocaleString('zh-CN')}</td>
                <td className="admin-stats-num">{e.op}</td>
                <td style={{ maxWidth: 220, wordBreak: 'break-all' }}>{e.target}</td>
                <td>{e.summary}</td>
                <td>
                  {canRollback(e) && (
                    <button className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => rollback(e)}>
                      还原
                    </button>
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
