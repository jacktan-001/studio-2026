import { useEffect, useRef, useState } from 'react'
import { useWavePlayer } from './WavePlayerProvider'
import { Cover } from './Cover'

/**
 * The one and only persistent player — a CIRCULAR orb pinned bottom-right.
 *
 * Mounted once at the app root, outside the router, so it survives navigation
 * and keeps playing. Collapsed it is purely a disc: album art spinning inside a
 * ring-shaped progress track. Tapping the chevron fans out a panel with the
 * title, a seek bar, prev/next, volume and an Apple Music jump button.
 *
 * This replaces BOTH previous bottom-docked players (the ambient `AudioShell`
 * pill and the rectangular `WavePlayerBar`), which were the source of the
 * "two players" duplication on Jack Wave.
 */

const R = 34 // ring radius
const C = 2 * Math.PI * R

function mmss(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00'
  const t = Math.floor(sec)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

export function WavePlayerOrb() {
  const {
    current,
    isPlaying,
    progress,
    elapsed,
    duration,
    volume,
    muted,
    loading,
    error,
    toggleCurrent,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
  } = useWavePlayer()

  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Collapse when clicking outside / pressing Escape (mobile-friendly).
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!current) return null

  const appleUrl = current.appleMusicUrl || ''
  const hasApple = Boolean(appleUrl)

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    seek((e.clientX - r.left) / r.width)
  }

  return (
    <div
      ref={rootRef}
      className="wave-orb"
      data-playing={isPlaying}
      data-open={open}
      role="region"
      aria-label="全局播放器"
    >
      {/* ── Expanding detail panel ─────────────────────────── */}
      <div className="wave-orb-panel" aria-hidden={!open}>
        <div className="wave-orb-meta">
          <span className="wave-orb-title" title={current.title}>
            {current.title}
          </span>
          <span className="wave-orb-artist" title={current.artist}>
            {current.artist}
          </span>
        </div>

        <div
          className="wave-orb-seek"
          onClick={onSeek}
          role="slider"
          tabIndex={open ? 0 : -1}
          aria-label="播放进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
        <div className="wave-orb-time">
          <span>{mmss(elapsed)}</span>
          <span>{mmss(duration)}</span>
        </div>

        <div className="wave-orb-row">
          <button type="button" className="wave-orb-mini" onClick={prev} aria-label="上一首">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M7 6v12M19 6l-9 6 9 6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="wave-orb-mini" onClick={next} aria-label="下一首">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M17 6v12M5 6l9 6-9 6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            className="wave-orb-mini"
            onClick={toggleMute}
            aria-label={muted ? '取消静音' : '静音'}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4zM17 9l4 6M21 9l-4 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4zM17 8.5a5 5 0 010 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <input
            className="wave-orb-vol"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="音量"
            tabIndex={open ? 0 : -1}
          />

          {/* Apple Music jump — disabled when the track has no page. */}
          {hasApple ? (
            <a
              className="wave-orb-apple"
              href={appleUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`在 Apple Music 中打开《${current.title}》`}
              title="在 Apple Music 中打开"
              tabIndex={open ? 0 : -1}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Apple Music</span>
            </a>
          ) : (
            <span className="wave-orb-apple is-disabled" aria-disabled="true" title="该曲目暂无 Apple Music 链接">
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>暂无链接</span>
            </span>
          )}
        </div>
      </div>

      {/* ── The disc itself ────────────────────────────────── */}
      <div className="wave-orb-disc-wrap">
        <button
          type="button"
          className="wave-orb-disc"
          onClick={toggleCurrent}
          aria-label={isPlaying ? `暂停 ${current.title}` : `播放 ${current.title}`}
        >
          <svg className="wave-orb-ring" viewBox="0 0 80 80" aria-hidden="true">
            <circle className="wave-orb-ring-bg" cx="40" cy="40" r={R} />
            <circle
              className="wave-orb-ring-fg"
              cx="40"
              cy="40"
              r={R}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - Math.min(1, Math.max(0, progress)))}
            />
          </svg>
          <span className="wave-orb-art">
            <Cover
              seed={`${current.id}${current.title}`}
              title={current.title}
              artwork={current.appleArtworkUrl}
              appleTrackId={current.appleTrackId}
              className="wave-orb-art-img"
            />
          </span>
          <span className="wave-orb-icon" aria-hidden="true">
            {loading ? (
              <span className="wave-orb-spinner" />
            ) : isPlaying ? (
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            )}
          </span>
        </button>

        <button
          type="button"
          className="wave-orb-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? '收起播放器' : '展开播放器'}
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Playback error toast ───────────────────────────── */}
      {error && (
        <p className="wave-orb-error" role="status" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  )
}
