import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Track } from './musicData'
import { getMonthMeta } from './trackMeta'

/**
 * Global song player for Jack Wave.
 *
 * A SINGLE <audio> element lives here, mounted at the app root (outside the
 * router) so music survives every page change: the current song, elapsed
 * progress, play/pause state, volume and the active queue are all held in this
 * provider, never in a route subtree. Navigating only swaps the router outlet,
 * so nothing here unmounts and nothing resets.
 *
 * Continuous playback: when a track ends, `advance(1)` loads the next track and
 * loops the queue. If a track fails to load (missing/expired preview, network,
 * CORS) we try to repair it from the iTunes API once, and if that also fails we
 * surface a message and skip forward instead of stalling on a dead song.
 *
 * Volume is persisted to localStorage so it survives reloads too.
 */
interface WavePlayerValue {
  queue: Track[]
  currentId: string | null
  index: number
  isPlaying: boolean
  /** 0..1 elapsed ratio of the current track */
  progress: number
  /** seconds */
  elapsed: number
  duration: number
  volume: number
  muted: boolean
  /** true while the audio element is buffering a newly selected track */
  loading: boolean
  /** human-readable playback error for the current track, or null */
  error: string | null
  current: Track | null
  playFrom: (list: Track[], startIndex: number) => void
  toggleTrack: (track: Track, list: Track[]) => void
  toggleCurrent: () => void
  next: () => void
  prev: () => void
  seek: (ratio: number) => void
  setVolume: (v: number) => void
  toggleMute: () => void
}

const Ctx = createContext<WavePlayerValue | null>(null)

export function useWavePlayer(): WavePlayerValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWavePlayer must be used within <WavePlayerProvider>')
  return v
}

const VOL_KEY = 'studio2026:wave:volume'

function readStoredVolume(): number {
  try {
    const raw = localStorage.getItem(VOL_KEY)
    if (raw === null) return 0.8
    const v = parseFloat(raw)
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8
  } catch {
    return 0.8
  }
}

/** Best playable URL for a track: Apple 30s preview, else the local bed. */
function srcFor(track: Track): string {
  return track.applePreviewUrl || track.src || ''
}

