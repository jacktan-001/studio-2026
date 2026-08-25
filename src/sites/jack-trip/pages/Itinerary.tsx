import { useMemo, useState } from "react";
import {
  Plane,
  BedDouble,
  Camera,
  Utensils,
  ShoppingBag,
  Sparkles,
  Circle,
  Plus,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  GripVertical,
  CalendarDays,
  ListTree,
  Copy,
} from "lucide-react";
import { useTrip } from "../store";
import { Card, SectionTitle, Badge, FAB, Modal, Field, Button, inputCls, EmptyState } from "../components/ui";
import { classNames, fmtDateFull, todayISO, uid } from "../lib/format";
import type { ItineraryItem, TripStatus, TripType } from "../types";

const TYPE_ICON: Record<TripType, any> = {
  交通: Plane,
  住宿: BedDouble,
  景点: Camera,
  餐饮: Utensils,
  购物: ShoppingBag,
  自由: Sparkles,
  其他: Circle,
};
const TYPE_COLOR: Record<TripType, string> = {
  交通: "text-sky-500 bg-sky-50 dark:bg-sky-500/15",
  住宿: "text-violet-500 bg-violet-50 dark:bg-violet-500/15",
  景点: "text-brand-500 bg-brand-50 dark:bg-brand-500/15",
  餐饮: "text-rose-500 bg-rose-50 dark:bg-rose-500/15",
  购物: "text-amber-500 bg-amber-50 dark:bg-amber-500/15",
  自由: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/15",
  其他: "text-slate-500 bg-slate-100 dark:bg-white/10",
};
const STATUS_NEXT: Record<TripStatus, TripStatus> = {
  未开始: "进行中",
  进行中: "已完成",
  已完成: "未开始",
};
const STATUS_TONE: Record<TripStatus, "slate" | "amber" | "green"> = {
  未开始: "slate",
  进行中: "amber",
  已完成: "green",
};

