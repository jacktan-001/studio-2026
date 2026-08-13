import type { AmbientFactory, SiteId } from './types'
import { studioLines } from './renderers/studioLines'
import { radarSweep } from './renderers/radarSweep'
import { bokehDrift } from './renderers/bokehDrift'
import { waveRibbons } from './renderers/waveRibbons'
import { broadcastRings } from './renderers/broadcastRings'
import { goldenDrift } from './renderers/goldenDrift'

/**
 * siteId → renderer factory.
 * - portal       → studioLines (colourful, mouse-reactive flowing lines)
 * - jack-tan     → radarSweep (blueprint + sonar)
 * - jack-pose    → bokehDrift (soft moodboard orbs)
 * - jack-wave    → waveRibbons (audio-reactive aurora)
 * - jack-talk    → broadcastRings (audio-reactive ON AIR pulses)
 * - jack-craft   → undefined (keeps its own hero-local generative canvas)
 * - notes        → goldenDrift (gold journal motes; gold-tinted via theme)
 * - admin        → undefined (inherits the base violet field only)
 */
export const AMBIENT_REGISTRY: Partial<Record<SiteId, AmbientFactory>> = {
  portal: studioLines,
  'jack-tan': radarSweep,
  'jack-pose': bokehDrift,
  'jack-wave': waveRibbons,
  'jack-talk': broadcastRings,
  notes: goldenDrift,
}
