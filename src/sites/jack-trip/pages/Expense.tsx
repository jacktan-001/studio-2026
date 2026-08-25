import { useMemo, useState } from "react";
import {
  Plus,
  Wallet,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Users,
  Scale,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { useTrip } from "../store";
import { Card, SectionTitle, Badge, FAB, Modal, Field, Button, inputCls, EmptyState, Stat } from "../components/ui";
import { classNames, fmtCNY, fmtDate, CURRENCY_LABEL, round2 } from "../lib/format";
import { computeBalances, simplifyDebts } from "../lib/calc";
import type { Currency, Expense, ExpenseCategory, SplitMode } from "../types";

const RATE: Record<Currency, number> = {
  CNY: 1,
  JPY: 0.048,
  USD: 7.2,
  EUR: 7.8,
  HKD: 0.92,
  THB: 0.2,
  KRW: 0.0054,
};
const CURRENCIES = Object.keys(RATE) as Currency[];
const CATEGORIES: (ExpenseCategory | "全部")[] = ["全部", "餐饮", "交通", "住宿", "门票", "购物", "其他"];
const SPLIT_MODES: SplitMode[] = ["平均", "按人", "按比例", "精确金额"];

function iconCat(c: ExpenseCategory) {
  const m: Record<ExpenseCategory, string> = {
    餐饮: "🍜",
    交通: "🚄",
    住宿: "🏨",
    门票: "🎫",
    购物: "🛍️",
    其他: "💡",
  };
  return m[c];
}

export default function Expense() {
  const { state, addExpense, updateExpense, deleteExpense, settleExpense, canEdit } = useTrip();
  const [tab, setTab] = useState<"list" | "stats" | "settle">("list");
  const [filter, setFilter] = useState<ExpenseCategory | "全部">("全部");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const memberOf = (id: string) => state.members.find((m) => m.id === id);
  const balances = useMemo(() => computeBalances(state.expenses, state.members), [state.expenses, state.members]);
  const debts = useMemo(() => simplifyDebts(balances), [balances]);
  const total = useMemo(() => state.expenses.reduce((s, e) => s + e.cny, 0), [state.expenses]);
  const perCapita = total / (state.members.length || 1);

  const list = useMemo(() => {
    const arr = filter === "全部" ? state.expenses : state.expenses.filter((e) => e.category === filter);
    return [...arr].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [state.expenses, filter]);

  return (
    <div>
      <SectionTitle title="费用记账" subtitle="多人实时记账 · 自动分摊 · 一键结算" />
      <div className="mb-3 grid grid-cols-3 gap-3">
        <Stat label="总支出" value={fmtCNY(total)} tone="brand" />
        <Stat label="人均消费" value={fmtCNY(perCapita)} tone="green" />
        <Stat label="账单数" value={state.expenses.length} tone="violet" />
      </div>

      <div className="mb-3 flex rounded-xl bg-slate-100 p-1 dark:bg-white/10">
        {([
          ["list", "明细", Receipt],
          ["stats", "统计", TrendingUp],
          ["settle", "结算", Scale],
        ] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={classNames(
              "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-medium transition",
              tab === k ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500"
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <>
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scroll-thin">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={classNames(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
                  filter === c
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <EmptyState icon={<Wallet />} text="还没有账单，点右下角记一笔" />
          ) : (
            <div className="space-y-2">
              {list.map((e) => {
                const payer = memberOf(e.payer);
                const editable = canEdit(e.createdBy);
                return (
                  <Card key={e.id} className="!p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-white/10">
                        {iconCat(e.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-slate-900 dark:text-white">
                            {e.category} · {e.note || "消费"}
                          </span>
                          {e.settled && <Badge tone="green">已结清</Badge>}
                        </div>
                        <div className="truncate text-xs text-slate-500">
                          {fmtDate(e.date)} · {payer?.name}付款 · {e.splitMode}分摊
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white">{fmtCNY(e.cny)}</div>
                        <div className="text-[11px] text-slate-400">
                          {e.currency} {e.amount.toLocaleString()}
                        </div>
                      </div>
                      {editable && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              setEditing(e);
                              setOpen(true);
                            }}
                            className="text-slate-400 hover:text-brand-600"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("删除该账单？")) deleteExpense(e.id);
                            }}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.splits.map((s) => {
                        const m = memberOf(s.memberId);
                        return (
                          <span key={s.memberId} className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500 dark:bg-white/5">
                            {m?.name} {fmtCNY(s.amount)}
                          </span>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "stats" && (
        <div className="space-y-3">
          <Stat label="总支出 / 人均" value={fmtCNY(total)} sub={`人均 ${fmtCNY(perCapita)}`} tone="brand" />
          <SectionTitle title="各人已付 / 应付 / 净" />
          <div className="space-y-2">
            {balances.map((b) => {
              const m = memberOf(b.memberId)!;
              const netTone = b.net > 0.005 ? "text-emerald-600" : b.net < -0.005 ? "text-rose-600" : "text-slate-500";
              return (
                <Card key={b.memberId} className="flex items-center gap-3 !p-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: m.color }}
                  >
                    {m.avatar}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-xs text-slate-500">
                      已付 {fmtCNY(b.paid)} · 应付 {fmtCNY(b.owed)}
                    </div>
                  </div>
                  <div className={classNames("text-right text-sm font-bold", netTone)}>
                    {b.net > 0.005 ? "应收" : b.net < -0.005 ? "应付" : "平"}
                    <div>{fmtCNY(Math.abs(b.net))}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === "settle" && (
        <div className="space-y-3">
          <SectionTitle title="一键结算清单" subtitle="基于各人分摊自动化简后的债务关系" />
          {debts.length === 0 ? (
            <Card className="text-center text-sm text-emerald-600">🎉 账目已平，无需结算</Card>
          ) : (
            <div className="space-y-2">
              {debts.map((d, i) => {
                const from = memberOf(d.from)!;
                const to = memberOf(d.to)!;
                return (
                  <Card key={i} className="flex items-center gap-3 !p-3">
                    <div className="flex flex-1 items-center gap-2 text-sm">
                      <span className="font-medium text-slate-900 dark:text-white">{from.name}</span>
                      <span className="text-rose-500">应付</span>
                      <span className="font-bold text-rose-600">{fmtCNY(d.amount)}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-medium text-slate-900 dark:text-white">{to.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        // 标记相关未结清账单为已结清
                        state.expenses
                          .filter((e) => !e.settled && (e.payer === d.to || e.participants.includes(d.from)))
                          .forEach((e) => settleExpense(e.id, true));
                      }}
                      className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    >
                      <CheckCircle2 size={13} /> 结清
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
          <Button
            className="w-full"
            onClick={() => state.expenses.forEach((e) => settleExpense(e.id, true))}
          >
            一键结清全部账单
          </Button>
          <p className="text-center text-xs text-slate-400">结清后账单标记为「已结清」，可随时在明细中查看</p>
        </div>
      )}

      <FAB onClick={() => { setEditing(null); setOpen(true); }} icon={<Plus size={24} />} label="记一笔" />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "编辑账单" : "记一笔"}>
        <ExpenseForm
          editing={editing}
          onSubmit={(data) => {
            if (editing) updateExpense(editing.id, data);
            else addExpense(data);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}

function ExpenseForm({
  editing,
  onSubmit,
  onClose,
}: {
  editing: Expense | null;
  onSubmit: (data: Omit<Expense, "id" | "createdAt" | "updatedAt" | "cny" | "splits">) => void;
  onClose: () => void;
}) {
  const { state } = useTrip();
  const allIds = state.members.map((m) => m.id);
  const [form, setForm] = useState({
    date: editing?.date || new Date().toISOString().slice(0, 10),
    amount: editing?.amount?.toString() || "",
    currency: (editing?.currency || "CNY") as Currency,
    rate: (editing?.rate || RATE[editing?.currency || "CNY"]).toString(),
    category: (editing?.category || "餐饮") as ExpenseCategory,
    payMethod: editing?.payMethod || "微信",
    payer: editing?.payer || state.members[0].id,
    participants: editing?.participants?.length ? editing.participants : allIds,
    splitMode: (editing?.splitMode || "平均") as SplitMode,
    note: editing?.note || "",
    splitInputs: {} as Record<string, string>,
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const rate = Number(form.rate) || 0;

  const toggleParticipant = (id: string) =>
    setForm((f) => ({
      ...f,
      participants: f.participants.includes(id)
        ? f.participants.filter((x) => x !== id)
        : [...f.participants, id],
    }));

  const cnyTotal = round2(Number(form.amount || 0) * rate);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const amount = Number(form.amount);
        if (!amount || amount <= 0) return alert("请输入有效金额");
        if (form.participants.length === 0) return alert("请选择至少一名参与分摊的成员");
        const explicit = form.participants.map((id) => ({
          memberId: id,
          amount: Number(form.splitInputs[id] || 0),
        }));
        onSubmit({
          date: form.date,
          amount,
          currency: form.currency,
          rate,
          category: form.category,
          payMethod: form.payMethod,
          payer: form.payer,
          participants: form.participants,
          splitMode: form.splitMode,
          splitStatus: "未付",
          note: form.note || undefined,
          createdBy: editing?.createdBy || state.members[0].id,
          settled: false,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="金额">
          <input type="number" step="0.01" className={inputCls} value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="币种">
          <select className={inputCls} value={form.currency} onChange={(e) => {
            const c = e.target.value as Currency;
            set("currency", c);
            set("rate", RATE[c]);
          }}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c} · {CURRENCY_LABEL[c]}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="汇率（1 外币 = ? 人民币）" hint={`折合人民币约 ${fmtCNY(cnyTotal)}`}>
        <input type="number" step="0.0001" className={inputCls} value={form.rate} onChange={(e) => set("rate", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="分类">
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {(["餐饮", "交通", "住宿", "门票", "购物", "其他"] as ExpenseCategory[]).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="支付方式">
          <input className={inputCls} value={form.payMethod} onChange={(e) => set("payMethod", e.target.value)} placeholder="微信/支付宝..." />
        </Field>
      </div>
      <Field label="付款人">
        <select className={inputCls} value={form.payer} onChange={(e) => set("payer", e.target.value)}>
          {state.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </Field>
      <Field label="参与分摊成员">
        <div className="flex flex-wrap gap-2">
          {state.members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleParticipant(m.id)}
              className={classNames(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                form.participants.includes(m.id)
                  ? "bg-brand-500 text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-white/10"
              )}
            >
              {m.avatar} {m.name}
            </button>
          ))}
        </div>
      </Field>
      <Field label="分摊模式">
        <div className="flex flex-wrap gap-2">
          {SPLIT_MODES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set("splitMode", s)}
              className={classNames(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                form.splitMode === s ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>
      {form.splitMode !== "平均" && (
        <Field label={`各组员分摊（${form.splitMode === "按比例" ? "比例" : "金额"}，将按合计自动归一化）`}>
          <div className="space-y-2">
            {form.participants.map((id) => {
              const m = state.members.find((x) => x.id === id)!;
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-16 text-sm">{m.avatar} {m.name}</span>
                  <input
                    type="number"
                    step="0.01"
                    className={inputCls}
                    value={form.splitInputs[id] || ""}
                    onChange={(e) => set("splitInputs", { ...form.splitInputs, [id]: e.target.value })}
                    placeholder="0"
                  />
                </div>
              );
            })}
          </div>
        </Field>
      )}
      <Field label="备注">
        <input className={inputCls} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="如：道顿堀晚餐" />
      </Field>
      <div className="mt-2 flex gap-2">
        <Button type="submit" className="flex-1">{editing ? "保存" : "保存账单"}</Button>
        <Button variant="ghost" onClick={onClose}>取消</Button>
      </div>
    </form>
  );
}
