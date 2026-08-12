import type { ThemeConfig } from '../../registry/themes'
import type { AudioBands } from '../../core/AudioProvider'

/** Every site/sub-site gets a unique ambient renderer keyed by this id. */
export type SiteId =
  | 'portal'
  | 'jack-tan'
  | 'jack-pose'
  | 'jack-wave'
  | 'jack-talk'
  | 'jack-craft'
  | 'admin'

export interface AmbientInit {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  theme: ThemeConfig
  reduced: boolean
}

/** Live pointer state in canvas CSS-pixel space (clientX/clientY; the ambient
 *  canvas is fixed at the viewport origin, so these map 1:1 to canvas coords). */
export interface PointerState {
  x: number
  y: number
  /** true while the pointer is over the window; false after leave/blur */
  active: boolean
}

/** Per-frame data handed to each renderer. */
export interface AmbientFrame {
  /** timestamp in ms (performance.now based) */
  t: number
  /** delta since previous frame in ms */
  dt: number
  /** 1 at page top (immersive hero) → eases to 0 after ~1 viewport scrolled */
  intensity: number
  /** real-time spectrum from the global audio bed (zeros when paused) */
  audio: AudioBands
  /** whether the global audio bed is currently playing */
  playing: boolean
  /** live pointer (mouse/touch) position + whether it is currently active */
  pointer: PointerState
}

export interface AmbientRenderer {
  /** Called on mount + on every resize, with device-independent CSS px dims. */
  resize: (w: number, h: number, dpr: number) => void
  /** Called once per animation frame (or once, when reduced). */
  draw: (frame: AmbientFrame) => void
  /** Optional cleanup (cancel timers, free GPU refs). */
  destroy?: () => void
}

export type AmbientFactory = (init: AmbientInit) => AmbientRenderer
