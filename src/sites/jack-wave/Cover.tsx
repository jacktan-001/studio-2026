import { useEffect, useState } from 'react'
import { coverGradient, initialOf } from './coverArt'
import { getMonthMeta } from './trackMeta'

interface CoverProps {
  seed: string
  title: string
  appleTrackId?: string | number | null
  /** Resolved artwork URL (e.g. from a bulk month lookup). Takes priority. */
  artwork?: string | null
  className?: string
}

/**
 * Album-art surface for a track or a playlist. Prefers an explicitly-passed
 * `artwork` (resolved by the caller's bulk month lookup so we issue one request
 * per month); otherwise resolves real Apple Music artwork from the track id, and
 * on any miss shows a deterministic gradient with the song's initial — always
 * legible, never broken.
 */
export function Cover({ seed, title, appleTrackId, artwork, className = 'wave-cover' }: CoverProps) {
  const [art, setArt] = useState<string | null>(artwork || null)

  useEffect(() => {
    if (artwork) {
      setArt(artwork)
      return
    }
    if (!appleTrackId) {
      setArt(null)
      return
    }
    let cancelled = false
    getMonthMeta([String(appleTrackId)])
      .then((m) => {
        if (!cancelled) setArt(m[appleTrackId]?.artworkUrl || null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [artwork, appleTrackId])

  if (art) {
    return (
      <span
        className={className}
        style={{ backgroundImage: `url("${art}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
    )
  }
  return (
    <span className={className} style={{ background: coverGradient(seed) }}>
      <span className="wave-cover-initial">{initialOf(title)}</span>
    </span>
  )
}
