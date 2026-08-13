// ============================================================
// 投稿管理接口 /api/submissions - 需管理鉴权
// GET    列表（并行读取 + 分页 + 状态/站点过滤）
// PATCH  修改单条状态（pending / approved / rejected）+ 审核备注
// POST   审发闭环：approved 的 wave 歌单投稿并入 data:playlists
// DELETE 删除单条
// ============================================================

import { authenticateAdmin } from '../_lib/adminAuth';
import { getKv, handlePreflight, withCors } from '../_lib/cors';
import { appendAudit } from '../_lib/audit';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALLOWED_STATUS = ['pending', 'approved', 'rejected', 'merged'] as const;

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
    const siteFilter = url.searchParams.get('siteId');

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
    if (siteFilter) {
      submissions = submissions.filter((s) => (s.siteId || 'jack-wave') === siteFilter);
    }

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
    const body = (await context.request.json()) as {
      id?: string;
      status?: string;
      reviewNote?: string;
    };
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
    if (body.reviewNote !== undefined) {
      submission.reviewNote = String(body.reviewNote).slice(0, 200);
    }
    await kv.put(`submission:${id}`, JSON.stringify(submission));

    await appendAudit(kv, {
      op: 'review.' + status,
      target: `submission:${id}`,
      summary: `审核「${submission.playlistName || submission.description?.slice(0, 30) || id}」→ ${status}`,
    });

    return Response.json({ success: true, submission });
  } catch (e) {
    console.error('[submissions:PATCH] 更新失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ---- POST：审发闭环（并入歌单） ----
export const onRequestPost: PagesFunction<Env> = async (context) =>
  withCors(await handlePost(context), context.request, context.env);

async function handlePost(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await context.request.json()) as { action?: string; id?: string };
    if (body.action !== 'merge' || !body.id) {
      return Response.json({ error: '仅支持 {action:"merge", id}' }, { status: 400 });
    }

    const kv = getKv(context.env);
    const raw = await kv.get(`submission:${body.id}`);
    if (!raw) return Response.json({ error: '投稿不存在' }, { status: 404 });
    const submission = JSON.parse(raw);

    if (submission.status !== 'approved') {
      return Response.json({ error: '仅 approved 状态的投稿可并入' }, { status: 400 });
    }
    if ((submission.siteId || 'jack-wave') !== 'jack-wave') {
      return Response.json({ error: '当前仅 Jack Wave 歌单投稿支持并入发布' }, { status: 400 });
    }
    if (!['link', 'manual', 'screenshot'].includes(submission.type)) {
      return Response.json({ error: '该投稿类型不支持并入歌单' }, { status: 400 });
    }

    // 读取现有歌单数据（KV 为空时用空结构）
    const dataRaw = await kv.get('data:playlists');
    const data = dataRaw
      ? JSON.parse(dataRaw)
      : { moodPlaylists: [], monthlyShares: [], allTags: [] };
    if (!Array.isArray(data.moodPlaylists)) data.moodPlaylists = [];
    const before = JSON.parse(JSON.stringify(data));

    // 新条目 id：现有数字 id 最大值 +1（'01'…'06' → '07'）
    const maxNo = data.moodPlaylists.reduce((max: number, p: any) => {
      const n = parseInt(p.id, 10);
      return Number.isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = String(maxNo + 1).padStart(2, '0');

    // 投稿的文本曲目 → 结构化曲目（仅标题，可后续在歌单管理中补全音源）
    const lines = String(submission.songList || '')
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean)
      .slice(0, 50);
    const songList = lines.map((title: string, i: number) => ({
      id: `${newId}-${i + 1}`,
      title: title.slice(0, 100),
      artist: '',
      duration: '',
      src: 'submission',
    }));

    const cstNow = new Date(Date.now() + 8 * 3600 * 1000);
    const entry = {
      id: newId,
      title: String(submission.playlistName || '投稿精选').slice(0, 100),
      mood: submission.tags?.[0] ? String(submission.tags[0]) : '投稿精选',
      date: cstNow.toISOString().slice(0, 7).replace('-', '.'),
      note:
        String(submission.description || '') +
        (submission.authorName ? `｜投稿人：${submission.authorName}` : ''),
      songList,
    };

    data.moodPlaylists.push(entry);
    await kv.put('data:playlists', JSON.stringify(data));
    await kv.put('data:playlists:updatedAt', new Date().toISOString());

    submission.status = 'merged';
    submission.reviewedAt = new Date().toISOString();
    await kv.put(`submission:${body.id}`, JSON.stringify(submission));

    await appendAudit(kv, {
      op: 'playlist.merge',
      target: 'data:playlists',
      summary: `投稿「${entry.title}」并入歌单（id=${newId}，${songList.length} 首）`,
      before,
      after: data,
    });

    return Response.json({ success: true, entry });
  } catch (e) {
    console.error('[submissions:POST] 并入失败:', e);
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
    const raw = await kv.get(`submission:${id}`);
    const before = raw ? JSON.parse(raw) : null;
    await kv.delete(`submission:${id}`);
    if (before) {
      await appendAudit(kv, {
        op: 'submission.delete',
        target: `submission:${id}`,
        summary: `删除投稿「${before.playlistName || before.description?.slice(0, 30) || id}」`,
        before,
      });
    }
    return Response.json({ success: true });
  } catch (e) {
    console.error('[submissions:DELETE] 删除失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
