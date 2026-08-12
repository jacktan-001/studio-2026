// ============================================================
// 投稿接口 /api/submit - 公开，带 IP 限流和输入校验
// ============================================================

import { getKv, handlePreflight, withCors } from '../_lib/cors';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

/** 允许的投稿类型白名单 */
const ALLOWED_TYPES = ['link', 'manual', 'screenshot'] as const;

/** 字段长度限制 */
const LIMITS = {
  playlistName: 100,
  authorName: 50,
  description: 500,
  songList: 2000,
  linkUrl: 2048,
  tagCount: 5,
  tagLength: 20,
} as const;

/** 速率限制：每个 IP 每小时最多 5 次 */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 3600;

function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

/** 检查并更新速率限制计数 */
async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${ip}`;
  const now = Date.now();

  try {
    const raw = await kv.get(key);
    if (raw) {
      const data = JSON.parse(raw) as { count: number; windowStart: number };
      const elapsed = (now - data.windowStart) / 1000;

      if (elapsed < RATE_LIMIT_WINDOW) {
        if (data.count >= RATE_LIMIT_MAX) return { allowed: false, remaining: 0 };
        const newCount = data.count + 1;
        await kv.put(key, JSON.stringify({ count: newCount, windowStart: data.windowStart }), {
          expirationTtl: Math.ceil(RATE_LIMIT_WINDOW - elapsed),
        });
        return { allowed: true, remaining: RATE_LIMIT_MAX - newCount };
      }
    }

    await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), {
      expirationTtl: RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  } catch {
    // KV 异常时不阻断投稿（容错）
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
}

/** 只允许 http / https 协议 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) =>
  withCors(await handleSubmit(context), context.request, context.env);

async function handleSubmit(context: PagesFunctionContext): Promise<Response> {
  try {
    const kv = getKv(context.env);
    const rateLimitKv = context.env.SUBMISSION_RATE_LIMIT || kv;

    // 1. IP 限流
    const ip = getClientIP(context.request);
    const rateLimit = await checkRateLimit(rateLimitKv, ip);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: '投稿过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(RATE_LIMIT_WINDOW) } },
      );
    }

    // 2. 解析请求体
    const body = (await context.request.json()) as Record<string, any>;
    const { type, linkUrl, songList, playlistName, authorName, description, tags } = body;

    // 3. 必填校验
    if (!playlistName || !authorName) {
      return Response.json({ error: '歌单名称和署名为必填项' }, { status: 400 });
    }

    // 4. type 白名单
    const submissionType = type || 'link';
    if (!ALLOWED_TYPES.includes(submissionType)) {
      return Response.json(
        { error: `无效的投稿类型，只允许: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // 5. 长度校验
    const strPlaylistName = String(playlistName);
    const strAuthorName = String(authorName);
    const strDescription = description ? String(description) : '';
    const strSongList = songList ? String(songList) : '';
    const strLinkUrl = linkUrl ? String(linkUrl) : '';

    if (strPlaylistName.length > LIMITS.playlistName) {
      return Response.json({ error: `歌单名称不能超过 ${LIMITS.playlistName} 字` }, { status: 400 });
    }
    if (strAuthorName.length > LIMITS.authorName) {
      return Response.json({ error: `署名不能超过 ${LIMITS.authorName} 字` }, { status: 400 });
    }
    if (strDescription.length > LIMITS.description) {
      return Response.json({ error: `描述不能超过 ${LIMITS.description} 字` }, { status: 400 });
    }
    if (strSongList.length > LIMITS.songList) {
      return Response.json({ error: `歌单内容不能超过 ${LIMITS.songList} 字` }, { status: 400 });
    }
    if (strLinkUrl.length > LIMITS.linkUrl) {
      return Response.json({ error: `链接不能超过 ${LIMITS.linkUrl} 字` }, { status: 400 });
    }

    // 6. URL 协议白名单
    if (strLinkUrl && !isValidUrl(strLinkUrl)) {
      return Response.json({ error: '链接格式无效，只支持 http/https' }, { status: 400 });
    }

    // 7. tags 校验
    const processedTags: string[] = [];
    if (Array.isArray(tags)) {
      if (tags.length > LIMITS.tagCount) {
        return Response.json({ error: `标签数量不能超过 ${LIMITS.tagCount} 个` }, { status: 400 });
      }
      for (const tag of tags) {
        const strTag = String(tag);
        if (strTag.length > LIMITS.tagLength) {
          return Response.json(
            { error: `每个标签不能超过 ${LIMITS.tagLength} 字` },
            { status: 400 },
          );
        }
        processedTags.push(strTag);
      }
    }

    // 8. 构建并存储记录
    // 用独立 key 存储每条投稿，避免 read-modify-write 竞态；
    // 列表读取通过 kv.list({ prefix: 'submission:' }) 枚举，无需索引 key
    const submission = {
      id: crypto.randomUUID(),
      type: submissionType,
      linkUrl: strLinkUrl,
      songList: strSongList,
      playlistName: strPlaylistName,
      authorName: strAuthorName,
      description: strDescription,
      tags: processedTags,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await kv.put(`submission:${submission.id}`, JSON.stringify(submission));

    return Response.json({ success: true, id: submission.id, remaining: rateLimit.remaining });
  } catch (e) {
    console.error('[submit] 投稿处理失败:', e);
    return Response.json({ error: '投稿失败，请稍后重试' }, { status: 500 });
  }
}
