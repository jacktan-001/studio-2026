/**
 * 导出 / 导入工具
 * - 朋友圈卡片：Canvas 绘制完整朋友圈预览样式 PNG
 * - 长图：从指定图片 id 纵向拼接为高清 PNG
 * - JSON 工程：自包含（含图片 base64），可导入恢复
 * - 文案：一键复制
 */
import type { Project, Platform, ProjectArchive, PhotoMeta } from '../types'
import { genId } from '../types'
import { getPhoto, blobToDataUrl, dataUrlToBlob } from './idb'
import { useProjectStore } from '../stores/projectStore'

/** 导出图片格式：png（无损/透明）、webp（高压缩）、avif（更高压缩，兼容性较差） */
export type ExportFormat = 'png' | 'webp' | 'avif'

/** 在 canvas 上绘制小熊头像 */
function drawAvatar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // ears
  ctx.fillStyle = '#C4956A'
  ctx.beginPath(); ctx.arc(cx - r * 0.6, cy - r * 0.5, r * 0.35, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + r * 0.6, cy - r * 0.5, r * 0.35, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#E8C9A0'
  ctx.beginPath(); ctx.arc(cx - r * 0.6, cy - r * 0.5, r * 0.2, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + r * 0.6, cy - r * 0.5, r * 0.2, 0, Math.PI * 2); ctx.fill()
  // head
  ctx.fillStyle = '#C4956A'
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 0.85, 0, Math.PI * 2); ctx.fill()
  // face
  ctx.fillStyle = '#F0DEC5'
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.3, r * 0.5, r * 0.4, 0, 0, Math.PI * 2); ctx.fill()
  // eyes
  ctx.fillStyle = '#333'
  ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.05, r * 0.1, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.05, r * 0.1, 0, Math.PI * 2); ctx.fill()
  // nose
  ctx.fillStyle = '#8B6544'
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.2, r * 0.15, r * 0.1, 0, 0, Math.PI * 2); ctx.fill()
}

/** 根据 Blob 实际类型推断文件扩展名（兼容 avif 回退到 webp 的情况） */
function getExtFromBlob(blob: Blob): string {
  switch (blob.type) {
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/avif':
      return '.avif'
    default:
      return '.png'
  }
}

/** 把文件名替换为指定格式对应的扩展名（基于 Blob 实际类型，正确处理 avif 回退） */
function applyExt(fileName: string, blob: Blob): string {
  const ext = getExtFromBlob(blob)
  const dotIdx = fileName.lastIndexOf('.')
  if (dotIdx > 0) return fileName.slice(0, dotIdx) + ext
  return fileName + ext
}

/**
 * 把 Canvas 转为 Blob，按格式生成并处理兼容性回退
 * - png：无损，支持透明
 * - webp：quality 0.92
 * - avif：quality 0.85，浏览器不支持时自动回退到 webp
 */
async function canvasToBlob(canvas: HTMLCanvasElement, format: ExportFormat): Promise<Blob> {
  const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/avif'
  const quality = format === 'png' ? undefined : format === 'webp' ? 0.92 : 0.85
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b && b.type === mimeType) resolve(b)
      else if (format === 'avif') {
        // AVIF 不被支持（返回的 blob 类型不匹配），回退到 webp
        canvas.toBlob((b2) => (b2 ? resolve(b2) : reject(new Error('生成失败'))), 'image/webp', 0.92)
      } else if (b) resolve(b)
      else reject(new Error('生成失败'))
    }, mimeType, quality)
  })
}

/** 触发下载；传入 format 时按 Blob 实际类型修正文件名扩展名 */
function download(blob: Blob, fileName: string, format?: ExportFormat): void {
  const finalName = format ? applyExt(fileName, blob) : fileName
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = finalName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** 把 Blob 加载为 HTMLImageElement（用完需 revoke 其 objectURL） */
function loadImgEl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}

/** 获取一组图片对象 */
async function loadPlatformImages(
  imageIds: string[],
): Promise<{ imgs: HTMLImageElement[]; blobs: Blob[] }> {
  const imgs: HTMLImageElement[] = []
  const blobs: Blob[] = []
  const urls: string[] = []
  try {
    for (const id of imageIds) {
      const blob = await getPhoto(id)
      if (!blob) continue
      blobs.push(blob)
      const url = URL.createObjectURL(blob)
      urls.push(url)
      imgs.push(await loadImgEl(url))
    }
  } finally {
    urls.forEach((u) => URL.revokeObjectURL(u))
  }
  return { imgs, blobs }
}

