// ============================================================
// Cloudflare Pages Functions 环境类型
// studio-2026 后端（KV + Functions）
// ============================================================

/// <reference types="@cloudflare/workers-types" />

interface Env {
  /** 主数据存储（歌单 / 投稿 / 站点内容） */
  STUDIO_KV: KVNamespace;
  /** 兼容老系统命名，迁移期可同时绑定 */
  JACK_WAVE_KV?: KVNamespace;
  /** 管理密码（通过 wrangler pages secret put 设置） */
  ADMIN_PASSWORD: string;
  /** 可选：独立的管理限流 KV，不配置则回退主 KV */
  ADMIN_RATE_LIMIT?: KVNamespace;
  /** 可选：独立的投稿限流 KV，不配置则回退主 KV */
  SUBMISSION_RATE_LIMIT?: KVNamespace;
  /** 可选：允许跨域的来源，逗号分隔；不配置则仅同源 */
  ALLOWED_ORIGINS?: string;
}

type PagesFunctionContext<E = Env> = EventContext<E, string, Record<string, unknown>>;