export function WavePlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const queueRef = useRef<Track[]>([])
  const indexRef = useRef(-1)
  /** ids we already tried to repair, so a broken track can't loop forever */
  const repairedRef = useRef<Set<string>>(new Set())
  /** guards auto-skip so a run of dead tracks can't spin the CPU */
  const skipStreakRef = useRef(0)

  const [queue, setQueue] = useState<Track[]>([])
  const [index, setIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [current, setCurrent] = useState<Track | null>(null)
  const [volume, setVolumeState] = useState<number>(readStoredVolume)
  const [muted, setMuted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load + play a track at `i` within `list`. Updates both state and refs so the
  // once-mounted `ended` handler can always read the latest index.
  const load = useCallback((list: Track[], i: number) => {
    const audio = audioRef.current
    if (!audio) return
    const track = list[i]
    if (!track) return
    queueRef.current = list
    indexRef.current = i
    setQueue(list)
    setIndex(i)
    setCurrentId(track.id)
    setCurrent(track)
    setProgress(0)
    setElapsed(0)
    setDuration(0)
    setError(null)
    setLoading(true)

    const url = srcFor(track)
    if (!url) {
      setLoading(false)
      setError('这首歌暂无可播放的音源')
      return
    }
    audio.src = url
    void audio.play().catch((err) => {
      // NotAllowedError = autoplay policy, needs a gesture; not a broken track.
      if (err?.name === 'NotAllowedError') {
        setLoading(false)
        return
      }
      setLoading(false)
      setError('播放失败，请重试')
    })
  }, [])

  // Advance by `dir` within the current queue, looping at both ends.
  const advance = useCallback(
    (dir: number) => {
      const list = queueRef.current
      if (list.length === 0) return
      const next = (indexRef.current + dir + list.length) % list.length
      load(list, next)
    },
    [load],
  )

  /**
   * A track failed to load. Try once to repair its preview URL from the iTunes
   * API (URLs rotate, and CN-only songs need the CN storefront); if that fails,
   * report it and move on so playback never dead-ends.
   */
  const handleFailure = useCallback(async () => {
    const list = queueRef.current
    const i = indexRef.current
    const track = list[i]
    setLoading(false)
    if (!track) return

    const tid = track.appleTrackId ? String(track.appleTrackId) : ''
    if (tid && !repairedRef.current.has(track.id)) {
      repairedRef.current.add(track.id)
      try {
        const meta = await getMonthMeta([tid])
        const fresh = meta[tid]?.previewUrl
        if (fresh && indexRef.current === i) {
          // patch the queue in place so later plays use the good URL
          const patched = { ...track, applePreviewUrl: fresh }
          const nextList = list.slice()
          nextList[i] = patched
          queueRef.current = nextList
          setQueue(nextList)
          setCurrent(patched)
          const audio = audioRef.current
          if (audio) {
            setError(null)
            setLoading(true)
            audio.src = fresh
            void audio.play().catch(() => {
              setLoading(false)
              setError('这首歌暂时无法播放，已跳过')
              advance(1)
            })
          }
          return
        }
      } catch {
        /* fall through to skip */
      }
    }

    if (skipStreakRef.current < 3 && list.length > 1) {
      skipStreakRef.current += 1
      setError(`「${track.title}」暂时无法播放，已跳到下一首`)
      advance(1)
    } else {
      skipStreakRef.current = 0
      setError('音源暂时不可用，请稍后再试')
    }
  }, [advance])

  const playFrom = useCallback(
    (list: Track[], startIndex: number) => {
      skipStreakRef.current = 0
      load(list, startIndex)
    },
    [load],
  )

  const toggleTrack = useCallback(
    (track: Track, list: Track[]) => {
      const audio = audioRef.current
      if (!audio) return
      // Same track already loaded → resume/pause it in place.
      if (currentId === track.id) {
        if (audio.paused) void audio.play().catch(() => {})
        else audio.pause()
        return
      }
      skipStreakRef.current = 0
      const i = list.findIndex((t) => t.id === track.id)
      if (i >= 0) load(list, i)
      else load([track], 0)
    },
    [currentId, load],
  )

  const toggleCurrent = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentId) return
    if (audio.paused) void audio.play().catch(() => setError('播放失败，请重试'))
    else audio.pause()
  }, [currentId])

  const next = useCallback(() => {
    skipStreakRef.current = 0
    advance(1)
  }, [advance])
  const prev = useCallback(() => {
    skipStreakRef.current = 0
    advance(-1)
  }, [advance])

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current
    if (!audio || !audio.duration || !Number.isFinite(audio.duration)) return
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * audio.duration
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    setVolumeState(clamped)
    setMuted(clamped === 0)
    const audio = audioRef.current
    if (audio) {
      audio.volume = clamped
      audio.muted = false
    }
    try {
      localStorage.setItem(VOL_KEY, String(clamped))
    } catch {
      /* private mode — non-fatal */
    }
  }, [])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    setMuted((m) => {
      const nextMuted = !m
      if (audio) audio.muted = nextMuted
      return nextMuted
    })
  }, [])

  // The single <audio> element. Created once, torn down only on app unmount.
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    // Apple's preview CDN serves permissive CORS headers; anonymous mode keeps
    // the element usable from any origin (and by a future analyser node).
    audio.crossOrigin = 'anonymous'
    audio.volume = readStoredVolume()
    audioRef.current = audio

    const onTime = () => {
      const d = audio.duration
      setElapsed(audio.currentTime)
      if (d && Number.isFinite(d)) setProgress(audio.currentTime / d)
    }
    const onMeta = () => {
      const d = audio.duration
      setDuration(Number.isFinite(d) ? d : 0)
      setLoading(false)
    }
    const onEnded = () => {
      // Continuous, uninterrupted playback: roll into the next track.
      skipStreakRef.current = 0
      advance(1)
    }
    const onPlay = () => {
      setIsPlaying(true)
      setError(null)
      skipStreakRef.current = 0
    }
    const onPause = () => setIsPlaying(false)
    const onPlaying = () => setLoading(false)
    const onWaiting = () => setLoading(true)
    const onError = () => void handleFailure()
    const onStalled = () => setLoading(true)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('durationchange', onMeta)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('stalled', onStalled)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('durationchange', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('stalled', onStalled)
      audio.removeEventListener('error', onError)
      audio.pause()
      audioRef.current = null
    }
    // advance/handleFailure are stable (they only depend on stable callbacks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-clear a transient error banner so it never sticks around forever.
  useEffect(() => {
    if (!error) return
    const id = window.setTimeout(() => setError(null), 4200)
    return () => window.clearTimeout(id)
  }, [error])

  // Lock-screen / headphone controls on mobile + iPad.
  useEffect(() => {
    const ms = navigator.mediaSession
    if (!ms || !current) return
    try {
      ms.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: 'Jack Wave',
        artwork: current.appleArtworkUrl
          ? [{ src: current.appleArtworkUrl, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      })
      ms.setActionHandler('play', () => toggleCurrent())
      ms.setActionHandler('pause', () => toggleCurrent())
      ms.setActionHandler('nexttrack', () => next())
      ms.setActionHandler('previoustrack', () => prev())
    } catch {
      /* MediaSession unsupported — non-fatal */
    }
  }, [current, toggleCurrent, next, prev])

  return (
    <Ctx.Provider
      value={{
        queue,
        currentId,
        index,
        isPlaying,
        progress,
        elapsed,
        duration,
        volume,
        muted,
        loading,
        error,
        current,
        playFrom,
        toggleTrack,
        toggleCurrent,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