/**
 * 单图裁剪设置
 * - scale: >=1，1 表示按裁剪框刚好看到整张图，越大放得越大
 * - translateX/translateY: -1..1，在可移动范围内的偏移
 * - aspect: 裁剪框比例
 */
export interface CropSettings {
  scale: number
  translateX: number
  translateY: number
  aspect: 'original' | '1:1' | '3:4' | '4:3' | '16:9'
}

const ASPECT_RATIOS: Record<CropSettings['aspect'], number> = {
  original: 0,
  '1:1': 1,
  '3:4': 3 / 4,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
}

/** 计算某张图在输出单元中的尺寸（像素） */
function calcBoxSize(
  img: HTMLImageElement,
  aspect: CropSettings['aspect'],
  direction: 'vertical' | 'horizontal',
): { boxW: number; boxH: number } {
  const r = ASPECT_RATIOS[aspect]
  if (direction === 'vertical') {
    const boxW = 1080
    const boxH = r === 0 ? Math.round((boxW / img.naturalWidth) * img.naturalHeight) : Math.round(boxW / r)
    return { boxW, boxH }
  } else {
    const boxH = 1080
    const boxW = r === 0 ? Math.round((boxH / img.naturalHeight) * img.naturalWidth) : Math.round(boxH * r)
    return { boxW, boxH }
  }
}

/** 按裁剪参数把单张图画到 canvas 的指定矩形 */
function drawCroppedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  crop: CropSettings | undefined,
  dx: number,
  dy: number,
  boxW: number,
  boxH: number,
): void {
  if (!crop) {
    // 无裁剪：按 box 等比铺满（cover）
    const imgR = img.naturalWidth / img.naturalHeight
    const boxR = boxW / boxH
    let sx = 0
    let sy = 0
    let sw = img.naturalWidth
    let sh = img.naturalHeight
    if (imgR > boxR) {
      sw = sh * boxR
      sx = (img.naturalWidth - sw) / 2
    } else {
      sh = sw / boxR
      sy = (img.naturalHeight - sh) / 2
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, boxW, boxH)
    return
  }

  const scale = Math.max(1, crop.scale)
  const r = ASPECT_RATIOS[crop.aspect]
  // 裁剪框在原图上的尺寸
  let cropW = boxW / scale
  let cropH = r === 0 ? (cropW / img.naturalWidth) * img.naturalHeight : cropW / r
  if (cropH > img.naturalHeight) {
    cropH = img.naturalHeight / scale
    cropW = r === 0 ? (cropH / img.naturalHeight) * img.naturalWidth : cropH * r
  }

  const maxCropW = Math.min(img.naturalWidth, cropW)
  const maxCropH = Math.min(img.naturalHeight, cropH)
  cropW = maxCropW
  cropH = maxCropH

  // 可移动范围
  const rangeX = img.naturalWidth - cropW
  const rangeY = img.naturalHeight - cropH
  const tx = Math.max(-1, Math.min(1, crop.translateX))
  const ty = Math.max(-1, Math.min(1, crop.translateY))
  const sx = rangeX > 0 ? (img.naturalWidth - cropW) / 2 - (tx * rangeX) / 2 : 0
  const sy = rangeY > 0 ? (img.naturalHeight - cropH) / 2 - (ty * rangeY) / 2 : 0

  ctx.drawImage(img, sx, sy, cropW, cropH, dx, dy, boxW, boxH)
}

/**
 * 导出高清长图
 * - 默认使用平台全部已选图；传入 imageIds 则只拼接这些
 * - 支持纵向/横向拼接
 * - 支持每张图单独裁剪
 * - 超长图自动分片：当画布尺寸超过浏览器限制时自动拆分为多个文件
 */
// 浏览器 Canvas 最大安全尺寸（Safari 移动端约 4096，桌面端约 16384，Chrome 32767）
// 取 16384 作为安全上限，兼容绝大多数设备
const MAX_CANVAS_DIMENSION = 16384

