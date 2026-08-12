export function parseRgb(s: string): [number, number, number] {
  const parts = s.split(',').map((x) => parseInt(x.trim(), 10))
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
