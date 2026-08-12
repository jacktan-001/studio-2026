import { useRef, type ReactNode } from 'react'
import { useMotionPrefs } from '../core/MotionPrefsProvider'

interface Props {
  /** content shown inside the floating preview (hidden until hover) */
  preview: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Wraps a trigger (e.g. a project index row). On hover a preview card fades in
 * and follows the cursor with inertial lerp — the Pacome "touch a word, a world
 * unfolds" effect. The card is positioned relative to this wrapper, so each row
 * gets its own follow-cursor preview. Reduced-motion → no follow, static card.
 */
export function HoverPreviewCard({ preview, children, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const { reduced } = useMotionPrefs()
  const raf = useRef(0)
  const tx = useRef(0)
  const ty = useRef(0)
  const cx = useRef(0)
  const cy = useRef(0)

  const onMove = (e: React.PointerEvent) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const r = wrap.getBoundingClientRect()
    tx.current = e.clientX - r.left
    ty.current = e.clientY - r.top
  }

  const loop = () => {
    const card = cardRef.current
    if (card) {
      cx.current += (tx.current - cx.current) * 0.15
      cy.current += (ty.current - cy.current) * 0.15
      card.style.transform = `translate(${cx.current}px, ${cy.current}px)`
    }
    raf.current = requestAnimationFrame(loop)
  }

  const onEnter = () => {
    if (reduced || !cardRef.current) return
    cardRef.current.classList.add('is-visible')
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(loop)
  }

  const onLeave = () => {
    cardRef.current?.classList.remove('is-visible')
    cancelAnimationFrame(raf.current)
  }

  return (
    <div
      ref={wrapRef}
      className={`hover-preview ${className || ''}`}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      {children}
      <div ref={cardRef} className="hover-preview-card" aria-hidden="true">
        {preview}
      </div>
    </div>
  )
}
