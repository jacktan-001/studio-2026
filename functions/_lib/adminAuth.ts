// ============================================================
// 管理接口认证与限流 - 共享工具模块
// 供 data.ts / submissions.ts / verify.ts 等管理接口复用
// ============================================================

import { getKv } from './cors';

/** 管理接口速率限制：每个 IP 在窗口期内最多认证失败次数 */
const ADMIN_RATE_LIMIT_MAX = 20;
/** 速率限制窗口期（秒），10 分钟 */
export const ADMIN_RATE_LIMIT_WINDOW = 600;

/** 获取客户端真实 IP（Cloudflare 通过 CF-Connecting-IP 注入） */
function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

/**
 * 恒定时间密码比较，防止时序攻击
 * 先各自 SHA-256（统一长度，避免长度泄露），再逐字节异或累积差异
 */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const arrA = new Uint8Array(hashA);
  const arrB = new Uint8Array(hashB);
  if (arrA.length !== arrB.length) return false;

  let result = 0;
  for (let i = 0; i < arrA.length; i++) result |= arrA[i] ^ arrB[i];
  return result === 0;
}

/** 检查该 IP 的认证失败次数是否已达上限（暴力破解防护） */
async function checkAdminRateLimit(kv: KVNamespace | undefined, ip: string): Promise<boolean> {
  if (!kv) return true;

  const key = `admin-ratelimit:${ip}`;
  try {
    const raw = await kv.get(key);
    if (raw) {
      const data = JSON.parse(raw) as { count: number; windowStart: number };
      const elapsed = (Date.now() - data.windowStart) / 1000;
      if (elapsed < ADMIN_RATE_LIMIT_WINDOW) return data.count < ADMIN_RATE_LIMIT_MAX;
    }
    return true;
  } catch {
    // KV 异常时不阻断请求（容错）
    return true;
  }
}

/** 记录一次认证失败（窗口期内累加，过期则重置） */
async function recordAdminAuthFailure(kv: KVNamespace | undefined, ip: string): Promise<void> {
  if (!kv) return;

  const key = `admin-ratelimit:${ip}`;
  const now = Date.now();
  try {
    const raw = await kv.get(key);
    if (raw) {
      const data = JSON.parse(raw) as { count: number; windowStart: number };
      const elapsed = (now - data.windowStart) / 1000;
      if (elapsed < ADMIN_RATE_LIMIT_WINDOW) {
        await kv.put(
          key,
          JSON.stringify({ count: data.count + 1, windowStart: data.windowStart }),
          { expirationTtl: Math.ceil(ADMIN_RATE_LIMIT_WINDOW - elapsed) },
        );
        return;
      }
    }
    await kv.put(key, JSON.stringify({ count: 1, windowStart: now }), {
      expirationTtl: ADMIN_RATE_LIMIT_WINDOW,
    });
  } catch {
    // 静默失败，不阻断主流程
  }
}

/** 认证成功后清除该 IP 的失败计数 */
async function resetAdminRateLimit(kv: KVNamespace | undefined, ip: string): Promise<void> {
  if (!kv) return;
  try {
    await kv.delete(`admin-ratelimit:${ip}`);
  } catch {
    // 静默失败
  }
}

type AuthResult = { authorized: true } | { authorized: false; response: Response };

/**
 * 管理接口统一认证：时序安全密码校验 + 暴力破解限流
 * 1. 检查 IP 是否已达失败上限（10 分钟 20 次），达上限返回 429
 * 2. 仅从请求头 x-admin-password 读取密码（不支持 URL 参数，避免日志泄露）
 * 3. timingSafeEqual 恒定时间比较
 * 4. 失败累加计数，成功清除计数
 */
export async function authenticateAdmin(request: Request, env: Env): Promise<AuthResult> {
  const ip = getClientIP(request);

  let rateLimitKv: KVNamespace | undefined;
  try {
    rateLimitKv = env.ADMIN_RATE_LIMIT || getKv(env);
  } catch {
    rateLimitKv = undefined;
  }

  // 服务端未配置密码时，直接拒绝所有管理请求（避免空密码绕过）
  if (!env.ADMIN_PASSWORD) {
    return {
      authorized: false,
      response: Response.json({ error: '服务端未配置管理密码' }, { status: 503 }),
    };
  }

  const allowed = await checkAdminRateLimit(rateLimitKv, ip);
  if (!allowed) {
    return {
      authorized: false,
      response: Response.json(
        { error: '认证失败次数过多，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(ADMIN_RATE_LIMIT_WINDOW) } },
      ),
    };
  }

  const password = request.headers.get('x-admin-password');
  if (!password) {
    await recordAdminAuthFailure(rateLimitKv, ip);
    return { authorized: false, response: Response.json({ error: '未授权' }, { status: 401 }) };
  }

  const valid = await timingSafeEqual(password, env.ADMIN_PASSWORD);
  if (!valid) {
    await recordAdminAuthFailure(rateLimitKv, ip);
    return { authorized: false, response: Response.json({ error: '未授权' }, { status: 401 }) };
  }

  await resetAdminRateLimit(rateLimitKv, ip);
  return { authorized: true };
}
