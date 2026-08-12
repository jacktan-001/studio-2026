// ============================================================
// CORS 共享工具模块
// 为所有 API 端点提供统一的 CORS 头和 OPTIONS 预检处理
// 说明：Cloudflare Pages 文件路由会忽略以 _ 前缀的目录，
//       因此 _lib 不会被当作路由，仅作为可导入的共享模块。
// ============================================================

/**
 * CORS 允许的来源
 * 生产环境默认同源策略（null = 不下发 CORS 头，仅允许同源）
 * 如需跨域访问，可在环境变量中配置 ALLOWED_ORIGINS（逗号分隔）
 */
function getAllowedOrigin(request: Request, env?: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;

  if (env?.ALLOWED_ORIGINS) {
    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
    if (allowed.includes(origin) || allowed.includes('*')) return origin;
    return null;
  }

  // 默认：同域部署，前端与 API 同源，无需跨域头
  return null;
}

/** 构建 CORS 响应头 */
export function corsHeaders(request: Request, env?: Env): Record<string, string> {
  const origin = getAllowedOrigin(request, env);
  if (!origin) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** 处理 OPTIONS 预检请求：是预检则返回 204 + CORS 头，否则返回 null */
export function handlePreflight(request: Request, env?: Env): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env),
  });
}

/** 为已有 Response 附加 CORS 头 */
export function withCors(response: Response, request: Request, env?: Env): Response {
  const headers = corsHeaders(request, env);
  if (Object.keys(headers).length === 0) return response;

  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    next.headers.set(key, value);
  }
  return next;
}

/**
 * 统一获取主 KV：优先新绑定 STUDIO_KV，回退老绑定 JACK_WAVE_KV
 * 迁移期两个绑定可以并存，避免一次性切换造成数据不可读
 */
export function getKv(env: Env): KVNamespace {
  const kv = env.STUDIO_KV || env.JACK_WAVE_KV;
  if (!kv) throw new Error('KV 未绑定：请在 Pages 项目中绑定 STUDIO_KV');
  return kv;
}
