// ============================================================
// 图片代理 /api/img?u=<Apple 图床 URL>
//
// 背景：封面托管在 Apple 图床（is*-ssl.mzstatic.com），该域名在国内
// 网络环境不可达，导致线上封面全黑。Cloudflare 边缘节点可正常访问，
// 因此用 Pages Function 做同源代理：浏览器只请求本站域名。
//
// 安全：仅放行 Apple 官方图床域名白名单，避免成为开放代理。
// 缓存：边缘 7 天（封面 URL 带内容哈希），浏览器 1 天。
// ============================================================

const ALLOWED_HOST =
  /^https:\/\/[a-z0-9-]*\.?(mzstatic\.com|itunes\.apple\.com|apple\.com)(\/|$)/i;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const target = url.searchParams.get('u') || '';

  if (!ALLOWED_HOST.test(target)) {
    return Response.json(
      { error: '仅允许代理 Apple 图床域名（mzstatic.com / itunes.apple.com / apple.com）' },
      { status: 403 },
    );
  }

  try {
    const upstream = await fetch(target, {
      cf: { cacheEverything: true, cacheTtl: 60 * 60 * 24 * 7 },
      headers: { 'User-Agent': 'studio-2026-image-proxy/1.0' },
    } as RequestInit);

    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: `上游取图失败: HTTP ${upstream.status}` }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (e: any) {
    return Response.json({ error: '图片代理异常', message: e?.message }, { status: 502 });
  }
};
