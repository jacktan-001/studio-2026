// ============================================================
// 轻量访问统计采集 /api/collect - 无需鉴权（beacon.js 调用）
// 隐私设计：不落 Cookie、不存明文 IP（仅哈希用于当日去重）、尊重 DNT。
// 聚合口径：按「北京时间日 × 已知路由」写 KV，/api/stats 供后台查看。
//   stats:day:{YYYY-MM-DD}  → { pv, paths: { route: count } }   TTL 400 天
//   stats:uv:{YYYY-MM-DD}   → [sha256(ip|date) 前 16 位…] 去重  TTL 45 天
//   rl:col:{ip}             → 每 IP 每小时限流计数              TTL 1 小时
// 已知路由之外的路径一律归并不记录（防 KV 键基数爆炸）。
// ============================================================

import { getKv, handlePreflight, withCors } from '../_lib/cors';

/** 只统计这些路由桶（子路径归并到所属站点） */
const KNOWN_ROUTES = ['/', '/jack-tan', '/jack-pose', '/jack-wave', '/jack-talk', '/jack-craft'];

/** 北京时间日期 YYYY-MM-DD */
function todayCST(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function bucket(pathname: string): string | null {
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  if (clean === '/') return '/';
  for (const k of KNOWN_ROUTES.slice(1)) {
    if (clean === k || clean.startsWith(k + '/')) return k;
  }
  return null;
}

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const done = new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

  try {
    // DNT 尊重：直接返回，不落任何数据
    if (context.request.headers.get('DNT') === '1') return done;

    let payload: { p?: unknown; r?: unknown };
    try {
      payload = await context.request.json();
    } catch {
      return done;
    }
    const path = typeof payload.p === 'string' ? payload.p.slice(0, 200) : '';
    const ref = typeof payload.r === 'string' ? payload.r.slice(0, 100) : '';
    // 路由桶以上报的页面路径为准（请求本身发往 /api/collect）
    const route = bucket(path);
    if (!route) return done;

    const kv = getKv(context.env);
    const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown';

    // 限流：每 IP 每小时最多 120 次采集（防刷量，也防自己误循环）
    const rlKey = 'rl:col:' + ip;
    const n = parseInt((await kv.get(rlKey)) || '0', 10);
    if (n >= 120) return done;
    await kv.put(rlKey, String(n + 1), { expirationTtl: 3600 });

    const date = todayCST();

    // 当日聚合：pv + 分路由计数
    const dayKey = 'stats:day:' + date;
    const day = JSON.parse((await kv.get(dayKey)) || '{"pv":0,"paths":{}}') as {
      pv: number;
      paths: Record<string, number>;
    };
    day.pv += 1;
    day.paths[route] = (day.paths[route] || 0) + 1;
    if (ref) {
      const refKey = 'ref:' + (ref.length > 60 ? ref.slice(0, 60) : ref);
      day.paths[refKey] = (day.paths[refKey] || 0) + 1;
    }
    await kv.put(dayKey, JSON.stringify(day), { expirationTtl: 400 * 86400 });

    // 当日 UV（近似）：IP 哈希去重，封顶 1 万条
    const uvKey = 'stats:uv:' + date;
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(ip + '|' + date),
    );
    const fp = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
    const uvs = JSON.parse((await kv.get(uvKey)) || '[]') as string[];
    if (!uvs.includes(fp) && uvs.length < 10000) {
      uvs.push(fp);
      await kv.put(uvKey, JSON.stringify(uvs), { expirationTtl: 45 * 86400 });
    }

    return done;
  } catch (e) {
    console.error('[collect] 采集失败:', e);
    // 任何失败都静默返回 204：统计永远不应影响页面
    return new Response(null, { status: 204 });
  }
};
