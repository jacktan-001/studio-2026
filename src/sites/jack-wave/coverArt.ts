// Deterministic, dependency-free cover art for Jack Wave.
// There are no cover assets in the source sheet, so each song gets a stable
// gradient derived from its identity (title + artist). The Cover component
// upgrades to real Apple Music artwork when a track id resolves, falling back
// to this gradient + initial.

export function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Hue band kept within the site's cyan→violet world (165–295) so covers feel
// like one cohesive set while still reading as distinct records.
export function coverGradient(seed: string): string {
  const h = hashSeed(seed)
  const hue = 165 + (h % 130)
  const hue2 = hue + 22 + (h % 40)
  const angle = h % 360
  return `linear-gradient(${angle}deg, hsl(${hue} 70% 54%), hsl(${hue2} 62% 36%))`
}

export function initialOf(title: string): string {
  const t = (title || '♪').trim()
  const m = t.match(/[\p{L}]/u)
  return m ? m[0].toUpperCase() : '♪'
}
