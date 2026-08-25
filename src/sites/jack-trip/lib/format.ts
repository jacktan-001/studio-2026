import type { Currency } from "../types";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  CNY: "¥",
  JPY: "¥", // 日元符号也常用 ¥，展示时附 JPY
  USD: "$",
  EUR: "€",
  HKD: "HK$",
  THB: "฿",
  KRW: "₩",
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  CNY: "人民币",
  JPY: "日元",
  USD: "美元",
  EUR: "欧元",
  HKD: "港币",
  THB: "泰铢",
  KRW: "韩元",
};

/** 折合人民币：原始金额 * 汇率 */
export function toCNY(amount: number, rate: number): number {
  return round2(amount * rate);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function fmtMoney(n: number, cur: Currency = "CNY"): string {
  const sym = CURRENCY_SYMBOL[cur];
  return `${sym}${round2(n).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtCNY(n: number): string {
  return `¥${round2(n).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function fmtDateFull(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const w = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} 周${w}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function classNames(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(" ");
}
