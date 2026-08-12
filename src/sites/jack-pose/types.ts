/**
 * Jack Pose — 数据类型定义
 * 纯前端工具：项目/文案/排序持久化到 localStorage（Zustand persist）；原始图片 Blob 存 IndexedDB
 */

// 平台
export type Platform = 'wechat' | 'xiaohongshu'

// 图片元数据（轻量，随项目存 localStorage；原始 Blob 存 IndexedDB，key = id）
export interface PhotoMeta {
  id: string
  name: string
  width: number
  height: number
  size: number
  mimeType: string
}

// 平台内容：文案 + 选图排序
export interface PlatformContent {
  /** 小红书标题（≤20字），朋友圈不使用 */
  title: string
  /** 文案 */
  caption: string
  /** 选中并排序的图片 id（引用 project.photos） */
  imageIds: string[]
}

// 项目（存 localStorage，不含图片 Blob）
export interface Project {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  photos: PhotoMeta[]
  platforms: {
    wechat: PlatformContent
    xiaohongshu: PlatformContent
  }
}

// 工程文件（JSON 导出格式，自包含：含图片 base64，可独立导入恢复）
export interface ProjectArchive {
  version: 1
  app: 'jack-pose'
  exportedAt: number
  id: string
  title: string
  createdAt: number
  updatedAt: number
  platforms: {
    wechat: PlatformContent
    xiaohongshu: PlatformContent
  }
  photos: Array<PhotoMeta & { dataUrl: string }>
}

export const PLATFORMS: Platform[] = ['wechat', 'xiaohongshu']

export const PLATFORM_LABELS: Record<Platform, string> = {
  wechat: '朋友圈',
  xiaohongshu: '小红书',
}

/** 生成唯一 id（优先 crypto.randomUUID） */
export function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

/** 空的平台内容 */
export function emptyContent(): PlatformContent {
  return { title: '', caption: '', imageIds: [] }
}
