// Single source of truth for project registry.
// Add a new sub-site = add ONE row here + create sites/<id>/ (2 edits, no pipeline changes).

export type ThemeKey = 'violet' | 'pink' | 'cyan' | 'orange' | 'purple' | 'emerald' | 'gold'
export type ProjectStatus = 'live' | 'coming-soon'

export interface ProjectMeta {
  id: string
  name: string
  shortName: string
  href: string
  status: ProjectStatus
  tagline: string
  role: string
  themeKey: ThemeKey
  year?: string
  description?: string
  features?: string[]
  tech?: string[]
}

export const PROJECTS: ProjectMeta[] = [
  {
    id: 'jack-tan',
    name: 'Jack Tan',
    shortName: 'Tan',
    href: '/jack-tan',
    status: 'live',
    tagline: '民航安全信息化 · 技术驱动者',
    role: 'Personal Portfolio',
    themeKey: 'violet',
    year: '2026',
    description:
      'Jack Tan 是主理人的个人作品与履历门户，串起十余年民航安全信息化一线的技术实践。从飞行品质监控、跑道安全到运行风险建模，这里把复杂的行业系统翻译成可读、可感、可交互的叙事，让外行看见航空安全的精密，让同行看见工程的克制。',
    features: [
      '职业时间线：按阶段回溯关键项目',
      '工程案例：安全系统架构与落地细节',
      '文章与思考：行业观察与方法论',
      '联系与合作：直达主理人',
    ],
    tech: ['React 19', 'Vite', 'TypeScript', 'Tailwind v4', 'Cloudflare Pages'],
  },
  {
    id: 'jack-pose',
    name: 'Jack Pose',
    shortName: 'Pose',
    href: '/jack-pose',
    status: 'live',
    tagline: '社媒长图排版与导出',
    role: 'Layout Studio',
    themeKey: 'pink',
    year: '2026',
    description:
      'Jack Pose 是一块为朋友圈、小红书、微信公众号而生的长图画布。拖入照片，自由拼贴成 9:16 的竖屏长图，实时预览微信与小红书两种平台的真实观感，一键导出高清 PNG。所有工程数据留在本地浏览器，离线也能安心排版。',
    features: [
      '拖拽网格排版：自由混排照片与文字',
      '多图批量上传：一次带入整个相册',
      '微信 / 小红书预览：实时对照平台观感',
      '9:16 长图：适配竖屏社媒流',
      '一键导出 PNG：高清无水印',
      '本地存档：IndexedDB 持久化工程',
    ],
    tech: ['React 19', 'Canvas', 'IndexedDB', 'PWA', 'Vite'],
  },
  {
    id: 'jack-wave',
    name: 'Jack Wave',
    shortName: 'Wave',
    href: '/jack-wave',
    status: 'live',
    tagline: '音乐与心情期刊',
    role: 'Music Journal',
    themeKey: 'cyan',
    year: '2026',
    description:
      'Jack Wave 是一本用歌单写成的期刊。每一期围绕一种心情挑选曲目，串起旋律、文字与当月的碎念。你可以在线收听，也可以投递属于自己的主题歌单——经后台审核后，它们会出现在下一期里，成为这本期刊的一部分。',
    features: [
      '心情歌单：按刊期组织的主题播放列表',
      '在线播放：内置播放器，跨页不断播',
      '用户投稿：投递你的主题歌单',
      '后台审核：投稿经审核后上刊',
      '月报分享：每月一期的声音札记',
    ],
    tech: ['React 19', 'Web Audio', 'Cloudflare KV', 'Pages Functions', 'Vite'],
  },
  {
    id: 'jack-talk',
    name: 'Jack Talk',
    shortName: 'Talk',
    href: '/jack-talk',
    status: 'live',
    tagline: '播客 · 行业对谈',
    role: 'Podcast',
    themeKey: 'orange',
    year: '2026',
    description:
      'Jack Talk 是一档关于航空、工程与创造的访谈播客。每期邀请一位同行，聊他们正在拆解的真实问题——从适航条款到生成式设计。没有脚本，只有带着现场感的对谈，和一份可订阅的声音档案。',
    features: [
      '节目列表：按系列浏览往期对谈',
      '音频播放：内置波形播放器',
      '嘉宾介绍：每期的人物与背景',
      '订阅入口：RSS 与主流播客平台',
    ],
    tech: ['React 19', 'Web Audio', 'RSS', 'Cloudflare Pages', 'Vite'],
  },
  {
    id: 'jack-craft',
    name: 'Jack Craft',
    shortName: 'Craft',
    href: '/jack-craft',
    status: 'live',
    tagline: 'WebGL 生成艺术',
    role: 'Generative Art',
    themeKey: 'emerald',
    year: '2026',
    description:
      'Jack Craft 是一处实时生成的艺术实验场。着色器在浏览器里持续运算，把噪声、场与光编织成永不重复的画面。每一次刷新都是一次新的生成，你可以调节参数、截下心动的瞬间，把它带回家当壁纸。',
    features: [
      '实时着色：WebGL 逐帧生成画面',
      '参数调节：现场改变生成规则',
      '截屏导出：定格任意一帧',
      '随机种子：每次进入都不同',
    ],
    tech: ['React 19', 'WebGL', 'GLSL', 'Generative', 'Vite'],
  },
  {
    id: 'notes',
    name: 'Jack Notes',
    shortName: 'Notes',
    href: '/notes',
    status: 'live',
    tagline: '随笔 · 想法 · 观察',
    role: 'Journal',
    themeKey: 'gold',
    year: '2026',
    description:
      'Jack Notes 是主理人的随笔与思考空间。记录民航安全、工程实践、设计决策与创作过程中的片段，把未成文的观察整理成可读的短文。',
    features: [
      '月度随笔：按主题整理的短文章',
      '公开只读：经 KV 同步的轻量内容',
      'RSS 友好：未来可订阅更新',
      '与子站联动：为各项目提供背景注解',
    ],
    tech: ['React 19', 'Cloudflare KV', 'Markdown', 'Vite'],
  },
]

/** Map a route pathname to a theme key. Portal + jack-tan default to violet. */
export function getThemeKeyForPath(pathname: string): ThemeKey {
  if (pathname === '/notes' || pathname.startsWith('/notes/')) return 'gold'
  for (const p of PROJECTS) {
    if (pathname === p.href || pathname.startsWith(p.href + '/')) return p.themeKey
  }
  return 'violet'
}

/**
 * Stable per-SITE id (distinct from the 5 shared theme colors). Used to pick a
 * global ambient renderer. Portal + each project resolve to their own id;
 * /admin resolves to 'admin'; unknown routes fall back to 'portal'.
 */
export type SiteId =
  | 'portal'
  | 'jack-tan'
  | 'jack-pose'
  | 'jack-wave'
  | 'jack-talk'
  | 'jack-craft'
  | 'notes'
  | 'admin'

export function getSiteIdForPath(pathname: string): SiteId {
  if (pathname === '/notes' || pathname.startsWith('/notes/')) return 'notes'
  for (const p of PROJECTS) {
    if (pathname === p.href || pathname.startsWith(p.href + '/')) {
      return p.id as SiteId
    }
  }
  if (pathname.startsWith('/admin')) return 'admin'
  return 'portal'
}

export function getProjectByPath(pathname: string): ProjectMeta | undefined {
  for (const p of PROJECTS) {
    if (pathname === p.href || pathname.startsWith(p.href + '/')) return p
  }
  return undefined
}

export const LIVE_PROJECTS = PROJECTS.filter((p) => p.status === 'live')
export const COMING_SOON = PROJECTS.filter((p) => p.status === 'coming-soon')
