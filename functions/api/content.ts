// ============================================================
// 内容管理接口 /api/content - 需管理鉴权（内容中枢 P1）
// 寻址规范：site:<siteId>:content:<type>:<id>
//
// GET    ?action=list&siteId=&type=&status=&page=&limit=   列表
// GET    ?key=<key>                                        读取单条
// PUT    ?key=<key>  body=内容对象                          创建/更新
// DELETE ?key=<key>                                        删除
// POST   {action:'publish'|'unpublish'|'archive', key}     状态切换
//
// 设计约定：
// - /api/data 冻结为 wave 专用，多站内容一律走本端点
// - 内容对象 = 单 key + status 字段（draft|published|archived），无双副本
// - 所有写操作 appendAudit（关键写入附 before/after 快照）
// ============================================================

import { authenticateAdmin } from '../_lib/adminAuth';
import { getKv, handlePreflight, withCors } from '../_lib/cors';
import { appendAudit } from '../_lib/audit';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

const KEY_PATTERN = /^site:([a-z0-9-]+):content:([a-z0-9-]+):([a-z0-9-]+)$/;
const ALLOWED_STATUS = ['draft', 'published', 'archived'] as const;
const MAX_BODY_BYTES = 200 * 1024; // 正文 ≤200KB
const MAX_LIST_LIMIT = 100;

const LIMITS = {
  title: 120,
  slug: 80,
  summary: 300,
  tagCount: 8,
  tagLength: 20,
};

type ContentStatus = (typeof ALLOWED_STATUS)[number];

interface ContentObject {
  id: string;
  siteId: string;
  type: string;
  status: ContentStatus;
  title: string;
  slug?: string;
  summary?: string;
  body?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

function keyOf(siteId: string, type: string, id: string): string {
  return `site:${siteId}:content:${type}:${id}`;
}

function parseKey(key: string): { siteId: string; type: string; id: string } | null {
  const m = KEY_PATTERN.exec(key);
  if (!m) return null;
  return { siteId: m[1], type: m[2], id: m[3] };
}

/** 校验内容对象（写入前） */
function validateContent(body: any, parsedKey: { siteId: string; type: string; id: string }): string | null {
  if (!body || typeof body !== 'object') return '内容必须是一个对象';
  if (typeof body.title !== 'string' || !body.title.trim()) return 'title 为必填字符串';
  if (body.title.length > LIMITS.title) return `title 不能超过 ${LIMITS.title} 字`;
  if (body.siteId !== parsedKey.siteId) return 'siteId 与 key 不一致';
  if (body.type !== parsedKey.type) return 'type 与 key 不一致';
  if (body.id !== parsedKey.id) return 'id 与 key 不一致';
  if (body.status && !ALLOWED_STATUS.includes(body.status)) {
    return `status 只允许: ${ALLOWED_STATUS.join(', ')}`;
  }
  if (typeof body.body === 'string' && body.body.length > MAX_BODY_BYTES) {
    return `正文不能超过 ${MAX_BODY_BYTES / 1024}KB`;
  }
  if (body.summary && String(body.summary).length > LIMITS.summary) {
    return `summary 不能超过 ${LIMITS.summary} 字`;
  }
  if (body.tags) {
    if (!Array.isArray(body.tags)) return 'tags 必须是数组';
    if (body.tags.length > LIMITS.tagCount) return `标签不能超过 ${LIMITS.tagCount} 个`;
    for (const t of body.tags) {
      if (String(t).length > LIMITS.tagLength) return `每个标签不能超过 ${LIMITS.tagLength} 字`;
    }
  }
  return null;
}

// ---- GET ----
export const onRequestGet: PagesFunction<Env> = async (context) =>
  withCors(await handleGet(context), context.request, context.env);

async function handleGet(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  const url = new URL(context.request.url);
  const kv = getKv(context.env);

  try {
    const key = url.searchParams.get('key');

    // 单条读取
    if (key) {
      if (!parseKey(key)) return Response.json({ error: 'key 格式无效' }, { status: 400 });
      const raw = await kv.get(key);
      if (!raw) return Response.json({ error: '内容不存在' }, { status: 404 });
      return Response.json({ content: JSON.parse(raw) });
    }

    // 列表：按 siteId/type 前缀枚举（不维护索引 key）
    const siteId = url.searchParams.get('siteId');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));

    const prefix = siteId
      ? type
        ? `site:${siteId}:content:${type}:`
        : `site:${siteId}:content:`
      : 'site:';

