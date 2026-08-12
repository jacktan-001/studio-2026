import { type ReactNode } from 'react'

export interface SpatialItem {
  id: string
  title: string
  subtitle?: string
  href?: string
  visual?: ReactNode
}

interface Props {
  items: SpatialItem[]
  className?: string
}

/**
 * 3D-perspective card array. Each card tilts toward the cursor (CSS vars
 * --rx/--ry/--mx) and a glow tracks the pointer — gives jack-tan's Works a
 * spatial, "objects floating in a gallery" feel without WebGL. Pure CSS
 * transforms, reduced-motion safe (tilt simply doesn't apply).
 */
export function SpatialGallery({ items, className }: Props) {
  const onMove = (e: React.PointerEvent<HTMLDivElement>, el: HTMLDivElement) => {
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${(px * 100 + 50).toFixed(1)}%`)
    el.style.setProperty('--my', `${(-py * 100 + 50).toFixed(1)}%`)
  }
  const onLeave = (el: HTMLDivElement) => {
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '50%')
  }

  return (
    <div className={`spatial-gallery ${className || ''}`}>
      {items.map((it) => {
        const inner = (
          <div
            className="spatial-card"
            onPointerMove={(e) => onMove(e, e.currentTarget)}
            onPointerLeave={(e) => onLeave(e.currentTarget)}
          >
            <div className="spatial-card-inner">
              <div className="spatial-card-visual">{it.visual}</div>
              <div className="spatial-card-body">
                <span className="spatial-card-title">{it.title}</span>
                {it.subtitle && <span className="spatial-card-sub">{it.subtitle}</span>}
              </div>
              <div className="spatial-card-glow" aria-hidden="true" />
            </div>
          </div>
        )
        return it.href ? (
          <a key={it.id} className="spatial-link" href={it.href} target="_blank" rel="noreferrer noopener">
            {inner}
          </a>
        ) : (
          <div key={it.id}>{inner}</div>
        )
      })}
    </div>
  )
}
