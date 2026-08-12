import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface AudioBands {
  bass: number
  mid: number
  treble: number
  level: number
}

export interface AudioApi {
  isPlaying: boolean
  isReady: boolean
  volume: number
  toggle: () => void
  setPlaying: (v: boolean) => void
  setVolume: (v: number) => void
  /** Read current spectrum. Safe to call every frame. */
  getBands: () => AudioBands
}

const AudioCtx = createContext<AudioApi | null>(null)

export function useAudio(): AudioApi {
  const c = useContext(AudioCtx)
  if (!c) throw new Error('useAudio must be used within <AudioProvider>')
  return c
}

const ZERO: AudioBands = { bass: 0, mid: 0, treble: 0, level: 0 }

/**
 * Ambient audio-spectrum provider.
 *
 * A previous version auto-played a hidden, *looped* background track
 * (/audio/ambient.wav) on the first user gesture and persisted that state in
 * localStorage — so any click would kick off an inescapable background loop
 * that never stopped. That was unwanted, so the auto-playing bed has been
 * removed entirely.
 *
 * `getBands()` now returns ZERO. The visualizers that consume it
 * (Cursor glow, AmbientCanvas site renderers) already gate audio reactivity
 * behind `playing` and fall back to idle/pointer-driven motion, so they keep
 * animating — just without audio reactivity. No background sound is emitted.
 *
 * If audio-reactive visuals are desired later, feed this analyser from the
 * real music player (WavePlayerProvider) instead of a phantom loop.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(true)
  const [volume, setVolumeState] = useState(0.7)

  // Ambient bed removed: these are intentionally no-ops now.
  const setPlaying = useCallback(() => {
    /* ambient bed removed */
  }, [])
  const toggle = useCallback(() => {
    /* ambient bed removed */
  }, [])
  const setVolume = useCallback((v: number) => setVolumeState(v), [])
  const getBands = useCallback((): AudioBands => ZERO, [])

  const value = useMemo<AudioApi>(
    () => ({ isPlaying: false, isReady, volume, toggle, setPlaying, setVolume, getBands }),
    [isReady, volume, toggle, setPlaying, setVolume, getBands]
  )

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}