    // 游标枚举全部 key（单页 1000 上限）
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await kv.list({ prefix, cursor });
      keys.push(...result.keys.map((k) => k.name));
      cursor = result.list_complete ? undefined : (result as any).cursor;
    } while (cursor);

    const items = (
      await Promise.all(
        keys.map((k) =>
          kv
            .get(k)
            .then((raw) => (raw ? (JSON.parse(raw) as ContentObject & { _key?: string }) : null))
            .catch(() => null),
        ),
      )
    )
      .filter((x): x is ContentObject => x !== null)
      .filter((x) => !status || x.status === status)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;

    return Response.json({
      items: items.slice(start, start + limit),
      pagination: { page, limit, total, totalPages },
    });
  } catch (e) {
    console.error('[content:GET] 查询失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ---- PUT：创建/更新 ----
export const onRequestPut: PagesFunction<Env> = async (context) =>
  withCors(await handlePut(context), context.request, context.env);

async function handlePut(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');
  if (!key) return Response.json({ error: '缺少 key 参数' }, { status: 400 });
  const parsedKey = parseKey(key);
  if (!parsedKey) return Response.json({ error: 'key 格式无效' }, { status: 400 });

  try {
    const kv = getKv(context.env);
    const body = (await context.request.json()) as Record<string, any>;

    const now = new Date().toISOString();
    const rawBefore = await kv.get(key);
    const before = rawBefore ? JSON.parse(rawBefore) : null;

    const content: ContentObject = {
      id: parsedKey.id,
      siteId: parsedKey.siteId,
      type: parsedKey.type,
      status: body.status || 'draft',
      title: String(body.title || '').trim(),
      slug: parsedKey.id,
      summary: body.summary ? String(body.summary) : '',
      body: typeof body.body === 'string' ? body.body : '',
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      createdAt: before?.createdAt || now,
      updatedAt: now,
      publishedAt: body.status === 'published' ? (before?.publishedAt || now) : (before?.publishedAt || null),
    };

    const err = validateContent(content, parsedKey);
    if (err) return Response.json({ error: err }, { status: 400 });

    const serialized = JSON.stringify(content);
    await kv.put(key, serialized);

    await appendAudit(kv, {
      op: before ? 'content.update' : 'content.create',
      target: key,
      summary: `${before ? '更新' : '创建'}「${content.title}」（${content.status}）`,
      before: before || undefined,
      after: content,
    });

    return Response.json({ success: true, content });
  } catch (e) {
    console.error('[content:PUT] 写入失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ---- POST：状态切换（publish / unpublish / archive） ----
export const onRequestPost: PagesFunction<Env> = async (context) =>
  withCors(await handlePost(context), context.request, context.env);

async function handlePost(context: PagesFunctionContext): Promise<Response> {
  const auth = await authenticateAdmin(context.request, context.env);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await context.request.json()) as { action?: string; key?: string };
    const { action, key } = body;
    if (!key || !parseKey(key)) return Response.json({ error: 'key 缺失或格式无效' }, { status: 400 });
    if (!action || !['publish', 'unpublish', 'archive'].includes(action)) {
      return Response.json({ error: 'action 只允许: publish, unpublish, archive' }, { status: 400 });
    }

    const kv = getKv(context.env);
    const raw = await kv.get(key);
    if (!raw) return Response.json({ error: '内容不存在' }, { status: 404 });
    const content = JSON.parse(raw) as ContentObject;
    const before = { ...content };
    const now = new Date().toISOString();

    if (action === 'publish') {
      if (!content.title || !content.body) {
        return Response.json({ error: '发布要求 title 与 body 非空' }, { status: 400 });
      }
      content.status = 'published';
      content.publishedAt = content.publishedAt || now;
    } else if (action === 'unpublish') {
      content.status = 'draft';
    } else {
      content.status = 'archived';
    }
    content.updatedAt = now;

    await kv.put(key, JSON.stringify(content));
    await appendAudit(kv, {
      op: `content.${action}`,
      target: key,
      summary: `${action === 'publish' ? '发布' : action === 'unpublish' ? '下线' : '归档'}「${content.title}」`,
      before,
      after: content,
    });

    return Response.json({ success: true, content });
  } catch (e) {
    console.error('[content:POST] 状态切换失败:', e);
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
  const key = url.searchParams.get('key');
  if (!key || !parseKey(key)) return Response.json({ error: 'key 缺失或格式无效' }, { status: 400 });

  try {
    const kv = getKv(context.env);
    const raw = await kv.get(key);
    const before = raw ? JSON.parse(raw) : null;

    await kv.delete(key);
    if (before) {
      await appendAudit(kv, {
        op: 'content.delete',
        target: key,
        summary: `删除「${before.title}」`,
        before,
      });
    }
    return Response.json({ success: true });
  } catch (e) {
    console.error('[content:DELETE] 删除失败:', e);
    return Response.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
