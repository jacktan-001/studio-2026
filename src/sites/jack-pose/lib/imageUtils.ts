/**
 * 图片工具函数
 * 提供 HEIC 检测与转换、图片压缩、缩略图生成等功能
 */

// ==================== 常量 ====================

/** 单文件最大 20MB */
export const MAX_FILE_SIZE = 20 * 1024 * 1024
/** 原图压缩最大边长 */
const MAX_IMAGE_DIMENSION = 2048
/** 原图压缩质量 */
const COMPRESS_QUALITY = 0.85
/** 缩略图最大宽度 */
const THUMB_MAX_WIDTH = 400
/** 缩略图质量 */
const THUMB_QUALITY = 0.75

// ==================== HEIC 检测 ====================

export function isHEIC(file: File): boolean {
  const name = file.name.toLowerCase()
  if (name.endsWith('.heic') || name.endsWith('.heif')) return true
  const mime = file.type.toLowerCase()
  if (mime.includes('heic') || mime.includes('heif')) return true
  return false
}

// ==================== HEIC 转换 ====================

type Heic2AnyFunction = (params: {
  blob: Blob
  toType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
  quality?: number
}) => Promise<Blob>

let heic2anyCache: Heic2AnyFunction | null = null
let heic2anyLoading: Promise<Heic2AnyFunction> | null = null

async function loadHeic2Any(): Promise<Heic2AnyFunction> {
  if (heic2anyCache) return heic2anyCache
  if (heic2anyLoading) return heic2anyLoading

  heic2anyLoading = (async () => {
    try {
      const mod = await import('heic2any')
      const fn: Heic2AnyFunction =
        (mod as { default?: Heic2AnyFunction }).default ??
        (mod as unknown as Heic2AnyFunction)
      if (typeof fn !== 'function') {
        throw new Error('heic2any 模块格式异常')
      }
      heic2anyCache = fn
      return fn
    } catch (err) {
      heic2anyCache = null
      heic2anyLoading = null
      console.error('[imageUtils] 加载 heic2any 失败:', err)
      throw new Error('HEIC 转换库加载失败，请稍后重试')
    }
  })()

  return heic2anyLoading
}

export async function convertHEICtoJPEG(file: File, quality = 0.9): Promise<Blob> {
  if (!isHEIC(file)) {
    throw new Error('文件不是 HEIC 格式')
  }
  const heic2any = await loadHeic2Any()
  try {
    return await heic2any({ blob: file, toType: 'image/jpeg', quality })
  } catch (err) {
    console.error('[imageUtils] HEIC 转换失败:', err)
    throw new Error(`HEIC 图片转换失败: ${file.name}`)
  }
}

// ==================== 图片尺寸 ====================

/**
 * 使用 createImageBitmap 加载图片，自动应用 EXIF 方向
 * createImageBitmap 的 imageOrientation: 'from-image' 选项会读取
 * EXIF Orientation 标签并自动旋转/翻转图片到正确方向
 */
async function loadImageBitmap(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch {
    // 某些旧浏览器不支持 imageOrientation 选项，回退到普通加载
    return await createImageBitmap(blob)
  }
}

export async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await loadImageBitmap(blob)
  const { width, height } = bitmap
  bitmap.close()
  return { width, height }
}

// ==================== 图片压缩 ====================

/**
 * 压缩图片：如果最长边超过 MAX_IMAGE_DIMENSION 则等比缩小
 * 始终以 JPEG 输出（质量 COMPRESS_QUALITY），减少 IndexedDB 存储体积
 * 使用 createImageBitmap 加载以自动应用 EXIF 方向校正
 */
export async function compressImage(blob: Blob): Promise<Blob> {
  const bitmap = await loadImageBitmap(blob)

  let { width: w, height: h } = bitmap

  // 等比缩放
  if (w > MAX_IMAGE_DIMENSION || h > MAX_IMAGE_DIMENSION) {
    const ratio = Math.min(MAX_IMAGE_DIMENSION / w, MAX_IMAGE_DIMENSION / h)
    w = Math.round(w * ratio)
    h = Math.round(h * ratio)
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 上下文不可用')
  }
  // 白底（防止透明 PNG 变黑）
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (out) => {
        if (out) resolve(out)
        else reject(new Error('图片压缩失败'))
      },
      'image/jpeg',
      COMPRESS_QUALITY,
    )
  })
}

// ==================== 上传图片处理 ====================

export interface ProcessedImage {
  /** 处理后的 Blob（HEIC 转为 JPEG + 压缩） */
  blob: Blob
  /** 处理后的文件名 */
  fileName: string
  /** 图片宽度 */
  width?: number
  /** 图片高度 */
  height?: number
  /** 缩略图 Blob */
  thumb: Blob
}

/**
 * 处理上传图片：
 * 1. HEIC → JPEG
 * 2. 压缩到 MAX_IMAGE_DIMENSION 以内
 * 3. 获取尺寸
 * 4. 生成缩略图
 */
export async function processUploadImage(file: File): Promise<ProcessedImage> {
  // 文件大小校验
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件超过 20MB 限制: ${file.name}`)
  }

  let blob: Blob = file
  let fileName = file.name

  // HEIC 转码
  if (isHEIC(file)) {
    blob = await convertHEICtoJPEG(file, 0.9)
    fileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
  }

  // 压缩
  blob = await compressImage(blob)

  // 尺寸
  let width: number | undefined
  let height: number | undefined
  try {
    const dims = await getImageDimensions(blob)
    width = dims.width
    height = dims.height
  } catch {
    // 尺寸获取失败不影响上传
  }

  // 缩略图
  const thumb = await generateThumbnail(blob, THUMB_MAX_WIDTH, THUMB_QUALITY)

  return { blob, fileName, width, height, thumb }
}

// ==================== 缩略图生成 ====================

export async function generateThumbnail(
  file: File | Blob,
  maxWidth = 300,
  quality = 0.8,
): Promise<Blob> {
  const bitmap = await loadImageBitmap(file)

  const ratio = Math.min(maxWidth / bitmap.width, 1)
  const width = Math.floor(bitmap.width * ratio)
  const height = Math.floor(bitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Canvas 上下文不可用')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('缩略图生成失败'))
      },
      'image/jpeg',
      quality,
    )
  })
}

// ==================== 文件大小格式化 ====================

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)
  const formatted = Number.isInteger(size) ? size.toString() : size.toFixed(1)
  return `${formatted} ${units[i]}`
}
