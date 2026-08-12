// ============================================================
// 投稿管理接口 /api/submissions - 需管理鉴权
// GET    列表（并行读取 + 分页 + 状态过滤）
// PATCH  修改单条状态（pending / approved / rejected）
// DELETE 删除单条
// ============================================================

import { authenticateAdmin } from '../_lib/adminAuth';
import { getKv, handlePreflight, withCors } from '../_lib/cors';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALLOWED_STATUS = ['pending', 'approved', 'rejected'] as const;

function parseIntParam(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return Number.isNaN(num) ? defaultValue : num;
}

/** 枚举所有投稿 key（KV list 单次最多 1000，用 cursor 翻页） */
async function listSubmissionKeys(kv: KVNamespace): Promise<string[]> {
  const allKeys: string[] = [];
  let cursor: string | undefined;
  do {
    const result = await kv.list({ prefix: 'submission:', cursor });
    allKeys.push(
      ...result.keys.filter((k) => k.name !== 'submission:list').map((k) => k.name),
    );
    cursor = result.list_complete ? undefined : (result as any).cursor;
  } while (cursor);
  return allKeys;
}

// ---- GET ----
export const onRequestGet: PagesFunction<Env> = async (context) =>
  withCors(await handleGet(context), context.request, context.env);

async function handleGet(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  const url = new URL(context.request.url);

  try {
    const kv = getKv(context.env);
    const page = Math.max(1, parseIntParam(url.searchParams.get('page'), DEFAULT_PAGE));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseIntParam(url.searchParams.get('limit'), DEFAULT_LIMIT)),
    );
    const statusFilter = url.searchParams.get('status');

    const allKeys = await listSubmissionKeys(kv);
    if (allKeys.length === 0) {
      return Response.json({
        submissions: [],
        counts: { pending: 0, approved: 0, rejected: 0, total: 0 },
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // 并行读取，避免 N+1 串行
    const results = await Promise.all(
      allKeys.map((key) =>
        kv
          .get(key)
          .then((raw) => (raw ? JSON.parse(raw) : null))
          .catch(() => null),
      ),
    );

    const all = results.filter((s): s is Record<string, any> => s !== null);

    const counts = {
      pending: all.filter((s) => s.status === 'pending').length,
      approved: all.filter((s) => s.status === 'approved').length,
      rejected: all.filter((s) => s.status === 'rejected').length,
      total: all.length,
    };

    let submissions = statusFilter ? all.filter((s) => s.status === statusFilter) : all;

    submissions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = submissions.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;

    return Response.json({
      submissions: submissions.slice(startIndex, startIndex + limit),
      counts,
      pagination: { page, limit, total, totalPages },
    });
  } catch (e) {
    console.error('[submissions:GET] 查询失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ---- PATCH：更新状态 ----
export const onRequestPatch: PagesFunction<Env> = async (context) =>
  withCors(await handlePatch(context), context.request, context.env);

async function handlePatch(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await context.request.json()) as { id?: string; status?: string };
    const { id, status } = body;

    if (!id) return Response.json({ error: '缺少 id 参数' }, { status: 400 });
    if (!status || !ALLOWED_STATUS.includes(status as (typeof ALLOWED_STATUS)[number])) {
      return Response.json(
        { error: `status 只允许: ${ALLOWED_STATUS.join(', ')}` },
        { status: 400 },
      );
    }

    const kv = getKv(context.env);
    const raw = await kv.get(`submission:${id}`);
    if (!raw) return Response.json({ error: '投稿不存在' }, { status: 404 });

    const submission = JSON.parse(raw);
    submission.status = status;
    submission.reviewedAt = new Date().toISOString();
    await kv.put(`submission:${id}`, JSON.stringify(submission));

    return Response.json({ success: true, submission });
  } catch (e) {
    console.error('[submissions:PATCH] 更新失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ---- DELETE ----
export const onRequestDelete: PagesFunction<Env> = async (context) =>
  withCors(await handleDelete(context), context.request, context.env);

async function handleDelete(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return Response.json({ error: '缺少 id 参数' }, { status: 400 });

  try {
    const kv = getKv(context.env);
    await kv.delete(`submission:${id}`);
    return Response.json({ success: true });
  } catch (e) {
    console.error('[submissions:DELETE] 删除失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
