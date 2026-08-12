import { flushSync } from 'react-dom'
import { forwardRef, type ReactNode } from 'react'
import { Link, useNavigate, type LinkProps } from 'react-router-dom'

type NavigateFn = (to: string) => void

/** Run a client-side navigation wrapped in the View Transitions API.
 *  The page content fades/slides while the global audio player (a sibling of
 *  the outlet) stays mounted → music never interrupts. */
export function navigateWithTransition(navigate: NavigateFn, to: string) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => void
  }
  if (doc.startViewTransition) {
    doc.startViewTransition(() => {
      flushSync(() => navigate(to))
    })
  } else {
    navigate(to)
  }
}

interface TransitionLinkProps extends LinkProps {
  children?: ReactNode
}

export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  function TransitionLink({ to, onClick, children, ...rest }, ref) {
    const navigate = useNavigate()
    return (
      <Link
        ref={ref}
        to={to}
        onClick={(e) => {
          // respect new-tab / modifier clicks
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          onClick?.(e)
          navigateWithTransition(navigate, String(to))
        }}
        {...rest}
      >
        {children}
      </Link>
    )
  }
)
