import { useMemo, useState } from "react";
import { Plus, Star, MessageCircle, AtSign, Link2, ThumbsUp, ThumbsDown, Grid3x3, List, Search } from "lucide-react";
import { useTrip } from "../store";
import { Card, SectionTitle, Badge, FAB, Modal, Field, Button, inputCls, EmptyState } from "../components/ui";
import { classNames, fmtDate } from "../lib/format";
import type { Guide, GuideType, Priority } from "../types";

const TYPES: (GuideType | "全部")[] = ["全部", "景点", "餐厅", "住宿", "购物", "交通", "注意事项", "其他"];
const TYPE_TONE: Record<GuideType, "brand" | "rose" | "violet" | "amber" | "blue" | "red" | "slate"> = {
  景点: "brand",
  餐厅: "rose",
  住宿: "violet",
  购物: "amber",
  交通: "blue",
  注意事项: "red",
  其他: "slate",
};
const PRIORITY_TONE: Record<Priority, "green" | "amber" | "slate"> = {
  必去: "green",
  可选: "amber",
  备选: "slate",
};

export default function Guide() {
  const { state, addGuide, updateGuide, deleteGuide, toggleStar, addGuideComment, canEdit } = useTrip();
  const [filter, setFilter] = useState<GuideType | "全部">("全部");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Guide | null>(null);
  const [active, setActive] = useState<Guide | null>(null);
  const [comment, setComment] = useState("");
  const [at, setAt] = useState<string>("");

  const memberOf = (id: string) => state.members.find((m) => m.id === id);
  const list = useMemo(
    () => (filter === "全部" ? state.guides : state.guides.filter((g) => g.type === filter)),
    [state.guides, filter]
  );
  const starred = state.guides.filter((g) => g.starred);

  const submitComment = (g: Guide) => {
    if (!comment.trim()) return;
    addGuideComment(g.id, comment.trim(), at || undefined);
    setComment("");
    setAt("");
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle title="攻略收藏" subtitle={`${state.guides.length} 条 · 必去清单 ${starred.length}`} />
        <button
          onClick={() => setView(view === "grid" ? "list" : "grid")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
        >
          {view === "grid" ? <List size={17} /> : <Grid3x3 size={17} />}
        </button>
      </div>

      {starred.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scroll-thin">
          <Badge tone="green">⭐ 必去清单</Badge>
          {starred.map((g) => (
            <button
              key={g.id}
              onClick={() => setActive(g)}
              className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scroll-thin">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={classNames(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
              filter === t ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Search />} text="还没有攻略，点右下角收藏第一条" />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3">
          {list.map((g) => (
            <button key={g.id} onClick={() => setActive(g)} className="text-left">
              <Card className="h-full !p-3 active:scale-[0.98]">
                <div className="mb-2 flex items-center justify-between">
                  <Badge tone={TYPE_TONE[g.type]}>{g.type}</Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(g.id);
                    }}
                    className={classNames(g.starred ? "text-amber-400" : "text-slate-300")}
                  >
                    <Star size={16} fill={g.starred ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="line-clamp-2 font-semibold text-slate-900 dark:text-white">{g.title}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                  {"★".repeat(g.rating)}
                  <span className="text-slate-300">{"★".repeat(5 - g.rating)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Badge tone={PRIORITY_TONE[g.priority]}>{g.priority}</Badge>
                  {g.recommended === "不推荐" && <Badge tone="red">不推荐</Badge>}
                </div>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((g) => (
            <Card key={g.id} className="!p-3" onClick={() => setActive(g)}>
              <div className="flex items-center gap-2">
                <Badge tone={TYPE_TONE[g.type]}>{g.type}</Badge>
                <span className="font-semibold text-slate-900 dark:text-white">{g.title}</span>
                <span className="ml-auto text-xs text-amber-500">{"★".repeat(g.rating)}</span>
              </div>
              {g.reason && <p className="mt-1 text-xs text-slate-500">{g.reason}</p>}
            </Card>
          ))}
        </div>
      )}

      <FAB onClick={() => { setEditing(null); setOpen(true); }} icon={<Plus size={24} />} label="收藏攻略" />

      {/* Detail / comments */}
      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title}>
        {active && (
          <div className="animate-pop">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge tone={TYPE_TONE[active.type]}>{active.type}</Badge>
              <Badge tone={PRIORITY_TONE[active.priority]}>{active.priority}</Badge>
              <Badge tone={active.recommended === "推荐" ? "green" : "red"}>{active.recommended}</Badge>
              <Badge tone="amber">{"★".repeat(active.rating) || "未评"}</Badge>
            </div>
            {active.sourceUrl && (
              <a href={active.sourceUrl} target="_blank" rel="noreferrer" className="mb-2 flex items-center gap-1 text-sm text-brand-600">
                <Link2 size={14} /> 来源链接
              </a>
            )}
            {active.reason && <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">💡 {active.reason}</p>}
            {active.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {active.tags.map((t) => (
                  <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-white/10">#{t}</span>
                ))}
              </div>
            )}
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">讨论区 ({active.comments.length})</span>
              {canEdit(active.collectedBy) && (
                <button onClick={() => { if (confirm("删除该攻略？")) { deleteGuide(active.id); setActive(null); } }} className="text-xs text-rose-500">
                  删除
                </button>
              )}
            </div>
            <div className="mb-3 space-y-2">
              {active.comments.map((c) => {
                const m = memberOf(c.memberId);
                return (
                  <div key={c.id} className="rounded-xl bg-slate-50 p-2 text-sm dark:bg-white/5">
                    <span className="font-medium text-brand-600">{m?.name}</span>
                    {c.at && <span className="text-sky-500"> @{memberOf(c.at)?.name}</span>}: {c.text}
                  </div>
                );
              })}
              {active.comments.length === 0 && <p className="text-xs text-slate-400">还没有讨论，来抢沙发～</p>}
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs dark:border-white/10 dark:bg-slate-900/60"
                value={at}
                onChange={(e) => setAt(e.target.value)}
              >
                <option value="">@ 某人</option>
                {state.members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input
                className={inputCls}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="说点什么…"
                onKeyDown={(e) => e.key === "Enter" && submitComment(active)}
              />
              <Button onClick={() => submitComment(active)}><MessageCircle size={14} /></Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "编辑攻略" : "收藏攻略"}>
        <GuideForm
          editing={editing}
          onSubmit={(data) => {
            if (editing) updateGuide(editing.id, data);
            else addGuide(data);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

function GuideForm({
  editing,
  onSubmit,
  onClose,
}: {
  editing: Guide | null;
  onSubmit: (data: Omit<Guide, "id" | "collectedAt" | "comments">) => void;
  onClose: () => void;
}) {
  const { state } = useTrip();
  const [form, setForm] = useState({
    title: editing?.title || "",
    type: (editing?.type || "景点") as GuideType,
    sourceUrl: editing?.sourceUrl || "",
    reason: editing?.reason || "",
    rating: editing?.rating ?? 5,
    recommended: (editing?.recommended || "推荐") as "推荐" | "不推荐",
    priority: (editing?.priority || "可选") as Priority,
    note: editing?.note || "",
    tags: editing?.tags.join(", ") || "",
    starred: editing?.starred || false,
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) return alert("请填写标题");
        onSubmit({
          title: form.title.trim(),
          type: form.type,
          sourceUrl: form.sourceUrl || undefined,
          reason: form.reason || undefined,
          rating: form.rating,
          recommended: form.recommended,
          priority: form.priority,
          note: form.note || undefined,
          tags: form.tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
          starred: form.starred,
          collectedBy: editing?.collectedBy || state.members[0].id,
        });
      }}
    >
      <Field label="标题">
        <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="如：大阪城天守阁" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="类型">
          <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {(["景点", "餐厅", "住宿", "购物", "交通", "注意事项", "其他"] as GuideType[]).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="优先级">
          <select className={inputCls} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {(["必去", "可选", "备选"] as Priority[]).map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="来源链接（自动抓取标题/封面）" hint="粘贴网页链接，团队成员可一键跳转">
        <input className={inputCls} value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} placeholder="https://..." />
      </Field>
      <Field label="推荐理由">
        <textarea className={inputCls} rows={2} value={form.reason} onChange={(e) => set("reason", e.target.value)} />
      </Field>
      <Field label={`评分：${"★".repeat(form.rating)}${"☆".repeat(5 - form.rating)}`}>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => set("rating", n)} className={classNames("text-2xl", n <= form.rating ? "text-amber-400" : "text-slate-300")}>
              ★
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="是否推荐">
          <select className={inputCls} value={form.recommended} onChange={(e) => set("recommended", e.target.value)}>
            <option>推荐</option>
            <option>不推荐</option>
          </select>
        </Field>
        <Field label="加入必去清单">
          <select className={inputCls} value={form.starred ? "是" : "否"} onChange={(e) => set("starred", e.target.value === "是")}>
            <option value="是">是</option>
            <option value="否">否</option>
          </select>
        </Field>
      </div>
      <Field label="标签（逗号分隔）">
        <input className={inputCls} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="美食, 拍照" />
      </Field>
      <div className="mt-2 flex gap-2">
        <Button type="submit" className="flex-1">{editing ? "保存" : "收藏"}</Button>
        <Button variant="ghost" onClick={onClose}>取消</Button>
      </div>
    </form>
  );
}
