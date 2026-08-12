import { useRef, useState } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { processUploadImage } from '../lib/imageUtils'
import { genId, type PhotoMeta, type Platform } from '../types'
import { PLATFORM_LABELS } from '../types'
import { PhotoThumb } from './PhotoThumb'

/**
 * 照片库：多选上传（HEIC 自动转码 + 压缩 + 缩略图），缩略图网格。
 * 点击缩略图 = 在「当前平台」中切换选中；右上角删除按钮移除该图。
 */
export function PhotoLibrary({
  projectId,
  activePlatform,
}: {
  projectId: string
  activePlatform: Platform
}) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const addPhotos = useProjectStore((s) => s.addPhotos)
  const removePhoto = useProjectStore((s) => s.removePhoto)
  const togglePlatformImage = useProjectStore((s) => s.togglePlatformImage)

  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!project) return null

  const selected = new Set(project.platforms[activePlatform].imageIds)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    const metas: PhotoMeta[] = []
    const blobs = new Map<string, Blob>()
    const thumbs = new Map<string, Blob>()
    for (const file of Array.from(files)) {
      try {
        const p = await processUploadImage(file)
        const photoId = genId()
        metas.push({
          id: photoId,
          name: p.fileName,
          width: p.width ?? 0,
          height: p.height ?? 0,
          size: file.size,
          mimeType: p.blob.type,
        })
        blobs.set(photoId, p.blob)
        thumbs.set(photoId, p.thumb)
      } catch (e) {
        setError((e as Error).message || '图片处理失败')
      }
    }
    if (metas.length) await addPhotos(projectId, metas, blobs, thumbs)
    setBusy(false)
  }

  return (
    <div className="pose-lib">
      <div className="pose-lib-head">
        <span className="pose-lib-title">照片库</span>
        <span className="pose-lib-count">{project.photos.length} 张</span>
      </div>

      <button
        type="button"
        className="pose-upload"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        <span className="pose-upload-plus">＋</span>
        <span>{busy ? '处理中…' : '上传图片（可多选）'}</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </button>

      {error && <div className="pose-lib-error">{error}</div>}

      <p className="pose-lib-hint">
        当前平台：<strong>{PLATFORM_LABELS[activePlatform]}</strong> · 点击缩略图可加入 / 移出
      </p>

      <div className="pose-lib-grid">
        {project.photos.length === 0 && (
          <div className="pose-lib-empty">还没有照片，点上方按钮上传。</div>
        )}
        {project.photos.map((ph) => {
          const inActive = selected.has(ph.id)
          return (
            <div
              key={ph.id}
              className={`pose-photo ${inActive ? 'is-selected' : ''}`}
              onClick={() => togglePlatformImage(projectId, activePlatform, ph.id)}
            >
              <PhotoThumb id={ph.id} className="pose-photo-img" />
              {inActive && <span className="pose-photo-badge">✓ 已选</span>}
              <button
                type="button"
                className="pose-photo-del"
                title="删除"
                onClick={(e) => {
                  e.stopPropagation()
                  removePhoto(projectId, ph.id)
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