export async function exportLongImage(
  project: Project,
  platform: Platform,
  opts?: {
    imageIds?: string[]
    direction?: 'vertical' | 'horizontal'
    crops?: Record<string, CropSettings>
    fileName?: string
    format?: ExportFormat
  },
): Promise<void> {
  const ids = opts?.imageIds ?? project.platforms[platform].imageIds
  if (ids.length === 0) {
    throw new Error('未选择任何图片，无法拼接')
  }

  const direction = opts?.direction ?? 'vertical'
  const crops = opts?.crops ?? {}
  // 长图默认 webp：压缩率更高，画质损失极小
  const format: ExportFormat = opts?.format ?? 'webp'

  const { imgs } = await loadPlatformImages(ids)
  if (imgs.length === 0) throw new Error('图片加载失败')

  // 每张图按裁剪设置计算输出单元尺寸
  const cells = imgs.map((img, i) => calcBoxSize(img, crops[ids[i] ?? '']?.aspect ?? 'original', direction))

  let canvasW = 0
  let canvasH = 0
  if (direction === 'vertical') {
    canvasW = Math.max(...cells.map((c) => c.boxW))
    canvasH = cells.reduce((sum, c) => sum + c.boxH, 0)
  } else {
    canvasW = cells.reduce((sum, c) => sum + c.boxW, 0)
    canvasH = Math.max(...cells.map((c) => c.boxH))
  }

  const stamp = new Date(project.createdAt).toISOString().slice(0, 10)
  const baseFileName = opts?.fileName ?? `${project.title}_${platform}_${stamp}.png`

  // 检查是否超过浏览器 Canvas 最大尺寸
  const exceedsLimit =
    (direction === 'vertical' && canvasH > MAX_CANVAS_DIMENSION) ||
    (direction === 'horizontal' && canvasW > MAX_CANVAS_DIMENSION)

  if (!exceedsLimit) {
    // 单张画布可以容纳，直接渲染
    const blob = await renderLongImage(imgs, ids, cells, crops, direction, canvasW, canvasH, format)
    download(blob, baseFileName, format)
    return
  }

  // 超长图分片：按 MAX_CANVAS_DIMENSION 拆分为多个段
  const segments: { startIndex: number; endIndex: number; size: number }[] = []
  let currentSize = 0
  let startIndex = 0

  for (let i = 0; i < cells.length; i++) {
    const cellSize = direction === 'vertical' ? cells[i]!.boxH : cells[i]!.boxW
    if (currentSize + cellSize > MAX_CANVAS_DIMENSION && i > startIndex) {
      // 当前段已满，保存并开始新段
      segments.push({ startIndex, endIndex: i - 1, size: currentSize })
      startIndex = i
      currentSize = cellSize
    } else {
      currentSize += cellSize
    }
  }
  // 最后一段
  if (startIndex < cells.length) {
    segments.push({ startIndex, endIndex: cells.length - 1, size: currentSize })
  }

  // 渲染每个分片并下载
  const padWidth = String(segments.length).length
  for (let seg = 0; seg < segments.length; seg++) {
    const { startIndex: si, endIndex: ei, size } = segments[seg]!
    const segCells = cells.slice(si, ei + 1)
    const segImgs = imgs.slice(si, ei + 1)
    const segIds = ids.slice(si, ei + 1)

    let segW: number, segH: number
    if (direction === 'vertical') {
      segW = canvasW
      segH = size
    } else {
      segW = size
      segH = canvasH
    }

    // 调整裁剪偏移量：每段的起始坐标从 0 开始
    const segCrops = { ...crops }
    const blob = await renderLongImage(segImgs, segIds, segCells, segCrops, direction, segW, segH, format)

    // 在文件名中插入分片编号（扩展名由 download 按 Blob 实际类型修正）
    const dotIdx = baseFileName.lastIndexOf('.')
    const name = dotIdx > 0 ? baseFileName.slice(0, dotIdx) : baseFileName
    const segLabel = String(seg + 1).padStart(padWidth, '0')
    download(blob, `${name}_part${segLabel}`, format)
  }
}

/**
 * 渲染长图到 Canvas 并返回 Blob
 * 内部函数，供 exportLongImage 单片或分片调用
 */
