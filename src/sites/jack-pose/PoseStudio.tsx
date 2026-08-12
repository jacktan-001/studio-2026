import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from './stores/projectStore'
import { importProjectArchive } from './lib/importExport'

/** 工作台：项目列表，新建 / 导入 / 打开 / 删除。 */
export function PoseStudio() {
  const navigate = useNavigate()
  const projects = useProjectStore((s) => s.projects)
  const createProject = useProjectStore((s) => s.createProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function onNew() {
    const id = createProject('未命名项目 ' + (projects.length + 1))
    navigate(`/jack-pose/studio/${id}`)
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const newId = await importProjectArchive(file)
      navigate(`/jack-pose/studio/${newId}`)
    } catch (e) {
      setError((e as Error).message || '导入失败')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="pose-studio">
      <header className="pose-studio-head">
        <div>
          <h1 className="pose-studio-title">Jack Pose 工作台</h1>
          <p className="pose-studio-sub">社媒长图排版 · 本地存储 · 一键导出</p>
        </div>
        <div className="pose-studio-actions">
          <button type="button" className="pose-btn pose-btn-primary" onClick={onNew} disabled={busy}>
            ＋ 新建项目
          </button>
          <button
            type="button"
            className="pose-btn"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            导入工程
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => onImport(e.target.files?.[0])}
          />
        </div>
      </header>

      {error && <div className="pose-studio-error">{error}</div>}

      {projects.length === 0 ? (
        <div className="pose-studio-empty">
          <p>还没有项目。</p>
          <button type="button" className="pose-btn pose-btn-primary" onClick={onNew}>
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="pose-studio-grid">
          {projects.map((p) => (
            <div key={p.id} className="pose-proj-card">
              <div className="pose-proj-top">
                <span className="pose-proj-name">{p.title}</span>
                <span className="pose-proj-date">
                  {new Date(p.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="pose-proj-meta">
                {p.photos.length} 张照片 · 微信 {p.platforms.wechat.imageIds.length} · 小红书{' '}
                {p.platforms.xiaohongshu.imageIds.length}
              </div>
              <div className="pose-proj-actions">
                <button
                  type="button"
                  className="pose-btn pose-btn-primary pose-btn-sm"
                  onClick={() => navigate(`/jack-pose/studio/${p.id}`)}
                >
                  打开
                </button>
                {confirmId === p.id ? (
                  <span className="pose-proj-confirm">
                    <button
                      type="button"
                      className="pose-btn pose-btn-sm pose-btn-danger"
                      onClick={async () => {
                        await deleteProject(p.id)
                        setConfirmId(null)
                      }}
                    >
                      确认删除
                    </button>
                    <button
                      type="button"
                      className="pose-btn pose-btn-sm"
                      onClick={() => setConfirmId(null)}
                    >
                      取消
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="pose-btn pose-btn-sm"
                    onClick={() => setConfirmId(p.id)}
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
