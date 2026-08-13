// ============================================================
// 公开数据接口 /api/public-data - 无需鉴权，带 ETag / 304
// 前端加载时调用；KV 有数据则返回，否则返回 { cached:false } 让前端回退静态种子
// ============================================================

import { getKv, handlePreflight, withCors } from '../_lib/cors';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

export const onRequestGet: PagesFunction<Env> = async (context) =>
  withCors(await handleGet(context), context.request, context.env);

async function handleGet(context: PagesFunctionContext): Promise<Response> {
  try {
    const kv = getKv(context.env);
    const raw = await kv.get('data:playlists');

    if (raw) {
      // 与前端读取路径对齐：fetchPlaylists / fetchMonthly 读取 json.data.*，
      // 因此这里包装为 { source, data } 信封（与 /api/data GET 保持一致）。
      // 此前直接返回 KV 原始值（无 data 层）导致前端永远回退静态种子。
      const body = JSON.stringify({ source: 'kv', data: JSON.parse(raw) })

      // 基于最终响应内容生成 ETag（SHA-256），支持条件请求
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(body));
      const etag =
        '"' +
        Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('') +
        '"';

      if (context.request.headers.get('If-None-Match') === etag) {
        return new Response(null, {
          status: 304,
          headers: { ETag: etag, 'Cache-Control': 'public, max-age=60' },
        });
      }

      return new Response(body, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          ETag: etag,
        },
      });
    }

    return Response.json({ cached: false }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (e) {
    console.error('[public-data] KV 读取失败:', e);
    // 明确告知前端后端不可用，而非误判为空数据
    return Response.json(
      { error: '数据读取失败，请稍后重试' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