export default function Itinerary() {
  const { state, addItinerary, updateItinerary, deleteItinerary, reorderItinerary, canEdit } = useTrip();
  const [view, setView] = useState<"timeline" | "calendar">("timeline");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ItineraryItem | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, ItineraryItem[]>();
    for (const it of state.itinerary) {
      if (filterDate && it.date !== filterDate) continue;
      if (!map.has(it.date)) map.set(it.date, []);
      map.get(it.date)!.push(it);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [state.itinerary, filterDate]);

  const memberOf = (id?: string) => state.members.find((m) => m.id === id);

  // template reuse: copy a day's items to another date
  const reuseDay = (fromDate: string) => {
    const items = state.itinerary.filter((i) => i.date === fromDate);
    const target = prompt(`将 ${fromDate} 的 ${items.length} 个节点复制为模板，输入目标日期 (YYYY-MM-DD)：`);
    if (!target) return;
    items.forEach((it) => {
      const { id, createdAt, updatedAt, order, ...rest } = it;
      addItinerary({ ...rest, date: target, status: "未开始" });
    });
  };

  const onDrop = (date: string) => {
    if (!dragId || !overId || dragId === overId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const dayItems = state.itinerary
      .filter((i) => i.date === date)
      .sort((a, b) => a.order - b.order);
    const from = dayItems.findIndex((i) => i.id === dragId);
    const to = dayItems.findIndex((i) => i.id === overId);
    if (from < 0 || to < 0) return;
    const arr = [...dayItems];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    reorderItinerary(date, arr.map((i) => i.id));
    setDragId(null);
    setOverId(null);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle title="行程管理" subtitle="按天管理交通 / 住宿 / 景点 / 餐饮" />
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-white/10">
          <button
            onClick={() => setView("timeline")}
            className={classNames(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              view === "timeline" ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"
            )}
          >
            <ListTree size={14} /> 时间线
          </button>
          <button
            onClick={() => setView("calendar")}
            className={classNames(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              view === "calendar" ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"
            )}
          >
            <CalendarDays size={14} /> 日历
          </button>
        </div>
      </div>

      {filterDate && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <Badge tone="brand">已筛选：{filterDate}</Badge>
          <button onClick={() => setFilterDate(null)} className="text-brand-600">
            清除
          </button>
        </div>
      )}

      {view === "timeline" ? (
        grouped.length === 0 ? (
          <EmptyState icon={<MapPin />} text="还没有行程，点右下角添加第一个节点" />
        ) : (
          <div className="space-y-5">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-brand-500" />
                    <span className="font-bold text-slate-900 dark:text-white">{fmtDateFull(date)}</span>
                    <Badge tone="slate">{items.length} 项</Badge>
                  </div>
                  <button
                    onClick={() => reuseDay(date)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-600"
                  >
                    <Copy size={12} /> 复用为模板
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((it) => {
                    const Icon = TYPE_ICON[it.type];
                    const owner = memberOf(it.payer);
                    const editable = canEdit(it.createdBy);
                    return (
                      <div
                        key={it.id}
                        draggable={editable}
                        onDragStart={() => setDragId(it.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setOverId(it.id);
                        }}
                        onDrop={() => onDrop(date)}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverId(null);
                        }}
                        className={classNames(
                          "rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-800/60",
                          overId === it.id && "ring-2 ring-brand-300",
                          it.status === "已完成" && "opacity-70"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {editable && <GripVertical size={16} className="shrink-0 cursor-grab text-slate-300" />}
                          <div className={classNames("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", TYPE_COLOR[it.type])}>
                            <Icon size={17} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-slate-900 dark:text-white">{it.title}</span>
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                              {it.startTime && (
                                <span className="flex items-center gap-0.5">
                                  <Clock size={11} /> {it.startTime}
                                  {it.endTime ? `–${it.endTime}` : ""}
                                </span>
                              )}
                              {it.locationName && (
                                <span className="flex items-center gap-0.5">
                                  <MapPin size={11} /> {it.locationName}
                                </span>
                              )}
                              {owner && <span>付款：{owner.name}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <button
                              onClick={() => updateItinerary(it.id, { status: STATUS_NEXT[it.status] })}
                              className="shrink-0"
                            >
                              <Badge tone={STATUS_TONE[it.status]}>{it.status}</Badge>
                            </button>
                            {editable && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditing(it);
                                    setOpen(true);
                                  }}
                                  className="text-slate-400 hover:text-brand-600"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`删除「${it.title}」？`)) deleteItinerary(it.id);
                                  }}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {it.note && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">📝 {it.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <CalendarView
          items={state.itinerary}
          onPick={(d) => {
            setFilterDate(d);
            setView("timeline");
          }}
        />
      )}

      <FAB onClick={() => { setEditing(null); setOpen(true); }} icon={<Plus size={24} />} label="添加行程" />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "编辑行程节点" : "添加行程节点"}>
        <ItineraryForm
          editing={editing}
          defaultDate={filterDate || todayISO()}
          onClose={() => setOpen(false)}
          onSubmit={(data) => {
            if (editing) updateItinerary(editing.id, data);
            else addItinerary(data);
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

// ---------------- Calendar ----------------
function CalendarView({
  items,
  onPick,
}: {
  items: ItineraryItem[];
  onPick: (date: string) => void;
}) {
  const dates = items.map((i) => i.date).sort();
  const start = dates[0] ? new Date(dates[0]) : new Date();
  const year = start.getFullYear();
  const month = start.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const countByDate = new Map<string, number>();
  items.forEach((i) => countByDate.set(i.date, (countByDate.get(i.date) || 0) + 1));
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <Card>
      <div className="mb-2 text-center font-bold text-slate-900 dark:text-white">
        {year} 年 {month + 1} 月
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
        {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const c = countByDate.get(iso) || 0;
          return (
            <button
              key={idx}
              onClick={() => c > 0 && onPick(iso)}
              className={classNames(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm",
                c > 0
                  ? "bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                  : "text-slate-400"
              )}
            >
              {d}
              {c > 0 && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-500" />}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">橙色日期有行程，点击查看当天安排</p>
    </Card>
  );
}

// ---------------- Form ----------------
const TYPES: TripType[] = ["交通", "住宿", "景点", "餐饮", "购物", "自由", "其他"];
const STATUSES: TripStatus[] = ["未开始", "进行中", "已完成"];

function ItineraryForm({
  editing,
  defaultDate,
  onSubmit,
  onClose,
}: {
  editing: ItineraryItem | null;
  defaultDate: string;
  onSubmit: (data: Omit<ItineraryItem, "id" | "createdAt" | "updatedAt" | "order">) => void;
  onClose: () => void;
}) {
  const { state } = useTrip();
  const [form, setForm] = useState({
    date: editing?.date || defaultDate,
    startTime: editing?.startTime || "",
    endTime: editing?.endTime || "",
    title: editing?.title || "",
    type: (editing?.type || "景点") as TripType,
    locationName: editing?.locationName || "",
    address: editing?.address || "",
    transport: editing?.transport || "",
    flightNo: editing?.flightNo || "",
    bookingRef: editing?.bookingRef || "",
    amount: editing?.amount?.toString() || "",
    payer: editing?.payer || state.members[0].id,
    costBelong: (editing?.costBelong || "公摊") as "公摊" | "个人",
    note: editing?.note || "",
    status: (editing?.status || "未开始") as TripStatus,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) return alert("请填写环节标题");
        onSubmit({
          date: form.date,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
          title: form.title.trim(),
          type: form.type,
          locationName: form.locationName || undefined,
          address: form.address || undefined,
          transport: form.transport || undefined,
          flightNo: form.flightNo || undefined,
          bookingRef: form.bookingRef || undefined,
          amount: form.amount ? Number(form.amount) : undefined,
          payer: form.payer,
          costBelong: form.costBelong,
          note: form.note || undefined,
          status: form.status,
          createdBy: editing?.createdBy || state.members[0].id,
        });
      }}
    >
      <Field label="环节标题">
        <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="如：大阪城公园" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="日期">
          <input type="date" className={inputCls} value={form.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="类型">
          <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="开始时间">
          <input type="time" className={inputCls} value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
        </Field>
        <Field label="结束时间">
          <input type="time" className={inputCls} value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
        </Field>
      </div>
      <Field label="地点名称">
        <input className={inputCls} value={form.locationName} onChange={(e) => set("locationName", e.target.value)} placeholder="如：道顿堀" />
      </Field>
      <Field label="详细地址">
        <input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="交通工具">
          <input className={inputCls} value={form.transport} onChange={(e) => set("transport", e.target.value)} placeholder="飞机/高铁/打车" />
        </Field>
        <Field label="车牌/航班号">
          <input className={inputCls} value={form.flightNo} onChange={(e) => set("flightNo", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="预订确认号">
          <input className={inputCls} value={form.bookingRef} onChange={(e) => set("bookingRef", e.target.value)} />
        </Field>
        <Field label="费用金额">
          <input type="number" className={inputCls} value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="可选" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="付款人">
          <select className={inputCls} value={form.payer} onChange={(e) => set("payer", e.target.value)}>
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="费用归属">
          <select className={inputCls} value={form.costBelong} onChange={(e) => set("costBelong", e.target.value)}>
            <option>公摊</option>
            <option>个人</option>
          </select>
        </Field>
      </div>
      <Field label="状态">
        <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="备注">
        <textarea className={inputCls} rows={2} value={form.note} onChange={(e) => set("note", e.target.value)} />
      </Field>
      <div className="mt-2 flex gap-2">
        <Button type="submit" className="flex-1">
          {editing ? "保存修改" : "添加节点"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          取消
        </Button>
      </div>
    </form>
  );
}
