import { useState } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { PLATFORMS, PLATFORM_LABELS, type Platform } from '../types'
import { PhotoThumb } from './PhotoThumb'

/**
 * 平台面板：切换微信 / 小红书，编辑文案，并对「已选图片」拖拽排序。
 * 右侧同步显示仿真的平台预览（九宫格 / 双列）。
 */
export function PlatformPanel({ projectId }: { projectId: string }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const setPlatformContent = useProjectStore((s) => s.setPlatformContent)
  const reorderPlatformImages = useProjectStore((s) => s.reorderPlatformImages)

  const [active, setActive] = useState<Platform>('wechat')
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  if (!project) return null
  const content = project.platforms[active]
  const selectedPhotos = content.imageIds
    .map((id) => project.photos.find((p) => p.id === id))
    .filter(Boolean) as { id: string; name: string }[]

  function onDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) return
    const next = [...content.imageIds]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    reorderPlatformImages(projectId, active, next)
    setDragIdx(null)
  }

  return (
    <div className="pose-platform">
      <div className="pose-tabs">
        {PLATFORMS.map((pl) => (
          <button
            key={pl}
            type="button"
            className={`pose-tab ${active === pl ? 'is-active' : ''}`}
            onClick={() => setActive(pl)}
          >
            {PLATFORM_LABELS[pl]}
          </button>
        ))}
      </div>

      <div className="pose-form">
        {active === 'xiaohongshu' && (
          <label className="pose-field">
            <span className="pose-field-label">小红书标题（≤20字）</span>
            <input
              className="pose-input"
              maxLength={20}
              value={content.title}
              placeholder="一个吸引人的标题"
              onChange={(e) => setPlatformContent(projectId, active, { title: e.target.value })}
            />
          </label>
        )}
        <label className="pose-field">
          <span className="pose-field-label">文案</span>
          <textarea
            className="pose-textarea"
            rows={4}
            value={content.caption}
            placeholder="这一刻的想法…"
            onChange={(e) => setPlatformContent(projectId, active, { caption: e.target.value })}
          />
        </label>
      </div>

      <div className="pose-selected">
        <div className="pose-selected-head">
          <span>已选图片（拖拽排序）</span>
          <span className="pose-selected-count">{selectedPhotos.length}</span>
        </div>
        {selectedPhotos.length === 0 ? (
          <div className="pose-selected-empty">在左侧照片库点击图片加入本平台</div>
        ) : (
          <ul className="pose-selected-list">
            {selectedPhotos.map((ph, i) => (
              <li
                key={ph.id}
                className="pose-selected-item"
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                onDragEnd={() => setDragIdx(null)}
              >
                <span className="pose-selected-idx">{i + 1}</span>
                <PhotoThumb id={ph.id} className="pose-selected-thumb" />
                <span className="pose-selected-name">{ph.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pose-preview">
        <div className="pose-preview-label">
          {PLATFORM_LABELS[active]} 预览
        </div>
        {active === 'wechat' ? (
          <div className="pose-wx-card">
            <div className="pose-wx-head">
              <div className="pose-wx-avatar">🐻</div>
              <div className="pose-wx-name">Jack-Pose</div>
            </div>
            <div className="pose-wx-caption">{content.caption || '这一刻的想法…'}</div>
            <div
              className={`pose-wx-grid pose-wx-grid-${Math.min(selectedPhotos.length || 1, 9)}`}
            >
              {selectedPhotos.map((ph) => (
                <div className="pose-wx-cell" key={ph.id}>
                  <PhotoThumb id={ph.id} className="pose-wx-img" />
                </div>
              ))}
            </div>
            <div className="pose-wx-foot">♥ 赞 · 💬 评论</div>
          </div>
        ) : (
          <div className="pose-xhs-card">
            {content.title && <div className="pose-xhs-title">{content.title}</div>}
            <div className="pose-xhs-caption">{content.caption}</div>
            <div className="pose-xhs-grid">
              {selectedPhotos.map((ph) => (
                <div className="pose-xhs-cell" key={ph.id}>
                  <PhotoThumb id={ph.id} className="pose-xhs-img" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
