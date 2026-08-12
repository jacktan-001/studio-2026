/**
 * IndexedDB 封装 - 图片 Blob 存储（单例连接）
 * 两个 object store：
 *   - photos：原始图片 Blob，key = photoId
 *   - thumbs：缩略图 Blob，key = photoId
 */

const DB_NAME = 'jack-pose'
const DB_VERSION = 2
const STORE_PHOTOS = 'photos'
const STORE_THUMBS = 'thumbs'

// ==================== 单例 DB 连接 ====================

let dbInstance: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = req.result
      // 旧版本只有 photos store
      if (e.oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
          db.createObjectStore(STORE_PHOTOS)
        }
      }
      // v2 新增 thumbs store
      if (e.oldVersion < 2) {
        if (!db.objectStoreNames.contains(STORE_THUMBS)) {
          db.createObjectStore(STORE_THUMBS)
        }
      }
    }
    req.onsuccess = () => {
      const db = req.result
      // 连接意外关闭时重置单例，下次调用会重新连接
      db.onversionchange = () => {
        db.close()
        dbInstance = null
      }
      resolve(db)
    }
    req.onerror = () => {
      dbInstance = null
      reject(req.error)
    }
  })

  return dbInstance
}

// ==================== 原始图片 ====================

/** 写入图片 Blob */
export async function putPhoto(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readwrite')
    tx.objectStore(STORE_PHOTOS).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 读取图片 Blob */
export async function getPhoto(id: string): Promise<Blob | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readonly')
    const req = tx.objectStore(STORE_PHOTOS).get(id)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
}

/** 删除单张图片 */
export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_PHOTOS, STORE_THUMBS], 'readwrite')
    tx.objectStore(STORE_PHOTOS).delete(id)
    tx.objectStore(STORE_THUMBS).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 批量删除图片（删项目时清理） */
export async function deletePhotos(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_PHOTOS, STORE_THUMBS], 'readwrite')
    const photoStore = tx.objectStore(STORE_PHOTOS)
    const thumbStore = tx.objectStore(STORE_THUMBS)
    ids.forEach((id) => {
      photoStore.delete(id)
      thumbStore.delete(id)
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 获取所有图片 id（清理孤儿数据用） */
export async function getAllPhotoIds(): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PHOTOS, 'readonly')
    const req = tx.objectStore(STORE_PHOTOS).getAllKeys()
    req.onsuccess = () => resolve(req.result as string[])
    req.onerror = () => reject(req.error)
  })
}

// ==================== 缩略图 ====================

/** 写入缩略图 Blob */
export async function putThumb(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_THUMBS, 'readwrite')
    tx.objectStore(STORE_THUMBS).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 读取缩略图 Blob */
export async function getThumb(id: string): Promise<Blob | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_THUMBS, 'readonly')
    const req = tx.objectStore(STORE_THUMBS).get(id)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
}

// ==================== Base64 转换（工程文件导入导出用） ====================

/** Blob → data URL（base64），导出工程文件用 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** data URL → Blob，导入工程文件用 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

// ==================== 内存缓存：id → objectURL ====================

const urlCache = new Map<string, string>()
const thumbUrlCache = new Map<string, string>()

/**
 * 获取原图的可显示 URL（带内存缓存）
 * 首次从 IndexedDB 读取 Blob 生成 objectURL 并缓存，后续直接返回
 */
export async function getPhotoUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id) ?? null
  const blob = await getPhoto(id)
  if (!blob) return null
  const url = URL.createObjectURL(blob)
  urlCache.set(id, url)
  return url
}

/**
 * 获取缩略图的可显示 URL（带内存缓存）
 * 优先从 thumbs store 读取；若无缩略图则回退到原图
 */
export async function getThumbUrl(id: string): Promise<string | null> {
  if (thumbUrlCache.has(id)) return thumbUrlCache.get(id) ?? null
  const thumb = await getThumb(id)
  if (thumb) {
    const url = URL.createObjectURL(thumb)
    thumbUrlCache.set(id, url)
    return url
  }
  // 回退到原图
  return getPhotoUrl(id)
}

/** 释放指定图片的 objectURL 缓存（原图 + 缩略图） */
export function revokePhotoUrl(id: string): void {
  const url = urlCache.get(id)
  if (url) {
    URL.revokeObjectURL(url)
    urlCache.delete(id)
  }
  const thumbUrl = thumbUrlCache.get(id)
  if (thumbUrl) {
    URL.revokeObjectURL(thumbUrl)
    thumbUrlCache.delete(id)
  }
}

/** 清空全部 objectURL 缓存 */
export function revokeAllPhotoUrls(): void {
  urlCache.forEach((url) => URL.revokeObjectURL(url))
  urlCache.clear()
  thumbUrlCache.forEach((url) => URL.revokeObjectURL(url))
  thumbUrlCache.clear()
}

// ==================== 存储配额管理 ====================

/** 存储配额信息 */
export interface StorageQuotaInfo {
  usage: number
  quota: number
  percentage: number
  isLow: boolean
}

/** 图片存储统计 */
export interface StorageInfo {
  photoCount: number
  estimatedSize: number
}

/**
 * 获取浏览器分配的存储配额与已用量
 * 基于 navigator.storage.estimate()，不可用时返回 0
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate()
      return { usage: est.usage ?? 0, quota: est.quota ?? 0 }
    } catch {
      // estimate() 在某些环境可能抛错，降级返回 0
    }
  }
  return { usage: 0, quota: 0 }
}

/**
 * 检查存储配额使用情况
 * - percentage：已用百分比（0-100）
 * - isLow：剩余空间不足 10%（即已用 >= 90%）时为 true
 */
export async function checkStorageQuota(): Promise<StorageQuotaInfo> {
  const { usage, quota } = await getStorageEstimate()
  const percentage = quota > 0 ? (usage / quota) * 100 : 0
  const isLow = quota > 0 && percentage >= 90
  return { usage, quota, percentage, isLow }
}

/**
 * 清理孤儿图片：删除不在 usedIds 集合中的所有图片（含缩略图）
 * 同时释放对应的 objectURL 内存缓存
 * @returns 实际删除的图片数量
 */
export async function cleanupOrphanedPhotos(usedIds: Set<string>): Promise<number> {
  const allIds = await getAllPhotoIds()
  const orphaned = allIds.filter((id) => !usedIds.has(id))
  if (orphaned.length === 0) return 0
  await deletePhotos(orphaned)
  // 释放对应的 objectURL 缓存
  orphaned.forEach((id) => revokePhotoUrl(id))
  return orphaned.length
}

/**
 * 获取图片存储统计：图片数量与估算占用大小（含原图 + 缩略图）
 * 通过遍历所有 Blob 的 size 属性累加，单次事务读取
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  const allIds = await getAllPhotoIds()
  let estimatedSize = 0

  if (allIds.length > 0) {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_PHOTOS, STORE_THUMBS], 'readonly')
      const photoStore = tx.objectStore(STORE_PHOTOS)
      const thumbStore = tx.objectStore(STORE_THUMBS)
      allIds.forEach((id) => {
        const pr = photoStore.get(id)
        pr.onsuccess = () => {
          const blob = pr.result as Blob | undefined
          if (blob) estimatedSize += blob.size
        }
        const tr = thumbStore.get(id)
        tr.onsuccess = () => {
          const blob = tr.result as Blob | undefined
          if (blob) estimatedSize += blob.size
        }
      })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  return { photoCount: allIds.length, estimatedSize }
}