async function renderLongImage(
  imgs: HTMLImageElement[],
  ids: string[],
  cells: { boxW: number; boxH: number }[],
  crops: Record<string, CropSettings>,
  direction: 'vertical' | 'horizontal',
  canvasW: number,
  canvasH: number,
  format: ExportFormat,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let x = 0
  let y = 0
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i]!
    const id = ids[i] ?? ''
    const { boxW, boxH } = cells[i]!
    drawCroppedImage(ctx, img, crops[id], x, y, boxW, boxH)
    if (direction === 'vertical') {
      y += boxH
    } else {
      x += boxW
    }
  }

  return canvasToBlob(canvas, format)
}

/**
 * 导出朋友圈完整卡片 PNG
 * 绘制头像、昵称、文案、九宫格、时间、点赞评论栏
 */
export async function exportWechatCard(
  project: Project,
  opts?: { format?: ExportFormat },
): Promise<void> {
  // 朋友圈卡片默认 png：需要保留透明背景与无损画质
  const format: ExportFormat = opts?.format ?? 'png'
  const content = project.platforms.wechat
  const { imgs } = await loadPlatformImages(content.imageIds)

  const CARD_W = 1080
  const PAD = 60
  const AVATAR = 90
  const GAP = 12
  const GRID_W = CARD_W - PAD * 2

  // 准备 Canvas 与上下文
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  // 头像
  const avatarY = PAD
  const nameX = PAD + AVATAR + 24
  const nameY = avatarY + 46

  // 文案尺寸
  const caption = content.caption || '这一刻的想法…'
  ctx.font = '42px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif'
  const captionLines = wrapText(ctx, caption, GRID_W, 60)
  const captionH = captionLines.length * 60
  const captionY = avatarY + AVATAR + 40

  // 图片网格尺寸
  let gridH = 0
  const cellSize = (GRID_W - GAP * 2) / 3
  const twoCellSize = (GRID_W - GAP) / 2
  const n = imgs.length
  if (n === 1) {
    const img = imgs[0]!
    const ratio = Math.min(GRID_W / img.naturalWidth, 960 / img.naturalHeight)
    gridH = Math.round(img.naturalHeight * ratio)
  } else if (n === 2 || n === 4) {
    const cols = 2
    const rows = Math.ceil(n / cols)
    gridH = rows * twoCellSize + (rows - 1) * GAP
  } else if (n >= 3) {
    const cols = 3
    const rows = Math.ceil(n / cols)
    gridH = rows * cellSize + (rows - 1) * GAP
  }
  const gridY = captionY + captionH + 40

  // 时间 + 地点
  const timeY = n > 0 ? gridY + gridH + 36 : captionY + captionH + 36
  const dividerY = timeY + 54

  // 点赞评论栏
  const footerY = dividerY + 30
  const footerH = 90

  // 总高度
  const totalH = footerY + footerH + PAD
  canvas.width = CARD_W
  canvas.height = totalH

  // 白底
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 头像（根据用户选择动态绘制）
  drawAvatar(ctx, PAD + AVATAR / 2, avatarY + AVATAR / 2, AVATAR / 2)

  // 昵称
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#576b95'
  ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif'
  ctx.fillText('Jack-Pose', nameX, nameY)

  // 文案
  ctx.fillStyle = '#1d1d1f'
  ctx.font = '42px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif'
  captionLines.forEach((line, i) => {
    ctx.fillText(line, PAD, captionY + i * 60)
  })

  // 图片网格
  if (n > 0) {
    let x = PAD
    let y = gridY
    imgs.forEach((img, i) => {
      let w = 0
      let h = 0
      if (n === 1) {
        const ratio = Math.min(GRID_W / img.naturalWidth, 960 / img.naturalHeight)
        w = Math.round(img.naturalWidth * ratio)
        h = Math.round(img.naturalHeight * ratio)
      } else if (n === 2 || n === 4) {
        w = h = twoCellSize
      } else {
        w = h = cellSize
      }
      ctx.drawImage(img, x, y, w, h)

      // 下一位置
      if (n === 1) {
        // 只有一张，无需继续
      } else if (n === 2 || n === 4) {
        if ((i + 1) % 2 === 0) {
          x = PAD
          y += h + GAP
        } else {
          x += w + GAP
        }
      } else {
        if ((i + 1) % 3 === 0) {
          x = PAD
          y += h + GAP
        } else {
          x += w + GAP
        }
      }
    })
  }

  // 时间 + 位置
  ctx.fillStyle = '#86868b'
  ctx.font = '30px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif'
  const timeText = new Date().toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  ctx.fillText(`${timeText}`, PAD, timeY)

  // 分隔线
  ctx.strokeStyle = '#f2f2f7'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, dividerY)
  ctx.lineTo(CARD_W - PAD, dividerY)
  ctx.stroke()

  // 点赞评论栏
  ctx.fillStyle = '#f7f7f7'
  ctx.beginPath()
  ctx.roundRect(PAD, footerY, GRID_W, footerH, 12)
  ctx.fill()

  ctx.fillStyle = '#576b95'
  ctx.font = '32px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('♥ 赞', PAD + 32, footerY + footerH / 2)
  ctx.fillText('💬 评论', PAD + 220, footerY + footerH / 2)

  const blob = await canvasToBlob(canvas, format)

  const stamp = new Date(project.createdAt).toISOString().slice(0, 10)
  download(blob, `${project.title}_朋友圈_${stamp}.png`, format)
}

