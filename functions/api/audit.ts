// ============================================================
// 审计查询接口 /api/audit - 需管理鉴权
// GET ?month=yyyy-MM（默认当月，北京时间）→ { month, entries[] }（倒序）
// ============================================================

import { authenticateAdmin } from '../_lib/adminAuth';
import { getKv, handlePreflight, withCors } from '../_lib/cors';
import { readAudit } from '../_lib/audit';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

export const onRequestGet: PagesFunction<Env> = async (context) =>
  withCors(await handleGet(context), context.request, context.env);

async function handleGet(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(context.request.url);
    const month = url.searchParams.get('month') || undefined;
    const kv = getKv(context.env);
    const result = await readAudit(kv, month);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('[audit:GET] 查询失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
