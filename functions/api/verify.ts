// ============================================================
// 管理登录校验 /api/verify - 仅用于后台登录态检查
// POST（带 x-admin-password 头），成功返回 { ok: true }
// 不返回任何数据，避免作为数据泄露通道
// ============================================================

import { authenticateAdmin } from '../_lib/adminAuth';
import { handlePreflight, withCors } from '../_lib/cors';

export const onRequestOptions: PagesFunction<Env> = (context) =>
  handlePreflight(context.request, context.env);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = await authenticateAdmin(context.request, context.env);
  const response = auth.authorized ? Response.json({ ok: true }) : auth.response;
  return withCors(response, context.request, context.env);
};
