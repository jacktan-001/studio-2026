import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from './stores/projectStore'
import { PhotoLibrary } from './components/PhotoLibrary'
import { PlatformPanel } from './components/PlatformPanel'
import { ExportPanel } from './components/ExportPanel'
import type { Platform } from './types'

/** 编辑器：照片库 + 平台面板（文案/排序/预览） + 导出。 */
export function PoseEditor() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const renameProject = useProjectStore((s) => s.renameProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const [activePlatform, setActivePlatform] = useState<Platform>('wechat')
  const [confirmDel, setConfirmDel] = useState(false)

  if (!project) {
    return (
      <div className="pose-editor-empty">
        <p>找不到该项目，可能已被删除。</p>
        <button type="button" className="pose-btn" onClick={() => navigate('/jack-pose/studio')}>
          返回工作台
        </button>
      </div>
    )
  }

  const pid = project.id
  async function onDelete() {
    await deleteProject(pid)
    navigate('/jack-pose/studio')
  }

  return (
    <div className="pose-editor">
      <header className="pose-editor-bar">
        <button type="button" className="pose-back-btn" onClick={() => navigate('/jack-pose/studio')}>
          ← 工作台
        </button>
        <input
          className="pose-editor-title"
          value={project.title}
          onChange={(e) => renameProject(project.id, e.target.value)}
          aria-label="项目标题"
        />
        {confirmDel ? (
          <span className="pose-del-confirm">
            确认删除？
            <button type="button" className="pose-del-yes" onClick={onDelete}>
              删除
            </button>
            <button type="button" className="pose-del-no" onClick={() => setConfirmDel(false)}>
              取消
            </button>
          </span>
        ) : (
          <button type="button" className="pose-del-btn" onClick={() => setConfirmDel(true)}>
            删除项目
          </button>
        )}
      </header>

      <div className="pose-editor-grid">
        <PhotoLibrary projectId={project.id} activePlatform={activePlatform} />
        <PlatformPanel projectId={project.id} />
        <ExportPanel projectId={project.id} />
      </div>
    </div>
  )
}
