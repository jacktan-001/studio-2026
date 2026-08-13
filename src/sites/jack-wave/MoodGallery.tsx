import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MOOD_PLAYLISTS, type MoodPlaylist, type Track } from './musicData'
import { useWavePlayer } from './WavePlayerProvider'
import { Cover } from './Cover'
import { useMotionPrefs } from '../../core/MotionPrefsProvider'

/**
 * 心情歌单 — 3D 回环长廊。
 *
 * 6 张歌单作为卡片在 3D 空间中循环排列成一圈（cylinder），鼠标滚轮驱动整圈
 * 绕 Y 轴旋转，产生「立体环绕 / 回环长廊」效果：滚动时卡片依次转到正面，
 * 正面卡片放大并展开曲目列表。每张卡片接入真实 Apple 试听（30s 预览）。
 *
 * 设计参考旧 jack-wave 的杂志式卡片：大封面 + 渐变蒙版 + display 标题 +
 * mono 风格标签 + 手记，与站点玻璃拟态系统一致。
 *
 * 可访问性：prefers-reduced-motion 或窄屏下退化为可滚动的卡片墙（无 3D 旋转）。
 */

const COUNT = MOOD_PLAYLISTS.length
const STEP = 360 / COUNT // 每张卡片之间的角度间隔

export function MoodGallery() {
  const playlists = MOOD_PLAYLISTS
  const { reduced } = useMotionPrefs()

  // 所有曲目展平，供单一全局播放器实例使用（一次只播一首）
  const allTracks = useMemo(() => playlists.flatMap((p) => p.songList), [playlists])
  const { currentId, isPlaying, progress, toggleTrack } = useWavePlayer()

  // 当前旋转角度（度）。target 由滚轮/按钮更新，angle 在 RAF 中平滑逼近。
  const [angle, setAngle] = useState(0)
  const targetRef = useRef(0)
  const angleRef = useRef(0)
  const rafRef = useRef(0)

  // 当前正面卡片索引
  const activeIndex = ((Math.round(-angleRef.current / STEP) % COUNT) + COUNT) % COUNT

  const goTo = useCallback((delta: number) => {
    targetRef.current -= delta * STEP
    setAngle(targetRef.current)
  }, [])

  // 平滑旋转循环（仅在非 reduced-motion 时）
  useEffect(() => {
    if (reduced) {
      angleRef.current = targetRef.current
      return
    }
    let stopped = false
    const tick = () => {
      const diff = targetRef.current - angleRef.current
      if (Math.abs(diff) > 0.05) {
        angleRef.current += diff * 0.12
      } else {
        angleRef.current = targetRef.current
      }
      setAngle(angleRef.current)
      if (!stopped) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [reduced])

  // 滚轮：阻止默认滚动，旋转长廊
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (reduced) return
      e.preventDefault()
      goTo(Math.sign(e.deltaY))
    },
    [reduced, goTo],
  )

  return (
    <div
      className={`mood-gallery ${reduced ? 'is-flat' : ''}`}
      onWheel={onWheel}
    >
      <div className="mood-gallery-hint">
        <span className="mood-gallery-hint-wheel">⚲</span>
        滚轮环绕浏览 · 点击正面卡片翻至背面看全部曲目
      </div>

      <div className="mood-stage">
        <div
          className="mood-ring"
          style={{
            transform: `translateZ(calc(var(--mood-r) * -1)) rotateX(-4deg) rotateY(${angle}deg)`,
          }}
        >
          {playlists.map((pl, i) => {
            const isActive = i === activeIndex
            const transform = `rotateY(${i * STEP}deg) translateZ(var(--mood-r))`
            return (
              <div
                key={pl.id}
                className={`mood-card ${isActive ? 'is-active' : ''}`}
                style={{ transform }}
                onClick={() => {
                  if (!isActive) goTo(Math.sign(i - activeIndex) || 1)
                }}
              >
                <MoodCard
                  pl={pl}
                  index={i}
                  isActive={isActive}
                  currentId={currentId}
                  isPlaying={isPlaying}
                  progress={progress}
                  allTracks={allTracks}
                  onToggle={toggleTrack}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* 控制条：上一 / 下一，移动端与小屏也可点 */}
      <div className="mood-controls">
        <button type="button" className="mood-nav" onClick={() => goTo(-1)} aria-label="上一张">
          ‹
        </button>
        <div className="mood-dots">
          {playlists.map((pl, i) => (
            <button
              key={pl.id}
              type="button"
              className={`mood-dot ${i === activeIndex ? 'is-on' : ''}`}
              onClick={() => goTo(Math.sign(i - activeIndex) || 1)}
              aria-label={pl.title}
            />
          ))}
        </div>
        <button type="button" className="mood-nav" onClick={() => goTo(1)} aria-label="下一张">
          ›
        </button>
      </div>
    </div>
  )
}

/**
 * 单张心情歌单 = 一张可翻面的卡片。
 *
 * 正面：封面 + 歌单名 + 作者（Jack Tan）+ 曲目数 + 创建时间 + 简介。
 * 点击卡片沿 Y 轴翻转 180° 到背面，背面是该歌单的完整曲目列表，可滚动浏览
 * 并直接试听；再次点击（背面空白处或右上角回转按钮）翻回正面。
 *
 * 细节：
 * - 只有「正面朝向观众」的卡片可以被翻，转到侧后方的卡片自动翻回，避免
 *   长廊旋转时看到背面文字反向。
 * - 曲目列表自己吞掉 wheel / touch 事件，否则会被长廊的滚轮旋转劫持。
 * - reduced-motion 下降级为淡入淡出，不做 3D 翻转。
 */
function MoodCard({
  pl,
  isActive,
  currentId,
  isPlaying,
  progress,
  allTracks,
  onToggle,
}: {
  pl: MoodPlaylist
  index: number
  isActive: boolean
  currentId: string | null
  isPlaying: boolean
  progress: number
  allTracks: Track[]
  onToggle: (track: Track, list: Track[]) => void
}) {
  const cover = pl.songList[0]?.appleArtworkUrl || null
  const [flipped, setFlipped] = useState(false)

  // 卡片被转走时自动翻回正面
  useEffect(() => {
    if (!isActive && flipped) setFlipped(false)
  }, [isActive, flipped])

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <div
      className={`mood-flip ${flipped ? 'is-flipped' : ''}`}
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={`${pl.title} — ${flipped ? '返回正面' : '查看全部曲目'}`}
      onKeyDown={(e) => {
        if (!isActive) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setFlipped((v) => !v)
        }
      }}
    >
      {/* ── 正面：歌单信息 ─────────────────────────────── */}
      <article
        className="mood-face mood-face-front"
        onClick={() => {
          if (isActive) setFlipped(true)
        }}
        aria-hidden={flipped}
      >
        <div className="mood-card-cover">
          <Cover seed={pl.id} title={pl.title} artwork={cover} className="mood-card-art" />
          <div className="mood-card-scrim" />
          <span className="mood-card-no">ISSUE {pl.id}</span>
          <span className="mood-card-mood">{pl.mood}</span>
        </div>

        <div className="mood-card-body">
          <h3 className="mood-card-title">{pl.title}</h3>

          <div className="mood-card-author">
            <span className="mood-card-avatar" aria-hidden="true">JT</span>
            <span className="mood-card-author-name">Jack Tan</span>
            <span className="mood-card-author-role">编选</span>
          </div>

          <p className="mood-card-note">{pl.note}</p>

          <div className="mood-card-meta">
            <span>{pl.songList.length} 首</span>
            <span>{pl.date}</span>
          </div>

          <span className="mood-card-flip-hint">
            <span className="mood-card-flip-icon" aria-hidden="true">↻</span>
            点击卡片 · 翻面看全部曲目
          </span>
        </div>
      </article>

      {/* ── 背面：完整曲目列表 ─────────────────────────── */}
      <article
        className="mood-face mood-face-back"
        onClick={() => setFlipped(false)}
        aria-hidden={!flipped}
      >
        <header className="mood-back-head">
          <div className="mood-back-headings">
            <span className="mood-back-kicker">TRACKLIST · {pl.songList.length} 首</span>
            <h4 className="mood-back-title">{pl.title}</h4>
          </div>
          <button
            type="button"
            className="mood-back-close"
            onClick={(e) => {
              e.stopPropagation()
              setFlipped(false)
            }}
            aria-label="翻回正面"
            tabIndex={flipped ? 0 : -1}
          >
            ↺
          </button>
        </header>

        <ul
          className="mood-back-list"
          onClick={stop}
          onWheel={stop}
          onPointerDown={stop}
          onTouchStart={stop}
        >
          {pl.songList.map((t: Track, i: number) => {
            const active = currentId === t.id
            return (
              <li key={t.id} className={`mood-track ${active ? 'is-current' : ''}`}>
                <button
                  type="button"
                  className="mood-track-play"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(t, allTracks)
                  }}
                  aria-label={active && isPlaying ? `暂停 ${t.title}` : `试听 ${t.title}`}
                  tabIndex={flipped ? 0 : -1}
                >
                  {active && isPlaying ? '❚❚' : '▶'}
                </button>
                <span className="mood-track-info">
                  <span className="mood-track-title">
                    <span className="mood-track-idx">{String(i + 1).padStart(2, '0')}</span>
                    {t.title}
                  </span>
                  <span className="mood-track-artist">{t.artist}</span>
                </span>
                <span className="mood-track-dur">{t.duration}</span>
                {active && (
                  <span
                    className="mood-track-bar"
                    aria-hidden="true"
                    style={{ transform: `scaleX(${progress})` }}
                  />
                )}
              </li>
            )
          })}
        </ul>

        <footer className="mood-back-foot">
          <span>Jack Tan</span>
          <span>{pl.date}</span>
        </footer>
      </article>
    </div>
  )
}
