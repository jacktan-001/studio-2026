/**
 * Fixed, full-viewport ambient background. Its *appearance* is driven entirely
 * by CSS (per `html[data-project]` + the `--accent` CSS var set by
 * ThemeProvider), so switching projects re-tints it without remounting anything.
 * Two layers: a soft accent glow/grid (`bg-field`) + a fine film grain
 * (`bg-grain`) for that analogue, premium texture.
 */
export function BackgroundField() {
  return (
    <>
      <div className="bg-field" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />
    </>
  )
}
