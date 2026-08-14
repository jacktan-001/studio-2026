// Shared Apple Music track metadata for Jack Wave.
//
// One bulk iTunes lookup resolves artwork + 30s preview URL + duration + the
// Apple Music page URL for a whole month of tracks in a SINGLE request (iTunes
// supports comma-separated ids). Results are cached by id-list so switching
// months back and forth is instant and we never re-fetch. The preview URL lets
// the player stream real audio (no copyrighted full track — just the
// Apple-provided 30s clip).
//
// STOREFRONT: the lookup MUST be pinned to the CN storefront. Without
// `country`, iTunes defaults to US, where CN-exclusive catalogue (林宥嘉 /
// 杨乃文 / 蔡健雅 / 李荣浩 …) simply does not exist — the API returns
// resultCount 0 for those ids, the track resolves to no previewUrl, and the
// song silently refuses to play. Pinning to CN resolves 95/95 monthly tracks.
// A US pass is used as a fallback for the handful of ids that are US-only.

import { useEffect, useState } from 'react'

export interface TrackMeta {
  artworkUrl: string | null
  previewUrl: string | null
  durationMs: number | null
  /** Apple Music web page for this track (opens in a new tab). */
  trackViewUrl: string | null
}

const bulkCache = new Map<string, Promise<Record<string, TrackMeta>>>()

function parseResults(results: any[]): Record<string, TrackMeta> {
  const out: Record<string, TrackMeta> = {}
  for (const res of results || []) {
    if (res?.wrapperType && res.wrapperType !== 'track') continue
    const id = String(res.trackId)
    if (!id || id === 'undefined') continue
    out[id] = {
      artworkUrl: res?.artworkUrl100 ? res.artworkUrl100.replace('100x100', '600x600') : null,
      previewUrl: res?.previewUrl || null,
      durationMs: typeof res?.trackTimeMillis === 'number' ? res.trackTimeMillis : null,
      trackViewUrl: res?.trackViewUrl || null,
    }
  }
  return out
}

/** iTunes allows ~200 ids per call; stay well under it. */
const CHUNK = 40

async function lookupIn(ids: string[], country: string): Promise<Record<string, TrackMeta>> {
  const out: Record<string, TrackMeta> = {}
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK)
    const url =
      `https://itunes.apple.com/lookup?id=${chunk.map(encodeURIComponent).join(',')}` +
      `&entity=song&country=${country}`
    try {
      const r = await fetch(url)
      if (!r.ok) continue
      const j = await r.json()
      Object.assign(out, parseResults(j?.results))
    } catch {
      /* network hiccup on one chunk shouldn't kill the rest */
    }
  }
  return out
}

/**
 * Bulk iTunes lookup → trackId → meta. CORS-enabled.
 * CN storefront first (this catalogue is CN-centric), then a US pass for any
 * ids CN did not resolve, so both Chinese and Western tracks always play.
 */
export function getMonthMeta(ids: string[]): Promise<Record<string, TrackMeta>> {
  const clean = Array.from(new Set(ids.filter(Boolean).map(String)))
  if (clean.length === 0) return Promise.resolve({})
  const key = clean.join(',')
  const cached = bulkCache.get(key)
  if (cached) return cached

  const p = (async () => {
    const cn = await lookupIn(clean, 'CN')
    const missing = clean.filter((id) => !cn[id]?.previewUrl)
    if (missing.length > 0) {
      const us = await lookupIn(missing, 'US')
      for (const [id, meta] of Object.entries(us)) {
        // keep CN artwork/url if present, but take whatever preview we can get
        cn[id] = { ...(cn[id] ?? meta), previewUrl: cn[id]?.previewUrl || meta.previewUrl }
        if (!cn[id].trackViewUrl) cn[id].trackViewUrl = meta.trackViewUrl
        if (!cn[id].artworkUrl) cn[id].artworkUrl = meta.artworkUrl
        if (!cn[id].durationMs) cn[id].durationMs = meta.durationMs
      }
    }
    return cn
  })().catch(() => ({}) as Record<string, TrackMeta>)

  bulkCache.set(key, p)
  return p
}

/** React hook: resolves meta for a list of Apple track ids, re-fetching on change. */
export function useMonthMeta(ids: string[]): Record<string, TrackMeta> {
  const key = ids.filter(Boolean).join(',')
  const [map, setMap] = useState<Record<string, TrackMeta>>({})
  useEffect(() => {
    let cancelled = false
    if (!key) return
    getMonthMeta(key.split(',').filter(Boolean)).then((m) => {
      if (!cancelled) setMap(m)
    })
    return () => {
      cancelled = true
    }
  }, [key])
  return map
}

/** ms → "m:ss" for track durations. */
export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return ''
  const total = Math.round(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Apple Music 曲库搜索（供 admin 歌单选歌使用）──────────────

export interface AppleSearchResult {
  trackId: number
  trackName: string
  artistName: string
  collectionName: string
  /** 已升级为 600x600 的封面 URL */
  artworkUrl100: string
  /** 30s 试听（m4a），可能为空 */
  previewUrl: string | null
  /** Apple Music 网页链接 */
  trackViewUrl: string | null
  trackTimeMillis: number | null
}

/** 将 100x100 封面升级为 600x600（Apple artwork URL 尺寸约定）。 */
function upscaleArtwork(url: string | null | undefined): string {
  if (!url) return ''
  return url.replace('100x100', '600x600')
}

/**
 * 关键词搜索 Apple Music 曲库（iTunes Search API，无需鉴权，CORS 允许）。
 * 固定 CN storefront，保证中文曲库可搜；结果返回试听/封面/时长/Apple 链接。
 */
export async function searchAppleMusic(term: string, limit = 20): Promise<AppleSearchResult[]> {
  const q = term.trim()
  if (!q) return []
  const url =
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}` +
    `&media=music&entity=song&limit=${limit}&country=CN`
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('搜索失败（HTTP ' + r.status + '）')
  const j = (await r.json()) as { results?: any[] }
  return (j.results || [])
    .filter((x) => x?.wrapperType === 'track' && x?.trackId)
    .map((x) => ({
      trackId: Number(x.trackId),
      trackName: x.trackName || x.trackCensoredName || 'Untitled',
      artistName: x.artistName || '',
      collectionName: x.collectionName || '',
      artworkUrl100: upscaleArtwork(x.artworkUrl100),
      previewUrl: x.previewUrl || null,
      trackViewUrl: x.trackViewUrl || null,
      trackTimeMillis: typeof x.trackTimeMillis === 'number' ? x.trackTimeMillis : null,
    }))
}
