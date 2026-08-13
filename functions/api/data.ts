// ============================================================
// 数据管理接口 /api/data - 需管理鉴权
// GET    读取 KV 中的歌单数据
// PUT    写入歌单数据（结构校验 + 5MB 上限）
// DELETE 清空 KV 数据（回退到前端静态种子）
// ============================================================

import { authenticateAdmin } from '../_lib/adminAuth';
import { getKv, handlePreflight, withCors } from '../_lib/cors';
import { appendAudit } from '../_lib/audit';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

/** 最大数据大小限制：5MB */
const MAX_DATA_SIZE = 5 * 1024 * 1024;

/** 校验数据结构：顶层三个数组 + 每个歌单的必需字段 */
function validateDataStructure(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: '数据必须是一个对象' };
  }
  if (!Array.isArray(body.moodPlaylists)) {
    return { valid: false, error: 'moodPlaylists 必须是数组' };
  }
  if (!Array.isArray(body.monthlyShares)) {
    return { valid: false, error: 'monthlyShares 必须是数组' };
  }
  if (!Array.isArray(body.allTags)) {
    return { valid: false, error: 'allTags 必须是数组' };
  }

  for (const playlist of body.moodPlaylists) {
    if (!playlist || typeof playlist !== 'object') {
      return { valid: false, error: 'moodPlaylists 中的每一项必须是对象' };
    }
    if (!playlist.id) return { valid: false, error: '每个歌单必须有 id 字段' };
    if (!playlist.title) return { valid: false, error: '每个歌单必须有 title 字段' };
    if (!Array.isArray(playlist.songList)) {
      return { valid: false, error: `歌单「${playlist.title}」的 songList 必须是数组` };
    }
    for (const song of playlist.songList) {
      if (!song || typeof song !== 'object') {
        return { valid: false, error: `歌单「${playlist.title}」中存在非法曲目` };
      }
      if (!song.id || !song.title) {
        return { valid: false, error: `歌单「${playlist.title}」中的曲目缺少 id 或 title` };
      }
    }
  }

  return { valid: true };
}

// ---- GET ----
export const onRequestGet: PagesFunction<Env> = async (context) =>
  withCors(await handleGet(context), context.request, context.env);

async function handleGet(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  try {
    const kv = getKv(context.env);
    const raw = await kv.get('data:playlists');
    if (raw) return Response.json({ source: 'kv', data: JSON.parse(raw) });
    return Response.json({ source: 'seed', data: null });
  } catch (e) {
    console.error('[data:GET] KV 读取失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ---- PUT ----
export const onRequestPut: PagesFunction<Env> = async (context) =>
  withCors(await handlePut(context), context.request, context.env);

async function handlePut(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  try {
    const kv = getKv(context.env);
    const body = (await context.request.json()) as any;

    const validation = validateDataStructure(body);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const serialized = JSON.stringify(body);
    if (serialized.length > MAX_DATA_SIZE) {
      return Response.json(
        { error: `数据大小超过限制（最大 ${MAX_DATA_SIZE / 1024 / 1024}MB）` },
        { status: 413 },
      );
    }

    const rawBefore = await kv.get('data:playlists');
    const before = rawBefore ? JSON.parse(rawBefore) : null;

    await kv.put('data:playlists', serialized);
    await kv.put('data:playlists:updatedAt', new Date().toISOString());

    await appendAudit(kv, {
      op: 'data.put',
      target: 'data:playlists',
      summary: `保存歌单数据（心情刊 ${body.moodPlaylists.length} 期 / 月度 ${body.monthlyShares.length} 期）`,
      before: before || undefined,
      after: body,
    });

    return Response.json({ success: true, size: serialized.length });
  } catch (e) {
    console.error('[data:PUT] KV 写入失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ---- DELETE ----
export const onRequestDelete: PagesFunction<Env> = async (context) =>
  withCors(await handleDelete(context), context.request, context.env);

async function handleDelete(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  try {
    const kv = getKv(context.env);
    const rawBefore = await kv.get('data:playlists');
    const before = rawBefore ? JSON.parse(rawBefore) : null;
    await kv.delete('data:playlists');
    await kv.delete('data:playlists:updatedAt');
    await appendAudit(kv, {
      op: 'data.delete',
      target: 'data:playlists',
      summary: '清空歌单数据（回退静态种子）',
      before: before || undefined,
    });
    return Response.json({ success: true });
  } catch (e) {
    console.error('[data:DELETE] KV 删除失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
