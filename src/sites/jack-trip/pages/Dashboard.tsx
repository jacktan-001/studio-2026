import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plane, MapPinned, Wallet, BookMarked, ListChecks, Vote, Map as MapIcon, ArrowRight, Flame } from "lucide-react";
import { useTrip } from "../store";
import { Card, SectionTitle, Stat, Avatar, Badge, ProgressBar } from "../components/ui";
import { fmtCNY, todayISO, fmtDate, classNames } from "../lib/format";

const QUICK = [
  { to: "/trip", label: "行程", icon: MapPinned, color: "bg-brand-500" },
  { to: "/expense", label: "记账", icon: Wallet, color: "bg-emerald-500" },
  { to: "/guide", label: "攻略", icon: BookMarked, color: "bg-sky-500" },
  { to: "/list", label: "清单", icon: ListChecks, color: "bg-violet-500" },
  { to: "/vote", label: "投票", icon: Vote, color: "bg-rose-500" },
  { to: "/map", label: "地图", icon: MapIcon, color: "bg-amber-500" },
];

export default function Dashboard() {
  const { state } = useTrip();
  const today = todayISO();
  const memberOf = (id: string) => state.members.find((m) => m.id === id);

  const stats = useMemo(() => {
    const total = state.expenses.reduce((s, e) => s + e.cny, 0);
    const perCapita = total / (state.members.length || 1);
    const remaining = state.meta.budget - total;
    const todayItems = state.itinerary
      .filter((i) => i.date === today)
      .sort((a, b) => a.order - b.order);
    return { total, perCapita, remaining, todayItems, count: state.itinerary.length };
  }, [state]);

  const recent = useMemo(() => [...state.expenses].slice(0, 4), [state.expenses]);
  const budgetPct = Math.round((stats.total / (state.meta.budget || 1)) * 100);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-orange-600 p-5 text-white shadow-lg shadow-brand-500/20">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Flame size={16} /> {state.meta.destination}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{state.meta.name}</h1>
          <p className="mt-1 text-sm text-white/80">
            {fmtDate(state.meta.startDate)} – {fmtDate(state.meta.endDate)} · {state.members.length} 人同行
          </p>
          <div className="mt-4 flex -space-x-2">
            {state.members.map((m) => (
              <div key={m.id} className="ring-2 ring-orange-500 rounded-full">
                <Avatar member={m} size={32} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="总支出" value={fmtCNY(stats.total)} sub={`${state.expenses.length} 笔账单`} tone="brand" />
        <Stat label="人均消费" value={fmtCNY(stats.perCapita)} tone="green" />
        <Stat
          label="剩余预算"
          value={fmtCNY(Math.max(0, stats.remaining))}
          sub={budgetPct >= 100 ? "已超预算" : `预算 ${fmtCNY(state.meta.budget)}`}
          tone={stats.remaining < 0 ? "amber" : "violet"}
        />
        <Stat label="行程节点" value={stats.count} sub={`今日 ${stats.todayItems.length} 项`} tone="amber" />
      </div>

      {/* Budget progress */}
      <Card>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">预算使用</span>
          <span className={classNames(budgetPct >= 100 ? "text-amber-600" : "text-slate-500")}>
            {budgetPct}%
          </span>
        </div>
        <ProgressBar value={budgetPct} />
      </Card>

      {/* Today's itinerary */}
      <section>
        <SectionTitle
          title="今日行程"
          subtitle={stats.todayItems.length ? `${stats.todayItems.length} 个节点` : "今天没有安排"}
          right={
            <Link to="/trip" className="flex items-center gap-0.5 text-sm font-medium text-brand-600">
              全部 <ArrowRight size={14} />
            </Link>
          }
        />
        {stats.todayItems.length === 0 ? (
          <Card className="text-center text-sm text-slate-400">暂无今日行程，去行程页添加吧 ✈️</Card>
        ) : (
          <div className="space-y-2">
            {stats.todayItems.map((it) => {
              const tone =
                it.status === "已完成" ? "green" : it.status === "进行中" ? "brand" : "slate";
              return (
                <Card key={it.id} className="flex items-center gap-3 !p-3">
                  <div className="w-12 shrink-0 text-center">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {it.startTime || "--:--"}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900 dark:text-white">{it.title}</div>
                    <div className="truncate text-xs text-slate-500">
                      {it.locationName || it.type}
                    </div>
                  </div>
                  <Badge tone={tone as any}>{it.status}</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent expenses */}
      <section>
        <SectionTitle
          title="最近账单"
          right={
            <Link to="/expense" className="flex items-center gap-0.5 text-sm font-medium text-brand-600">
              全部 <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="space-y-2">
          {recent.map((e) => {
            const payer = memberOf(e.payer);
            return (
              <Card key={e.id} className="flex items-center gap-3 !p-3">
                {payer && <Avatar member={payer} size={32} />}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900 dark:text-white">
                    {e.category} · {e.note || "消费"}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {fmtDate(e.date)} · 付款人 {payer?.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">{fmtCNY(e.cny)}</div>
                  <div className="text-[11px] text-slate-400">
                    {e.currency} {e.amount.toLocaleString()}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick access */}
      <section>
        <SectionTitle title="快速入口" />
        <div className="grid grid-cols-3 gap-3">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition active:scale-95 dark:border-white/10 dark:bg-slate-800/60"
              >
                <div className={classNames("flex h-11 w-11 items-center justify-center rounded-xl text-white", q.color)}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{q.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