/** 按最大宽度折行文本 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  _lineHeight: number,
): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []
  for (const para of paragraphs) {
    let line = ''
    for (const ch of para) {
      const test = line + ch
      const metrics = ctx.measureText(test)
      if (metrics.width > maxWidth && line !== '') {
        lines.push(line)
        line = ch
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

/** 导出 JSON 工程文件（含图片 base64，自包含单文件） */
export async function exportProjectArchive(project: Project): Promise<void> {
  const photos: ProjectArchive['photos'] = []
  for (const ph of project.photos) {
    const blob = await getPhoto(ph.id)
    if (!blob) continue
    const dataUrl = await blobToDataUrl(blob)
    photos.push({ ...ph, dataUrl })
  }

  const archive: ProjectArchive = {
    version: 1,
    app: 'jack-pose',
    exportedAt: Date.now(),
    id: project.id,
    title: project.title,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    platforms: project.platforms,
    photos,
  }

  const blob = new Blob([JSON.stringify(archive, null, 2)], {
    type: 'application/json',
  })
  download(blob, `${project.title}_jackpose.json`)
}

/** 导入 JSON 工程文件，恢复项目，返回新项目 id */
export async function importProjectArchive(file: File): Promise<string> {
  const text = await file.text()
  let archive: ProjectArchive
  try {
    archive = JSON.parse(text) as ProjectArchive
  } catch {
    throw new Error('文件不是有效的 JSON')
  }

  if (archive.app !== 'jack-pose' || archive.version !== 1) {
    throw new Error('非 Jack-Pose 工程文件')
  }
  if (!archive.platforms || !Array.isArray(archive.photos)) {
    throw new Error('工程文件格式不完整')
  }

  // 恢复图片 Blob，生成新 id 避免与现有数据冲突
  const blobs = new Map<string, Blob>()
  const photos: PhotoMeta[] = []
  const idMap = new Map<string, string>()

  for (const ph of archive.photos) {
    const newId = genId()
    idMap.set(ph.id, newId)
    const blob = await dataUrlToBlob(ph.dataUrl)
    blobs.set(newId, blob)
    photos.push({
      id: newId,
      name: ph.name,
      width: ph.width,
      height: ph.height,
      size: ph.size,
      mimeType: ph.mimeType,
    })
  }

  // 重映射平台选图 id
  const remap = (ids: string[]) => ids.map((id) => idMap.get(id) ?? id)
  const platforms = {
    wechat: {
      ...archive.platforms.wechat,
      imageIds: remap(archive.platforms.wechat.imageIds),
    },
    xiaohongshu: {
      ...archive.platforms.xiaohongshu,
      imageIds: remap(archive.platforms.xiaohongshu.imageIds),
    },
  }

  const newProjectId = genId()
  await useProjectStore.getState().importProject(
    {
      id: newProjectId,
      title: archive.title || '导入项目',
      createdAt: archive.createdAt || Date.now(),
      updatedAt: archive.updatedAt || Date.now(),
      platforms,
    },
    photos,
    blobs,
  )

  return newProjectId
}

