import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import {
  exportLongImage,
  exportWechatCard,
  exportXhsThumbnailStrip,
  exportProjectArchive,
  copyCaption,
  importProjectArchive,
} from '../lib/importExport'
import type { Platform } from '../types'

/** 导出 / 导入操作区。所有导出均走 importExport.ts 的 Canvas 实现。 */
export function ExportPanel({ projectId }: { projectId: string }) {
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId))
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [busy, setBusy] = useState(false)

  if (!project) return null

  function toast(kind: 'ok' | 'err', msg: string) {
    setStatus({ kind, msg })
    window.setTimeout(() => setStatus((s) => (s && s.msg === msg ? null : s)), 3200)
  }

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true)
    try {
      await fn()
      toast('ok', `${label} 完成`)
    } catch (e) {
      toast('err', (e as Error).message || `${label} 失败`)
    } finally {
      setBusy(false)
    }
  }

  const wxIds = project.platforms.wechat.imageIds
  const xhsIds = project.platforms.xiaohongshu.imageIds

  async function onImport(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const newId = await importProjectArchive(file)
      toast('ok', '工程已导入')
      navigate(`/jack-pose/studio/${newId}`)
    } catch (e) {
      toast('err', (e as Error).message || '导入失败')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="pose-export">
      <div className="pose-export-head">导出 / 导入</div>

      <button
        type="button"
        className="pose-exp-btn"
        disabled={busy || wxIds.length === 0}
        onClick={() =>
          run('长图（朋友圈）', () => exportLongImage(project, 'wechat', { format: 'webp' }))
        }
      >
        长图拼接（朋友圈）
      </button>

      <button
        type="button"
        className="pose-exp-btn"
        disabled={busy || xhsIds.length === 0}
        onClick={() =>
          run('长图（小红书）', () => exportLongImage(project, 'xiaohongshu', { format: 'webp' }))
        }
      >
        长图拼接（小红书）
      </button>

      <button
        type="button"
        className="pose-exp-btn"
        disabled={busy || wxIds.length === 0}
        onClick={() => run('朋友圈卡片', () => exportWechatCard(project))}
      >
        朋友圈卡片 PNG
      </button>

      <button
        type="button"
        className="pose-exp-btn"
        disabled={busy || xhsIds.length === 0}
        onClick={() =>
          run('小红书缩略图', () =>
            exportXhsThumbnailStrip(project, xhsIds, {
              title: project.platforms.xiaohongshu.title,
              caption: project.platforms.xiaohongshu.caption,
            }),
          )
        }
      >
        小红书缩略图排序
      </button>

      <div className="pose-exp-row">
        <button
          type="button"
          className="pose-exp-btn pose-exp-sm"
          disabled={busy || wxIds.length === 0}
          onClick={() => run('复制文案', () => copyCaption(project, 'wechat' as Platform))}
        >
          复制朋友圈文案
        </button>
        <button
          type="button"
          className="pose-exp-btn pose-exp-sm"
          disabled={busy || xhsIds.length === 0}
          onClick={() => run('复制文案', () => copyCaption(project, 'xiaohongshu'))}
        >
          复制小红书文案
        </button>
      </div>

      <button
        type="button"
        className="pose-exp-btn pose-exp-ghost"
        disabled={busy}
        onClick={() => run('导出工程', () => exportProjectArchive(project))}
      >
        导出工程 JSON（含图片）
      </button>

      <button
        type="button"
        className="pose-exp-btn pose-exp-ghost"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        导入工程 JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => onImport(e.target.files?.[0])}
      />

      {status && (
        <div className={`pose-exp-status pose-exp-${status.kind}`}>{status.msg}</div>
      )}
    </div>
  )
}
