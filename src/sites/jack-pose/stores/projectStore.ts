/**
 * 项目状态管理（Zustand + persist）
 * 项目元数据/文案/排序持久化到 localStorage；图片 Blob 由 idb.ts 存 IndexedDB
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, PlatformContent, PhotoMeta, Platform } from '../types'
import { genId, emptyContent } from '../types'
import { putPhoto, putThumb, deletePhoto, deletePhotos } from '../lib/idb'
import { generateThumbnail } from '../lib/imageUtils'

interface ProjectState {
  projects: Project[]

  createProject: (title: string) => string
  getProject: (id: string) => Project | undefined
  updateProject: (id: string, updater: (p: Project) => Project) => void
  renameProject: (id: string, title: string) => void
  deleteProject: (id: string) => Promise<void>

  addPhotos: (
    projectId: string,
    photos: PhotoMeta[],
    blobs: Map<string, Blob>,
    thumbs: Map<string, Blob>,
  ) => Promise<void>
  removePhoto: (projectId: string, photoId: string) => Promise<void>

  setPlatformContent: (projectId: string, platform: Platform, content: Partial<PlatformContent>) => void
  togglePlatformImage: (projectId: string, platform: Platform, photoId: string) => void
  reorderPlatformImages: (projectId: string, platform: Platform, imageIds: string[]) => void

  importProject: (
    data: {
      id: string
      title: string
      createdAt: number
      updatedAt: number
      platforms: Project['platforms']
    },
    photos: PhotoMeta[],
    blobs: Map<string, Blob>,
  ) => Promise<string>
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],

      createProject: (title) => {
        const id = genId()
        const now = Date.now()
        const project: Project = {
          id,
          title: title || '未命名项目',
          createdAt: now,
          updatedAt: now,
          photos: [],
          platforms: { wechat: emptyContent(), xiaohongshu: emptyContent() },
        }
        set((s) => ({ projects: [project, ...s.projects] }))
        return id
      },

      getProject: (id) => get().projects.find((p) => p.id === id),

      updateProject: (id, updater) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...updater(p), updatedAt: Date.now() } : p,
          ),
        })),

      renameProject: (id, title) =>
        get().updateProject(id, (p) => ({ ...p, title })),

      deleteProject: async (id) => {
        const p = get().getProject(id)
        if (p) {
          await deletePhotos(p.photos.map((ph) => ph.id))
        }
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
      },

      addPhotos: async (projectId, photos, blobs, thumbs) => {
        for (const ph of photos) {
          const blob = blobs.get(ph.id)
          if (blob) await putPhoto(ph.id, blob)
          const thumb = thumbs.get(ph.id)
          if (thumb) await putThumb(ph.id, thumb)
        }
        get().updateProject(projectId, (p) => ({
          ...p,
          photos: [...p.photos, ...photos],
        }))
      },

      removePhoto: async (projectId, photoId) => {
        await deletePhoto(photoId)
        get().updateProject(projectId, (p) => {
          const platforms = { ...p.platforms }
          ;(Object.keys(platforms) as Platform[]).forEach((pl) => {
            platforms[pl] = {
              ...platforms[pl],
              imageIds: platforms[pl].imageIds.filter((id) => id !== photoId),
            }
          })
          return {
            ...p,
            photos: p.photos.filter((ph) => ph.id !== photoId),
            platforms,
          }
        })
      },

      setPlatformContent: (projectId, platform, content) =>
        get().updateProject(projectId, (p) => ({
          ...p,
          platforms: {
            ...p.platforms,
            [platform]: { ...p.platforms[platform], ...content },
          },
        })),

      togglePlatformImage: (projectId, platform, photoId) =>
        get().updateProject(projectId, (p) => {
          const cur = p.platforms[platform].imageIds
          const imageIds = cur.includes(photoId)
            ? cur.filter((id) => id !== photoId)
            : [...cur, photoId]
          return {
            ...p,
            platforms: {
              ...p.platforms,
              [platform]: { ...p.platforms[platform], imageIds },
            },
          }
        }),

      reorderPlatformImages: (projectId, platform, imageIds) =>
        get().updateProject(projectId, (p) => ({
          ...p,
          platforms: {
            ...p.platforms,
            [platform]: { ...p.platforms[platform], imageIds },
          },
        })),

      importProject: async (data, photos, blobs) => {
        for (const ph of photos) {
          const blob = blobs.get(ph.id)
          if (blob) {
            await putPhoto(ph.id, blob)
            // 为导入的图片生成并存储缩略图
            try {
              const thumb = await generateThumbnail(blob, 400, 0.75)
              await putThumb(ph.id, thumb)
            } catch {
              // 缩略图生成失败不影响导入
            }
          }
        }
        const project: Project = {
          id: data.id,
          title: data.title,
          createdAt: data.createdAt,
          updatedAt: Date.now(),
          photos,
          platforms: data.platforms,
        }
        set((s) => ({
          projects: [project, ...s.projects.filter((p) => p.id !== data.id)],
        }))
        return data.id
      },
    }),
    { name: 'jack-pose-projects' },
  ),
)
