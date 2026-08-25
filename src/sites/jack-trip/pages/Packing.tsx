import { useMemo, useState } from "react";
import { Plus, Trash2, Check, PackageCheck, Package, Pencil } from "lucide-react";
import { useTrip } from "../store";
import { Card, SectionTitle, Badge, FAB, Modal, Field, Button, inputCls, ProgressBar, EmptyState, Avatar } from "../components/ui";
import { classNames } from "../lib/format";
import type { PackingCategory, PackingItem, PackingStatus } from "../types";

const CATS: PackingCategory[] = ["证件", "电子产品", "衣物", "洗护", "药品", "其他"];
const STATUS_NEXT: Record<PackingStatus, PackingStatus> = {
  未准备: "已准备",
  已准备: "已携带",
  已携带: "未准备",
};
const STATUS_TONE: Record<PackingStatus, "slate" | "amber" | "green"> = {
  未准备: "slate",
  已准备: "amber",
  已携带: "green",
};

export default function Packing() {
  const { state, addPacking, updatePacking, deletePacking, canEdit, currentUserId } = useTrip();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const memberOf = (id?: string) => state.members.find((m) => m.id === id);
  const grouped = useMemo(() => {
    const g: Record<string, PackingItem[]> = {};
    CATS.forEach((c) => (g[c] = []));
    state.packing.forEach((p) => (g[p.category] || (g[p.category] = [])).push(p));
    return g;
  }, [state.packing]);

  const total = state.packing.length;
  const done = state.packing.filter((p) => p.status !== "未准备").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <SectionTitle title="出行清单" subtitle="共享打包清单 · 认领与勾选" />
      <Card className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">准备进度</span>
          <span className="text-slate-500">{done}/{total} · {pct}%</span>
        </div>
        <ProgressBar value={pct} />
      </Card>

      {total === 0 ? (
        <EmptyState icon={<Package />} text="清单还是空的，点右下角添加" />
      ) : (
        <div className="space-y-4">
          {CATS.map((cat) => {
            const items = grouped[cat] || [];
            if (items.length === 0) return null;
            const catDone = items.filter((i) => i.status !== "未准备").length;
            const isCollapsed = collapsed[cat];
            return (
              <div key={cat}>
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
                  className="mb-2 flex w-full items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{cat}</span>
                    <Badge tone="slate">{catDone}/{items.length}</Badge>
                  </div>
                  <span className="text-xs text-slate-400">{isCollapsed ? "展开" : "折叠"}</span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-2">
                    {items.map((it) => {
                      const owner = memberOf(it.owner);
                      const editable = canEdit(it.createdBy);
                      return (
                        <Card key={it.id} className="flex items-center gap-3 !p-3">
                          <button
                            onClick={() => updatePacking(it.id, { status: STATUS_NEXT[it.status] })}
                            className={classNames(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition",
                              it.status === "已携带"
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : it.status === "已准备"
                                ? "border-amber-400 bg-amber-400 text-white"
                                : "border-slate-300 dark:border-white/20"
                            )}
                            title="点击切换状态"
                          >
                            {it.status === "未准备" ? "" : <Check size={15} />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className={classNames("font-medium text-slate-900 dark:text-white", it.status === "已携带" && "line-through opacity-60")}>
                              {it.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              {owner && (
                                <span className="flex items-center gap-1">
                                  <Avatar member={owner} size={18} /> {owner.name}
                                </span>
                              )}
                              {it.note && <span>· {it.note}</span>}
                            </div>
                          </div>
                          <Badge tone={STATUS_TONE[it.status]}>{it.status}</Badge>
                          {editable && (
                            <button onClick={() => { if (confirm(`删除「${it.name}」？`)) deletePacking(it.id); }} className="text-slate-400 hover:text-rose-500">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <FAB onClick={() => setOpen(true)} icon={<Plus size={24} />} label="添加物品" />

      <Modal open={open} onClose={() => setOpen(false)} title="添加清单物品">
        <AddForm
          onSubmit={(data) => {
            addPacking({ ...data, createdBy: currentUserId });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

function AddForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: Omit<PackingItem, "id" | "createdBy">) => void;
  onClose: () => void;
}) {
  const { state } = useTrip();
  const [form, setForm] = useState({
    name: "",
    category: "证件" as PackingCategory,
    owner: state.members[0].id,
    status: "未准备" as PackingStatus,
    note: "",
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return alert("请填写物品名称");
        onSubmit({ name: form.name.trim(), category: form.category, owner: form.owner, status: form.status, note: form.note || undefined });
      }}
    >
      <Field label="物品名称">
        <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="如：护照 / 充电宝" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="分类">
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="认领人">
          <select className={inputCls} value={form.owner} onChange={(e) => set("owner", e.target.value)}>
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="状态">
        <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
          {(["未准备", "已准备", "已携带"] as PackingStatus[]).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="备注">
        <input className={inputCls} value={form.note} onChange={(e) => set("note", e.target.value)} />
      </Field>
      <div className="mt-2 flex gap-2">
        <Button type="submit" className="flex-1">添加</Button>
        <Button variant="ghost" onClick={onClose}>取消</Button>
      </div>
    </form>
  );
}
