// ============================================================
// 公开文章接口 /api/public-articles - 无需鉴权，仅返回 published
// GET（无参数）→ 列表 {slug,title,summary,tags,publishedAt}，按发布时间倒序
// GET ?slug=x  → 单篇全文
// 缓存 60s（与 public-data 口径一致）
// ============================================================

import { getKv, handlePreflight, withCors } from '../_lib/cors';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

export const onRequestGet: PagesFunction<Env> = async (context) =>
  withCors(await handleGet(context), context.request, context.env);

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=60' };

interface StoredArticle {
  id: string;
  siteId: string;
  type: string;
  status: string;
  title: string;
  summary?: string;
  body?: string;
  tags?: string[];
  publishedAt: string | null;
  updatedAt: string;
}

async function handleGet(context: PagesFunctionContext): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const kv = getKv(context.env);

    // 枚举所有 studio 文章（首期仅 studio 站点开放 Notes）
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await kv.list({ prefix: 'site:', cursor });
      keys.push(...result.keys.map((k) => k.name));
      cursor = result.list_complete ? undefined : (result as any).cursor;
    } while (cursor);

    const articles = (
      await Promise.all(
        keys
          .filter((k) => /:content:article:/.test(k))
          .map((k) =>
            kv
              .get(k)
              .then((raw) => (raw ? (JSON.parse(raw) as StoredArticle) : null))
              .catch(() => null),
          ),
      )
    )
      .filter((a): a is StoredArticle => a !== null && a.status === 'published')
      .sort((a, b) => ((a.publishedAt || '') < (b.publishedAt || '') ? 1 : -1));

    const slug = url.searchParams.get('slug');
    if (slug) {
      const found = articles.find((a) => a.id === slug);
      if (!found) return Response.json({ error: '文章不存在' }, { status: 404, headers: CACHE_HEADERS });
      return Response.json({ article: found }, { headers: CACHE_HEADERS });
    }

    return Response.json(
      {
        articles: articles.map((a) => ({
          slug: a.id,
          title: a.title,
          summary: a.summary || '',
          tags: a.tags || [],
          publishedAt: a.publishedAt,
        })),
      },
      { headers: CACHE_HEADERS },
    );
  } catch (e) {
    console.error('[public-articles] 查询失败:', e);
    return Response.json({ error: '数据读取失败，请稍后重试' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
