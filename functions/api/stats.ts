// ============================================================
// 访问统计查询 /api/stats - 需管理鉴权
// GET ?days=N（默认 7，最大 30）→ 返回每日 pv / uv / 路由分布 / 来源
// ============================================================

import { authenticateAdmin } from '../_lib/adminAuth';
import { getKv, handlePreflight, withCors } from '../_lib/cors';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

export const onRequestGet: PagesFunction<Env> = async (context) =>
  withCors(await handleGet(context), context.request, context.env);

function todayCST(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function shiftDate(ymd: string, deltaDays: number): string {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

async function handleGet(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(context.request.url);
    const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '7', 10) || 7, 1), 30);
    const kv = getKv(context.env);

    const result: Array<{
      date: string;
      pv: number;
      uv: number;
      paths: Record<string, number>;
      refs: Record<string, number>;
    }> = [];

    for (let i = 0; i < days; i++) {
      const date = shiftDate(todayCST(), -i);
      const [dayRaw, uvRaw] = await Promise.all([
        kv.get('stats:day:' + date),
        kv.get('stats:uv:' + date),
      ]);
      const day = dayRaw
        ? (JSON.parse(dayRaw) as { pv: number; paths: Record<string, number> })
        : { pv: 0, paths: {} };
      const uvs = uvRaw ? (JSON.parse(uvRaw) as string[]) : [];

      // paths 里混有 ref:* 前缀的来源计数，拆分输出
      const paths: Record<string, number> = {};
      const refs: Record<string, number> = {};
      for (const [k, v] of Object.entries(day.paths || {})) {
        if (k.startsWith('ref:')) refs[k.slice(4)] = v;
        else paths[k] = v;
      }

      result.push({ date, pv: day.pv, uv: uvs.length, paths, refs });
    }

    const totalPv = result.reduce((s, d) => s + d.pv, 0);
    return Response.json({ days: result, totalPv });
  } catch (e) {
    console.error('[stats] 查询失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
