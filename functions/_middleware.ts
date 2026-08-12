/**
 * 微信分享 / Open Graph 元数据注入 + 真 404 中间件。
 *
 * 站点为 SPA，所有路由共用 index.html。微信 / 各社交平台爬虫抓取链接时
 * 只读取服务端返回的 HTML <head>，不会执行 JS，因此必须在边缘（Pages Function）
 * 按路由把对应头像注入 og:image 等标签，才能保证分享卡片显示正确的头像。
 *
 * 此外 `_redirects` 的 `/* /index.html 200` 会让所有未知路径都回退到 index.html
 * （软 404，对 SEO 有害）。本中间件对"非已知路由 + 非静态资源 + 非 /api"的请求
 * 直接返回 404.html（HTTP 404），修复审计 P0-3 的软 404 问题，同时保留已知
 * 深链的 SPA 回退。
 *
 * 头像映射与前端 src/system/avatars.tsx 的 SITE_AVATARS 保持完全一致。
 * 修改时两处需同步。
 */
interface RouteMeta {
  avatar: string
  title: string
  desc: string
}

const SITE_MAP: Record<string, RouteMeta> = {
  '/': {
    avatar: '/avatars/studio.png',
    title: 'Jack Tan Studio',
    desc: '耳听为律，眼见为序。一个持续播放的作品宇宙。',
  },
  '/jack-tan': {
    avatar: '/avatars/jack-tan.jpg',
    title: 'Jack Tan · 个人作品集',
    desc: '田嘉诚的个人影像与创作档案。',
  },
  '/jack-pose': {
    avatar: '/avatars/jack-pose.jpg',
    title: 'Jack Pose · 社媒排版',
    desc: '为社媒打造的高质感长图与版式设计。',
  },
  '/jack-wave': {
    avatar: '/avatars/jack-wave.jpg',
    title: 'Jack Wave · 音乐期刊',
    desc: '用音乐记录心情的月度期刊。',
  },
  '/jack-talk': {
    avatar: '/avatars/jack-talk.jpg',
    title: 'Jack Talk · 播客',
    desc: '每周更新的行业对谈播客。',
  },
  '/jack-craft': {
    avatar: '/avatars/jack-craft.jpg',
    title: 'Jack Craft · 工艺',
    desc: '生成式的视觉工艺实验场。',
  },
}

const SITE_IDS = ['jack-tan', 'jack-pose', 'jack-wave', 'jack-talk', 'jack-craft']

/** 是否与站内已知路由匹配（用于区分"合法深链"与"垃圾路径"）。 */
function isKnownRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/admin') return true
  // 五个分站及其子路径（如 /jack-pose/studio、/jack-tan/intro）
  if (SITE_IDS.some((id) => pathname === `/${id}` || pathname.startsWith(`/${id}/`))) return true
  // 其余未知单段 / 双段（如 /foo、/foo/intro）一律视为未知 → 404
  return false
}

/** 是否像静态资源（带扩展名，如 /assets/x.js、/icons/x.png）。 */
function hasFileExtension(pathname: string): boolean {
  const clean = pathname.split('?')[0].split('#')[0]
  return /\.[a-zA-Z0-9]+$/.test(clean)
}

function resolveMeta(pathname: string): RouteMeta {
  // 精确匹配优先；否则按路径前缀匹配（如 /jack-tan/foo -> jack-tan）
  if (SITE_MAP[pathname]) return SITE_MAP[pathname]
  const seg = '/' + (pathname.split('/').filter(Boolean)[0] ?? '')
  return SITE_MAP[seg] ?? SITE_MAP['/']
}

function setMeta(html: string, attr: string, key: string, value: string): string {
  // attr: "property" | "name"; key: 标签名（如 og:image）
  const pattern = new RegExp(
    `(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`,
    'i',
  )
  if (pattern.test(html)) {
    return html.replace(pattern, `$1${value}$2`)
  }
  // 不存在则插入到 </head> 之前
  return html.replace('</head>', `  <meta ${attr}="${key}" content="${value}" />\n</head>`)
}

export async function onRequest(context: {
  request: Request
  next: () => Promise<Response>
  env: any
}) {
  const url = new URL(context.request.url)
  const pathname = url.pathname

  // ── 真 404（仅对 HTML 导航类 GET 请求生效）──────────────────────
  // 排除：已知路由、静态资源（带扩展名）、/api/*（由 Functions 自行处理）。
  if (
    context.request.method === 'GET' &&
    !hasFileExtension(pathname) &&
    !pathname.startsWith('/api/') &&
    !isKnownRoute(pathname)
  ) {
    try {
      const asset = await context.env.ASSETS.fetch(
        new Request(new URL('/404.html', url.origin).toString()),
      )
      const body = await asset.text()
      return new Response(body, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      })
    } catch {
      // 兜底：即便读不到 404.html 也不回退成软 404
      return new Response('404 Not Found', { status: 404 })
    }
  }

  const response = await context.next()
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const meta = resolveMeta(url.pathname)

  const absImage = url.origin + meta.avatar
  const absUrl = url.origin + url.pathname

  let html = await response.text()
  html = setMeta(html, 'property', 'og:title', meta.title)
  html = setMeta(html, 'property', 'og:image', absImage)
  html = setMeta(html, 'property', 'og:image:width', '512')
  html = setMeta(html, 'property', 'og:image:height', '512')
  html = setMeta(html, 'property', 'og:url', absUrl)
  html = setMeta(html, 'name', 'twitter:image', absImage)
  html = setMeta(html, 'name', 'twitter:title', meta.title)
  html = setMeta(html, 'name', 'description', meta.desc)

  const headers = new Headers(response.headers)
  headers.delete('content-length')
  return new Response(html, { status: response.status, headers })
}
