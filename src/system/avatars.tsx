import type { SiteId } from '../registry/projects'

/**
 * 统一头像资源 — 单一事实来源（页面展示 + PWA 图标 + 微信分享三处共用）。
 *
 * 映射规则：
 *  - 门户 / 与 PWA 应用图标 / 默认分享 → 品牌头像 studio.png
 *  - 各子站 → 该子站专属头像（与微信分享 og:image 完全一致）
 *
 * 注意：Cloudflare Pages Function 的 OG 注入中间件（functions/_middleware.ts）
 * 内有同一份映射的副本（因 functions 与前端是独立构建上下文，无法跨域 import）。
 * 修改时两处需同步。
 */
export const SITE_AVATARS: Record<SiteId, string> = {
  portal: '/avatars/studio.png',
  'jack-tan': '/avatars/jack-tan.jpg',
  'jack-pose': '/avatars/jack-pose.jpg',
  'jack-wave': '/avatars/jack-wave.jpg',
  'jack-talk': '/avatars/jack-talk.jpg',
  'jack-craft': '/avatars/jack-craft.jpg',
  notes: '/avatars/studio.png',
  admin: '/avatars/studio.png',
}

export function avatarForSite(siteId: string): string {
  return (SITE_AVATARS as Record<string, string>)[siteId] ?? SITE_AVATARS.portal
}

interface SiteAvatarProps {
  siteId: string
  /** 额外 class，如 "site-avatar-hero" 定位到 hero */
  className?: string
  /** 当主题未加载时回退用的强调色（CSS 变量 --accent 优先） */
  alt?: string
  size?: number
}

/**
 * 统一的站点头像组件。圆环描边自动取当前站点主题色（ThemeProvider 注入的
 * --accent），保证与各处设计语言一致。各子站以相同 class / 相同位置调用即可。
 */
export function SiteAvatar({ siteId, className = '', alt, size = 96 }: SiteAvatarProps) {
  const src = avatarForSite(siteId)
  return (
    <img
      src={src}
      alt={alt ?? `${siteId} 头像`}
      className={`site-avatar ${className}`.trim()}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
    />
  )
}
