/**
 * SiteBadge — a shared, theme-aware status chip used at the top of every
 * sub-site hero. It automatically picks up the current --accent color from
 * ThemeProvider, so each module reads in its own characteristic hue.
 */
interface SiteBadgeProps {
  /** Visible label, e.g. "PODCAST · 对谈" */
  children: React.ReactNode
  /** Whether the dot pulses like a live indicator. */
  pulse?: boolean
  className?: string
}

export function SiteBadge({ children, pulse = true, className = '' }: SiteBadgeProps) {
  return (
    <span className={`site-badge ${className}`.trim()}>
      <i className={`site-badge-dot ${pulse ? 'is-pulse' : ''}`} />
      {children}
    </span>
  )
}
