// ===== Jack Trip — domain types (from 功能清单字段设计) =====

export type ID = string;

export type Role = "管理员" | "普通成员";

export interface Member {
  id: ID;
  name: string;
  avatar: string; // emoji or short text
  color: string; // tailwind-ish hex for avatar bg
  role: Role;
  responsibility?: string;
  contact?: string;
  joinedAt: string; // ISO date
  online?: boolean;
}

export type TripType =
  | "交通"
  | "住宿"
  | "景点"
  | "餐饮"
  | "购物"
  | "自由"
  | "其他";

export type TripStatus = "未开始" | "进行中" | "已完成";

export interface ItineraryItem {
  id: ID;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  title: string;
  type: TripType;
  locationName?: string;
  address?: string;
  coords?: { lat: number; lng: number };
  transport?: string; // 飞机/高铁/打车...
  flightNo?: string; // 车牌号/航班号
  bookingRef?: string; // 预订确认号
  amount?: number; // 费用金额
  payer?: ID;
  costBelong?: "公摊" | "个人";
  note?: string;
  attachment?: string;
  status: TripStatus;
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export type Currency = "CNY" | "JPY" | "USD" | "EUR" | "HKD" | "THB" | "KRW";

export type ExpenseCategory =
  | "餐饮"
  | "交通"
  | "住宿"
  | "门票"
  | "购物"
  | "其他";

export type SplitMode = "平均" | "按人" | "按比例" | "精确金额";

export type SplitStatus = "已付" | "未付" | "部分付";

export interface Expense {
  id: ID;
  date: string;
  amount: number; // 原始金额
  currency: Currency;
  rate: number; // 换算汇率 -> CNY
  cny: number; // 折合人民币
  category: ExpenseCategory;
  payMethod: string; // 微信/支付宝/信用卡/现金/其他
  payer: ID;
  participants: ID[];
  splitMode: SplitMode;
  splits: { memberId: ID; amount: number }[]; // 各人分摊金额
  splitStatus: SplitStatus;
  note?: string;
  receipt?: string;
  createdBy: ID;
  createdAt: string;
  updatedAt: string;
  settled: boolean;
}

export type GuideType =
  | "景点"
  | "餐厅"
  | "住宿"
  | "购物"
  | "交通"
  | "注意事项"
  | "其他";

export type Priority = "必去" | "可选" | "备选";

export interface GuideComment {
  id: ID;
  memberId: ID;
  text: string;
  at?: ID; // @特定成员
  createdAt: string;
}

export interface Guide {
  id: ID;
  title: string;
  type: GuideType;
  sourceUrl?: string;
  cover?: string;
  collectedBy: ID;
  collectedAt: string;
  reason?: string;
  rating: number; // 1-5
  recommended: "推荐" | "不推荐";
  priority: Priority;
  note?: string;
  attachment?: string;
  tags: string[];
  comments: GuideComment[];
  starred?: boolean;
}

export type PackingCategory = "证件" | "电子产品" | "衣物" | "洗护" | "药品" | "其他";
export type PackingStatus = "未准备" | "已准备" | "已携带";

export interface PackingItem {
  id: ID;
  name: string;
  category: PackingCategory;
  owner?: ID;
  status: PackingStatus;
  note?: string;
  createdBy: ID;
}

export type VoteType = "单选" | "多选" | "评分";

export interface VoteOption {
  id: ID;
  label: string;
}

export interface VoteCast {
  memberId: ID;
  optionIds: ID[];
  score?: number; // for 评分
}

export interface Vote {
  id: ID;
  title: string;
  type: VoteType;
  anonymous: boolean;
  options: VoteOption[];
  votes: VoteCast[];
  deadline?: string;
  createdBy: ID;
  createdAt: string;
  closed?: boolean;
}

export interface TripMeta {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number; // 总预算 CNY
  currency: Currency;
}

export interface TripState {
  meta: TripMeta;
  members: Member[];
  itinerary: ItineraryItem[];
  expenses: Expense[];
  guides: Guide[];
  packing: PackingItem[];
  votes: Vote[];
}
