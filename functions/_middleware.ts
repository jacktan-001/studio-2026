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

/** 改写 <title>：让每个路由在浏览器标签与搜索结果中有独立标题。 */
function setTitle(html: string, title: string): string {
  if (/<title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
  }
  return html.replace('</head>', `  <title>${title}</title>\n</head>`)
}

/** 注入 / 替换 canonical：指向规范化 URL，避免重复内容判定。 */
function setCanonical(html: string, href: string): string {
  const pattern = /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i
  if (pattern.test(html)) {
    return html.replace(pattern, `<link rel="canonical" href="${href}" />`)
  }
  return html.replace('</head>', `  <link rel="canonical" href="${href}" />\n</head>`)
}

/**
 * 替换 id="route-jsonld" 的 JSON-LD 结构化数据块（index.html 内置默认块）。
 * 爬虫据此识别站点 / 应用 / 人物 / 播客实体。
 */
function setJsonLd(html: string, obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj)
  const pattern = /(<script\s+type="application\/ld\+json"\s+id="route-jsonld">)[\s\S]*?(<\/script>)/i
  if (pattern.test(html)) {
    return html.replace(pattern, `$1${json}$2`)
  }
  return html.replace(
    '</head>',
    `  <script type="application/ld+json" id="route-jsonld">${json}</script>\n</head>`,
  )
}

const SOCIAL_SAME_AS = [
  'https://github.com/jacktan-001',
  'https://www.linkedin.com/in/jacktan2011',
  'https://www.instagram.com/jacktan2011',
  'https://space.bilibili.com/97733003',
]

/** 按站点根路径生成对应的 JSON-LD 实体。 */
function buildJsonLd(siteKey: string, origin: string): Record<string, unknown> {
  const base = { '@context': 'https://schema.org', inLanguage: 'zh-CN' }
  switch (siteKey) {
    case '/jack-tan':
      return {
        ...base,
        '@type': 'Person',
        name: '田嘉诚',
        alternateName: 'Jack Tan',
        jobTitle: '民航安全信息化工程师',
        url: origin + '/jack-tan',
        address: { '@type': 'PostalAddress', addressLocality: '北京' },
        sameAs: SOCIAL_SAME_AS,
      }
    case '/jack-wave':
      return {
        ...base,
        '@type': 'WebApplication',
        name: 'Jack Wave · 音乐期刊',
        applicationCategory: 'MusicApplication',
        operatingSystem: 'Web',
        url: origin + '/jack-wave',
        description: '用音乐记录心情的月度期刊：每月一期歌单，一种心情。',
        offers: { '@type': 'Offer', price: '0' },
      }
    case '/jack-pose':
      return {
        ...base,
        '@type': 'WebApplication',
        name: 'Jack Pose · 社媒排版',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web',
        url: origin + '/jack-pose',
        description: '面向社媒的长图排版与导出工具：模板、拖拽、品牌色，一键生成。',
        offers: { '@type': 'Offer', price: '0' },
      }
    case '/jack-talk':
      return {
        ...base,
        '@type': 'PodcastSeries',
        name: 'Jack Talk',
        url: origin + '/jack-talk',
        description: '行业对谈播客：和真正在做的人聊，把行业里没说出口的事摊开谈。',
      }
    case '/jack-craft':
      return {
        ...base,
        '@type': 'WebApplication',
        name: 'Jack Craft · 生成艺术',
        applicationCategory: 'CreativeWork',
        operatingSystem: 'Web',
        url: origin + '/jack-craft',
        description: '生成式的视觉工艺实验场：一条规则、一颗种子，长出未见之形。',
      }
    default:
      return {
        ...base,
        '@type': 'WebSite',
        name: 'Jack Tan Studio',
        url: origin + '/',
        description: '耳听为律，眼见为序。一个持续播放的作品宇宙。',
        author: { '@type': 'Person', name: '田嘉诚', alternateName: 'Jack Tan' },
      }
  }
}

export async function onRequest(context: {
  request: Request
  next: () => Promise<Response>
  env: any
}) {
  const url = new URL(context.request.url)
  const pathname = url.pathname

  // ── 非 HTML GET（静态资源 / API / 非 GET 请求）→ 原样透传 ──────────
  // 这些由 Cloudflare 静态层 / 对应 Function 自行处理，中间件不干预。
  if (
    context.request.method !== 'GET' ||
    hasFileExtension(pathname) ||
    pathname.startsWith('/api/')
  ) {
    return context.next()
  }

  // ── 未知路径（垃圾 URL）→ 真 404 ────────────────────────────────
  if (!isKnownRoute(pathname)) {
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

  // ── 已知 SPA 路由 → 直接取 index.html ───────────────────────────
  // 注意：Pages Function（含本中间件）存在时，_redirects 的
  // `/* /index.html 200` SPA 回退会被绕过，深链会落到 404。因此这里
  // 手动用 ASSETS 取首页，保证 /jack-wave 等深链正常渲染，而非依赖
  // 已被 Function 拦截的 _redirects。
  const asset = await context.env.ASSETS.fetch(
    new Request(new URL('/index.html', url.origin).toString()),
  )
  let html = await asset.text()

  const meta = resolveMeta(pathname)
  const absImage = url.origin + meta.avatar
  const absUrl = url.origin + pathname
  // canonical 规范化：去掉尾部斜杠（根路径保持 /）
  const canonicalPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/'
  const canonicalUrl = url.origin + canonicalPath
  // 独立标题：根路径用站点名，子站为「站点名 | Jack Tan Studio」
  const pageTitle = pathname === '/' ? meta.title : `${meta.title} | Jack Tan Studio`
  // 站点根段（如 /jack-wave/intro → /jack-wave）决定 JSON-LD 实体
  const siteKey = '/' + (pathname.split('/').filter(Boolean)[0] ?? '')

  html = setTitle(html, pageTitle)
  html = setCanonical(html, canonicalUrl)
  html = setJsonLd(html, buildJsonLd(SITE_MAP[siteKey] ? siteKey : '/', url.origin))
  html = setMeta(html, 'property', 'og:title', meta.title)
  html = setMeta(html, 'property', 'og:image', absImage)
  html = setMeta(html, 'property', 'og:image:width', '512')
  html = setMeta(html, 'property', 'og:image:height', '512')
  html = setMeta(html, 'property', 'og:url', absUrl)
  html = setMeta(html, 'name', 'twitter:image', absImage)
  html = setMeta(html, 'name', 'twitter:title', meta.title)
  html = setMeta(html, 'name', 'description', meta.desc)
  // 后台路由不进搜索引擎
  if (pathname === '/admin') {
    html = setMeta(html, 'name', 'robots', 'noindex, nofollow')
  }

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