/** 复制文案到剪贴板（小红书含标题） */
export async function copyCaption(
  project: Project,
  platform: Platform,
): Promise<void> {
  const content = project.platforms[platform]
  let text = ''
  if (platform === 'xiaohongshu' && content.title) {
    text = content.title + '\n\n'
  }
  text += content.caption
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // 剪贴板 API 不可用（如非 HTTPS / 旧浏览器），降级到 execCommand
  }
  // 降级方案：隐藏 textarea + execCommand('copy')
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  try {
    textarea.select()
    const ok = document.execCommand('copy')
    if (!ok) throw new Error('复制失败')
  } finally {
    document.body.removeChild(textarea)
  }
}

/** 导出小红书缩略图排序为 PNG（含标题/正文 + 换行网格布局） */
export async function exportXhsThumbnailStrip(
  _project: Project,
  imageIds: string[],
  opts?: { title?: string; caption?: string; format?: ExportFormat },
): Promise<void> {
  if (imageIds.length === 0) throw new Error('没有图片')
  // 缩略图排序默认 png，保持与原行为一致
  const format: ExportFormat = opts?.format ?? 'png'

  // 加载图片
  const imgs: HTMLImageElement[] = []
  for (const id of imageIds) {
    const blob = await getPhoto(id)
    if (!blob) continue
    const url = URL.createObjectURL(blob)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = reject
        i.src = url
      })
      imgs.push(img)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  // 布局参数（2x 高清）
  const S = 2
  const canvasW = 375 * S
  const padding = 16 * S
  const cols = 4
  const gap = 6 * S
  const thumbSize = (canvasW - padding * 2 - gap * (cols - 1)) / cols

  const title = opts?.title ?? ''
  const caption = opts?.caption ?? ''

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  const ctx = canvas.getContext('2d')!

  // 先计算文字区域高度
  const titleFont = `bold ${18 * S}px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`
  const captionFont = `${14 * S}px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`
  const maxTextW = canvasW - padding * 2

  let textH = 0
  let titleLines: string[] = []
  let captionLines: string[] = []

  if (title) {
    ctx.font = titleFont
    titleLines = wrapText(ctx, title, maxTextW, 24 * S)
    textH += titleLines.length * 24 * S + 8 * S
  }
  if (caption) {
    ctx.font = captionFont
    captionLines = wrapText(ctx, caption, maxTextW, 20 * S)
    textH += captionLines.length * 20 * S + 12 * S
  }

  // 缩略图区域
  const rows = Math.ceil(imgs.length / cols)
  const gridH = rows * thumbSize + (rows - 1) * gap
  const gridTopY = padding + textH

  // 总高度
  const canvasH = gridTopY + gridH + padding
  canvas.height = canvasH

  // 背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // 绘制标题
  let textY = padding
  if (title) {
    ctx.font = titleFont
    ctx.fillStyle = '#1d1d1f'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    titleLines.forEach((line) => {
      ctx.fillText(line, padding, textY)
      textY += 24 * S
    })
    textY += 8 * S
  }

  // 绘制正文
  if (caption) {
    ctx.font = captionFont
    ctx.fillStyle = '#444'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    captionLines.forEach((line) => {
      ctx.fillText(line, padding, textY)
      textY += 20 * S
    })
    textY += 12 * S
  }

  // 绘制缩略图
  for (let i = 0; i < imgs.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = padding + col * (thumbSize + gap)
    const y = gridTopY + row * (thumbSize + gap)

    // 圆角矩形裁剪
    const r = 6 * S
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + thumbSize - r, y)
    ctx.quadraticCurveTo(x + thumbSize, y, x + thumbSize, y + r)
    ctx.lineTo(x + thumbSize, y + thumbSize - r)
    ctx.quadraticCurveTo(x + thumbSize, y + thumbSize, x + thumbSize - r, y + thumbSize)
    ctx.lineTo(x + r, y + thumbSize)
    ctx.quadraticCurveTo(x, y + thumbSize, x, y + thumbSize - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(imgs[i]!, x, y, thumbSize, thumbSize)
    ctx.restore()

    // 序号
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath()
    ctx.arc(x + 14 * S, y + 14 * S, 9 * S, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${10 * S}px -apple-system, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${i + 1}`, x + 14 * S, y + 14.5 * S)
  }

  // 下载
  const blob = await canvasToBlob(canvas, format)
  download(blob, `小红书缩略图_${imageIds.length}张.png`, format)
}
