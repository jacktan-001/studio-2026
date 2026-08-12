import { useEffect, useState } from 'react'
import { getThumbUrl } from '../lib/idb'

/**
 * 从 IndexedDB 加载缩略图并显示。objectURL 由 idb.ts 的内存缓存统一持有，
 * 组件卸载时不再 revoke（避免破坏跨组件共享的同一缓存项）。
 */
export function PhotoThumb({ id, className }: { id: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getThumbUrl(id)
      .then((u) => {
        if (alive) setUrl(u)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [id])

  if (!url) return <div className={className} data-loading="true" />
  return <img src={url} className={className} alt="" loading="lazy" draggable={false} />
}
