import { useEffect, useState } from 'react'
import { SplitHeading } from '../../system/SplitHeading'
import { Reveal } from '../../system/Reveal'
import { MONTHLY_SHARES, fetchMonthlyShares, type MonthlyShare as MonthlyShareData } from './monthlyData'
import type { Track } from './musicData'
import { SRC } from './musicData'
import { useWavePlayer } from './WavePlayerProvider'
import { Cover } from './Cover'
import { useMonthMeta, formatDuration } from './trackMeta'

/**
 * 月度歌单 — the monthly playlist block. Keeps the two-section structure
 * (月度歌单 / 心情歌单) intact: this is the monthly half. 1月–8月 switch
 * back and forth via a tab row + ‹ › arrows; the active month's playlist cover
 * defaults to its first song, and every song carries its own cover.
 *
 * Real audio: each track resolves its Apple Music 30s preview URL (and duration
 * + cover) from a single bulk iTunes lookup per month, so playback uses actual
 * song clips instead of the placeholder bed. Falls back gracefully to the
 * ambient bed when a preview is unavailable.
 *
 * Backend-editable: the share list is pulled from /api/public-data (KV) when
 * present, otherwise the static seed — so /admin edits flow through.
 */
export function MonthlyShare() {
  const [shares, setShares] = useState<MonthlyShareData[]>(MONTHLY_SHARES)
  // 默认显示「当前月份」的歌单：取系统当前月（1–12），若当月无歌单（数据仅 1–8 月）
  // 则回退到最后一个可用月份。
  const [monthNo, setMonthNo] = useState(() => {
    const cur = new Date().getMonth() + 1
    return Math.min(Math.max(1, cur), MONTHLY_SHARES.length)
  })

  useEffect(() => {
    let cancelled = false
    fetchMonthlyShares()
      .then((s) => {
        if (!cancelled && s.length > 0) setShares(s)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const month = shares[monthNo - 1] ?? shares[0]
  const TOTAL = shares.length

  const ids = month.tracks.map((t) => t.appleTrackId).filter((x): x is string => Boolean(x))
  const metaMap = useMonthMeta(ids)

  const tracks: Track[] = month.tracks.map((s, i) => {
    const id = `m${month.monthNo}-${i + 1}`
    const meta = s.appleTrackId ? metaMap[s.appleTrackId] : undefined
    return {
      id,
      title: s.title,
      artist: s.artist,
      src: meta?.previewUrl || SRC,
      duration: formatDuration(meta?.durationMs),
      appleTrackId: s.appleTrackId,
      applePreviewUrl: meta?.previewUrl,
      appleArtworkUrl: meta?.artworkUrl || null,
      // Powers the player's "Apple Music" jump button: prefer the curated URL
      // from the data file, fall back to whatever the lookup returned.
      appleMusicUrl: s.appleMusicUrl || meta?.trackViewUrl || null,
      durationMs: meta?.durationMs,
    }
  })
  const { currentId, isPlaying, toggleTrack } = useWavePlayer()
  // 运行时兜底：剔除「既无试听音频、又无 Apple Music 跳转链接」的失效歌曲，
  // 确保展示与播放队列里每一首都有可访问的链接。（当前 96 首全部有效，
  // 此过滤器用于未来某条链接失效时自动隐藏，避免出现点不动的死链。）
  const validTracks = tracks.filter((t) => t.applePreviewUrl || t.appleMusicUrl)
  const current = validTracks.find((t) => t.id === currentId) ?? null

  const go = (dir: number) =>
    setMonthNo((n) => Math.min(TOTAL, Math.max(1, n + dir)))
  const first = validTracks[0] ?? month.tracks[0]
  const playlistSeed = first ? `${first.id}${first.title}` : month.id
  const firstArt = month.cover || (first?.appleTrackId ? metaMap[first.appleTrackId]?.artworkUrl : null)

  return (
    <section className="wave-section">
      <div className="wave-works-head">
        <SplitHeading as="h2" className="wave-h2" text="月度歌单" splitBy="chars" />
        <span className="wave-works-badge">MONTHLY · 1–8月</span>
      </div>

      <Reveal className="wave-monthly">
        {/* ── Month switcher (back & forth) ── */}
        <div className="wave-monthly-nav">
          <button
            type="button"
            className="wave-monthly-arrow"
            onClick={() => go(-1)}
            disabled={monthNo === 1}
            aria-label="上一月"
          >
            ‹
          </button>
          <div className="wave-monthly-tabs" role="tablist" aria-label="选择月份">
            {shares.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={m.monthNo === monthNo}
                className={`wave-monthly-tab ${m.monthNo === monthNo ? 'is-active' : ''}`}
                onClick={() => setMonthNo(m.monthNo)}
              >
                {m.monthCn}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="wave-monthly-arrow"
            onClick={() => go(1)}
            disabled={monthNo === TOTAL}
            aria-label="下一月"
          >
            ›
          </button>
        </div>

        {/* ── Active month (remounts on switch → fade transition) ── */}
        <div className="wave-monthly-body" key={month.id}>
          <div className="wave-monthly-head">
            <div className="wave-monthly-head-info">
              <Cover
                seed={playlistSeed}
                title={first?.title ?? month.monthCn}
                appleTrackId={first?.appleTrackId}
                artwork={firstArt}
                className="wave-monthly-cover"
              />
              <div className="wave-monthly-meta">
                <span className="wave-monthly-en">{month.monthEn.toUpperCase()}</span>
                <h3 className="wave-monthly-title">
                  {month.monthCn} · {month.titleCn}
                </h3>
                <span className="wave-monthly-sub">{month.titleEn}</span>
                {month.author && (
                  <span className="wave-monthly-sub">编选 · {month.author}</span>
                )}
                <span className="wave-monthly-count">{validTracks.length} TRACKS</span>
              </div>
            </div>
            <div className="wave-monthly-eq" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <ul className="wave-monthly-list">
            {validTracks.map((t) => {
              const active = currentId === t.id
              const art = t.appleTrackId ? metaMap[t.appleTrackId]?.artworkUrl : null
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`wave-monthly-track ${active ? 'is-current' : ''}`}
                    onClick={() => toggleTrack(t, validTracks)}
                    aria-pressed={active}
                  >
                    <Cover
                      seed={`${t.id}${t.title}`}
                      title={t.title}
                      appleTrackId={t.appleTrackId ?? undefined}
                      artwork={art}
                      className="wave-monthly-cover-sm"
                    />
                    <span className="wave-monthly-play">
                      {active && isPlaying ? '❚❚' : '▶'}
                    </span>
                    <span className="wave-monthly-track-main">
                      <span className="wave-monthly-track-title">{t.title}</span>
                      <span className="wave-monthly-track-artist">{t.artist}</span>
                    </span>
                    {t.duration && <span className="wave-monthly-track-dur">{t.duration}</span>}
                    {t.appleMusicUrl && (
                      <a
                        className="wave-monthly-link"
                        href={t.appleMusicUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="在 Apple Music 打开"
                      >
                        ♪
                      </a>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="wave-monthly-now">
            {current
              ? `${isPlaying ? 'NOW PLAYING' : 'PAUSED'} · ${current.title} — ${current.artist}`
              : '选一首，开始收听'}
          </p>
        </div>
      </Reveal>
    </section>
  )
}
