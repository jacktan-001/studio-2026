import type { Expense, ID, Member } from "../types";
import { round2 } from "./format";

/** 根据分摊模式计算每个人的分摊金额，保证合计 == cny */
export function computeSplits(
  splitMode: Expense["splitMode"],
  cny: number,
  participants: ID[],
  explicit: { memberId: ID; amount: number }[]
): { memberId: ID; amount: number }[] {
  if (participants.length === 0) return [];
  if (splitMode === "平均") {
    const base = Math.floor((cny / participants.length) * 100) / 100;
    const rem = round2(cny - base * participants.length);
    return participants.map((id, i) => ({
      memberId: id,
      amount: round2(i === 0 ? base + rem : base),
    }));
  }
  // 按人 / 按比例 / 精确金额：以 explicit 为准，归一化到 cny
  const raw = participants.map((id) => {
    const found = explicit.find((e) => e.memberId === id);
    return { memberId: id, amount: found ? Math.max(0, found.amount) : 0 };
  });
  const sum = raw.reduce((s, r) => s + r.amount, 0);
  if (sum === 0) {
    // 避免除零：均等兜底
    return computeSplits("平均", cny, participants, []);
  }
  const scaled = raw.map((r) => ({ memberId: r.memberId, amount: round2((r.amount / sum) * cny) }));
  const diff = round2(cny - scaled.reduce((s, r) => s + r.amount, 0));
  scaled[0] = { ...scaled[0], amount: round2(scaled[0].amount + diff) };
  return scaled;
}

export interface Balance {
  memberId: ID;
  paid: number; // 该成员作为付款人实际支付的总额
  owed: number; // 该成员作为参与者应承担的总额
  net: number; // paid - owed，正=别人欠他，负=他欠别人
}

export function computeBalances(expenses: Expense[], members: Member[]): Balance[] {
  const paid: Record<ID, number> = {};
  const owed: Record<ID, number> = {};
  members.forEach((m) => {
    paid[m.id] = 0;
    owed[m.id] = 0;
  });
  for (const e of expenses) {
    if (paid[e.payer] !== undefined) paid[e.payer] += e.cny;
    for (const s of e.splits) {
      if (owed[s.memberId] !== undefined) owed[s.memberId] += s.amount;
    }
  }
  return members.map((m) => {
    const p = paid[m.id] ?? 0;
    const o = owed[m.id] ?? 0;
    return { memberId: m.id, paid: round2(p), owed: round2(o), net: round2(p - o) };
  });
}

export interface DebtTx {
  from: ID; // 付款人（欠钱）
  to: ID; // 收款人（被欠）
  amount: number;
}

/** 贪心法最小化结算笔数 */
export function simplifyDebts(balances: Balance[]): DebtTx[] {
  const creditors = balances
    .filter((b) => b.net > 0.005)
    .map((b) => ({ id: b.memberId, amt: b.net }))
    .sort((a, b) => b.amt - a.amt);
  const debtors = balances
    .filter((b) => b.net < -0.005)
    .map((b) => ({ id: b.memberId, amt: -b.net }))
    .sort((a, b) => b.amt - a.amt);
  const txs: DebtTx[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    txs.push({ from: debtors[i].id, to: creditors[j].id, amount: round2(pay) });
    debtors[i].amt = round2(debtors[i].amt - pay);
    creditors[j].amt = round2(creditors[j].amt - pay);
    if (debtors[i].amt < 0.005) i++;
    if (creditors[j].amt < 0.005) j++;
  }
  return txs;
}
