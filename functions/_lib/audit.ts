// ============================================================
// 审计日志工具（内容中枢 P0-4）
// Key: audit:<yyyy-MM> → JSON 数组，append 式更新
// 约束：单月数组上限 500 条（超限丢弃最旧）；before/after 快照各 ≤2KB
// 原则：审计写入失败永不阻塞主操作（降级 console.error）
// ============================================================

const AUDIT_MAX_PER_MONTH = 500;
const SNAPSHOT_MAX_BYTES = 2048;

export interface AuditEntry {
  at: string;
  op: string;
  actor: string;
  target: string;
  summary: string;
  before?: unknown;
  after?: unknown;
}

function monthKey(date = new Date()): string {
  // 北京时间月份，与统计口径一致
  const cst = new Date(date.getTime() + 8 * 3600 * 1000);
  return 'audit:' + cst.toISOString().slice(0, 7);
}

/** 截断快照到 ≤2KB（JSON 序列化后超长则丢弃） */
function clipSnapshot(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  try {
    const s = JSON.stringify(value);
    if (s.length <= SNAPSHOT_MAX_BYTES) return value;
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * 追加一条审计记录。fire-and-forget：调用方无需 await 其成功与否，
 * 任何异常只记日志，不影响主写入。
 */
export async function appendAudit(
  kv: KVNamespace,
  entry: Omit<AuditEntry, 'at' | 'actor'> & { actor?: string },
): Promise<void> {
  try {
    const key = monthKey();
    const raw = await kv.get(key);
    const list: AuditEntry[] = raw ? JSON.parse(raw) : [];

    list.push({
      at: new Date().toISOString(),
      op: entry.op,
      actor: entry.actor || 'owner',
      target: entry.target,
      summary: entry.summary.slice(0, 200),
      before: clipSnapshot(entry.before),
      after: clipSnapshot(entry.after),
    });

    while (list.length > AUDIT_MAX_PER_MONTH) list.shift();

    // 保留 ~1 年：13 个月 TTL 兜底跨年
    await kv.put(key, JSON.stringify(list), { expirationTtl: 400 * 86400 });
  } catch (e) {
    console.error('[audit] 写入失败（已降级，不影响主操作）:', e);
  }
}

/** 读取指定月份审计记录（倒序） */
export async function readAudit(
  kv: KVNamespace,
  month?: string,
): Promise<{ month: string; entries: AuditEntry[] }> {
  const ym = month && /^\d{4}-\d{2}$/.test(month) ? month : monthKey().slice(6);
  const raw = await kv.get('audit:' + ym);
  const entries: AuditEntry[] = raw ? JSON.parse(raw) : [];
  entries.sort((a, b) => (a.at < b.at ? 1 : -1));
  return { month: ym, entries };
}
