import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  Expense,
  Guide,
  ID,
  ItineraryItem,
  Member,
  PackingItem,
  TripMeta,
  TripState,
  Vote,
} from "./types";
import { computeSplits } from "./lib/calc";
import { nowISO, todayISO, uid, toCNY, round2 } from "./lib/format";

// ---------------------------------------------------------------------------
// 种子数据：5 人日本关西之旅（日期相对“今天”动态生成，保证演示生动）
// ---------------------------------------------------------------------------

const M = (
  id: ID,
  name: string,
  avatar: string,
  color: string,
  role: Member["role"],
  responsibility: string,
  contact: string,
  online: boolean
): Member => ({
  id,
  name,
  avatar,
  color,
  role,
  responsibility,
  contact,
  joinedAt: todayISO(),
  online,
});

const MEMBERS: Member[] = [
  M("m1", "阿诚", "🧑‍✈️", "#f97316", "管理员", "交通统筹 / 总协调", "138****0001", true),
  M("m2", "小美", "🧑‍🎨", "#ec4899", "普通成员", "住宿预订", "138****0002", true),
  M("m3", "大伟", "🧔", "#3b82f6", "普通成员", "攻略 / 拍照", "138****0003", false),
  M("m4", "莉莉", "👩", "#14b8a6", "普通成员", "记账 / 财务", "138****0004", true),
  M("m5", "老周", "👨", "#8b5cf6", "普通成员", "吃喝探店", "138****0005", false),
];

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function makeExpense(p: {
  id?: ID;
  date: string;
  amount: number;
  currency: Expense["currency"];
  rate: number;
  category: Expense["category"];
  payMethod: string;
  payer: ID;
  participants: ID[];
  splitMode: Expense["splitMode"];
  explicit?: { memberId: ID; amount: number }[];
  note?: string;
  createdBy: ID;
  settled?: boolean;
  splitStatus?: Expense["splitStatus"];
}): Expense {
  const cny = toCNY(p.amount, p.rate);
  const explicit = p.explicit ?? p.participants.map((id) => ({ memberId: id, amount: cny }));
  const splits = computeSplits(p.splitMode, cny, p.participants, explicit);
  return {
    id: p.id ?? uid("e"),
    date: p.date,
    amount: p.amount,
    currency: p.currency,
    rate: p.rate,
    cny: round2(cny),
    category: p.category,
    payMethod: p.payMethod,
    payer: p.payer,
    participants: p.participants,
    splitMode: p.splitMode,
    splits,
    splitStatus: p.splitStatus ?? "未付",
    note: p.note,
    createdBy: p.createdBy,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    settled: p.settled ?? false,
  };
}

function buildSeed(): TripState {
  const d0 = dateOffset(0);
  const d1 = dateOffset(1);
  const d2 = dateOffset(2);
  const d3 = dateOffset(3);
  const d4 = dateOffset(4);

  const itinerary: ItineraryItem[] = [
    {
      id: "t1",
      date: d0,
      startTime: "08:30",
      endTime: "12:30",
      title: "抵达关西机场 · 入境",
      type: "交通",
      locationName: "关西国际机场",
      address: "大阪府泉佐野市",
      coords: { lat: 34.4347, lng: 135.244 },
      transport: "飞机",
      flightNo: "CA927",
      amount: 0,
      payer: "m1",
      costBelong: "公摊",
      note: "国际航站楼 T1，出口集合",
      status: "已完成",
      createdBy: "m1",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 1,
    },
    {
      id: "t2",
      date: d0,
      startTime: "14:00",
      endTime: "15:00",
      title: "入住难波酒店",
      type: "住宿",
      locationName: "难波光芒酒店",
      address: "大阪市中央区难波",
      bookingRef: "BK-88231",
      payer: "m2",
      costBelong: "公摊",
      status: "进行中",
      createdBy: "m2",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 2,
    },
    {
      id: "t3",
      date: d0,
      startTime: "18:30",
      endTime: "20:30",
      title: "道顿堀晚餐 · 章鱼烧",
      type: "餐饮",
      locationName: "道顿堀",
      address: "大阪市中央区道顿堀",
      coords: { lat: 34.6687, lng: 135.5013 },
      payer: "m5",
      costBelong: "公摊",
      status: "未开始",
      createdBy: "m5",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 3,
    },
    {
      id: "t4",
      date: d1,
      startTime: "09:30",
      endTime: "12:00",
      title: "大阪城公园",
      type: "景点",
      locationName: "大阪城天守阁",
      address: "大阪市中央区大阪城",
      coords: { lat: 34.6873, lng: 135.5259 },
      payer: "m3",
      costBelong: "公摊",
      status: "未开始",
      createdBy: "m3",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 1,
    },
    {
      id: "t5",
      date: d1,
      startTime: "14:00",
      endTime: "21:00",
      title: "环球影城 USJ",
      type: "景点",
      locationName: "日本环球影城",
      address: "大阪市此花区",
      coords: { lat: 34.6654, lng: 135.4323 },
      bookingRef: "USJ-5512",
      payer: "m3",
      costBelong: "公摊",
      status: "未开始",
      createdBy: "m3",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 2,
    },
    {
      id: "t6",
      date: d2,
      startTime: "09:00",
      endTime: "13:00",
      title: "京都岚山 · 竹林",
      type: "景点",
      locationName: "岚山竹林小径",
      address: "京都市右京区岚山",
      coords: { lat: 35.0094, lng: 135.6669 },
      transport: "JR 电车",
      payer: "m3",
      costBelong: "公摊",
      status: "未开始",
      createdBy: "m3",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 1,
    },
    {
      id: "t7",
      date: d2,
      startTime: "15:30",
      endTime: "18:00",
      title: "伏见稻荷大社",
      type: "景点",
      locationName: "伏见稻荷大社",
      address: "京都市伏见区",
      coords: { lat: 34.9671, lng: 135.7727 },
      payer: "m3",
      costBelong: "公摊",
      status: "未开始",
      createdBy: "m3",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 2,
    },
    {
      id: "t8",
      date: d3,
      startTime: "09:30",
      endTime: "12:00",
      title: "奈良公园喂鹿",
      type: "景点",
      locationName: "奈良公园",
      address: "奈良市登大路町",
      coords: { lat: 34.6851, lng: 135.8397 },
      payer: "m1",
      costBelong: "公摊",
      status: "未开始",
      createdBy: "m1",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 1,
    },
    {
      id: "t9",
      date: d3,
      startTime: "16:00",
      endTime: "19:00",
      title: "心斋桥购物",
      type: "购物",
      locationName: "心斋桥筋商店街",
      address: "大阪市中央区心斋桥",
      coords: { lat: 34.6719, lng: 135.5006 },
      payer: "m4",
      costBelong: "个人",
      status: "未开始",
      createdBy: "m4",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 2,
    },
    {
      id: "t10",
      date: d4,
      startTime: "10:00",
      endTime: "14:00",
      title: "返程 · 关西机场",
      type: "交通",
      locationName: "关西国际机场",
      address: "大阪府泉佐野市",
      coords: { lat: 34.4347, lng: 135.244 },
      transport: "南海电铁",
      payer: "m1",
      costBelong: "公摊",
      status: "未开始",
      createdBy: "m1",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      order: 1,
    },
  ];

  const expenses: Expense[] = [
    makeExpense({
      id: "x1",
      date: d0,
      amount: 85000,
      currency: "JPY",
      rate: 0.048,
      category: "交通",
      payMethod: "信用卡",
      payer: "m1",
      participants: ["m1", "m2", "m3", "m4", "m5"],
      splitMode: "平均",
      note: "往返机票（5人）",
      createdBy: "m1",
      splitStatus: "已付",
    }),
    makeExpense({
      id: "x2",
      date: d0,
      amount: 60000,
      currency: "JPY",
      rate: 0.048,
      category: "住宿",
      payMethod: "支付宝",
      payer: "m2",
      participants: ["m1", "m2", "m3", "m4", "m5"],
      splitMode: "平均",
      note: "4晚酒店",
      createdBy: "m2",
      splitStatus: "已付",
    }),
    makeExpense({
      id: "x3",
      date: d0,
      amount: 18000,
      currency: "JPY",
      rate: 0.048,
      category: "餐饮",
      payMethod: "微信",
      payer: "m5",
      participants: ["m1", "m2", "m3", "m4", "m5"],
      splitMode: "平均",
      note: "道顿堀晚餐",
      createdBy: "m5",
    }),
    makeExpense({
      id: "x4",
      date: d1,
      amount: 44000,
      currency: "JPY",
      rate: 0.048,
      category: "门票",
      payMethod: "微信",
      payer: "m3",
      participants: ["m1", "m2", "m3", "m4", "m5"],
      splitMode: "平均",
      note: "USJ 快速通行证",
      createdBy: "m3",
    }),
    makeExpense({
      id: "x5",
      date: d3,
      amount: 32000,
      currency: "JPY",
      rate: 0.048,
      category: "购物",
      payMethod: "信用卡",
      payer: "m4",
      participants: ["m2", "m4"],
      splitMode: "精确金额",
      explicit: [
        { memberId: "m2", amount: 8000 },
        { memberId: "m4", amount: 24000 },
      ],
      note: "药妆 + 手信",
      createdBy: "m4",
    }),
    makeExpense({
      id: "x6",
      date: d3,
      amount: 6000,
      currency: "JPY",
      rate: 0.048,
      category: "餐饮",
      payMethod: "现金",
      payer: "m1",
      participants: ["m1", "m3", "m5"],
      splitMode: "平均",
      note: "奈良小吃",
      createdBy: "m1",
    }),
  ];

  const guides: Guide[] = [
    {
      id: "g1",
      title: "大阪城天守阁",
      type: "景点",
      sourceUrl: "https://www.osakacastle.net/",
      collectedBy: "m3",
      collectedAt: nowISO(),
      reason: "丰臣秀吉居城，俯瞰大阪全景，建议早去避开人流",
      rating: 5,
      recommended: "推荐",
      priority: "必去",
      tags: ["历史", "登城"],
      comments: [
        { id: uid("c"), memberId: "m1", text: "门票记得提前官网买", createdAt: nowISO() },
      ],
      starred: true,
    },
    {
      id: "g2",
      title: "道顿堀章鱼烧老店",
      type: "餐厅",
      collectedBy: "m5",
      collectedAt: nowISO(),
      reason: "现做现吃，外脆里嫩",
      rating: 5,
      recommended: "推荐",
      priority: "必去",
      tags: ["美食", "小吃"],
      comments: [],
    },
    {
      id: "g3",
      title: "岚山竹林小径",
      type: "景点",
      collectedBy: "m3",
      collectedAt: nowISO(),
      reason: "清晨光线最美，拍照出片",
      rating: 4,
      recommended: "推荐",
      priority: "必去",
      tags: ["自然", "拍照"],
      comments: [],
    },
    {
      id: "g4",
      title: "伏见稻荷千本鸟居",
      type: "景点",
      collectedBy: "m3",
      collectedAt: nowISO(),
      reason: "朱红鸟居隧道，爬到半山人少",
      rating: 5,
      recommended: "推荐",
      priority: "必去",
      tags: ["神社", "徒步"],
      comments: [],
    },
    {
      id: "g5",
      title: "一兰拉面（道顿堀）",
      type: "餐厅",
      collectedBy: "m5",
      collectedAt: nowISO(),
      reason: "孤独位吃法，口味可自定义",
      rating: 4,
      recommended: "推荐",
      priority: "可选",
      tags: ["拉面", "快餐"],
      comments: [],
    },
  ];

  const packing: PackingItem[] = [
    { id: "p1", name: "护照", category: "证件", owner: "m1", status: "已携带", createdBy: "m1" },
    { id: "p2", name: "身份证", category: "证件", owner: "m2", status: "已准备", createdBy: "m2" },
    { id: "p3", name: "充电宝", category: "电子产品", owner: "m3", status: "已准备", createdBy: "m3" },
    { id: "p4", name: "转换插头（日标）", category: "电子产品", owner: "m4", status: "未准备", createdBy: "m4" },
    { id: "p5", name: "薄外套", category: "衣物", owner: "m5", status: "未准备", createdBy: "m5" },
    { id: "p6", name: "洗漱包", category: "洗护", owner: "m1", status: "已准备", createdBy: "m1" },
    { id: "p7", name: "常备药品", category: "药品", owner: "m2", status: "未准备", createdBy: "m2" },
    { id: "p8", name: "防晒霜", category: "洗护", owner: "m3", status: "未准备", createdBy: "m3" },
  ];

  const votes: Vote[] = [
    {
      id: "v1",
      title: "今晚晚餐选哪家？",
      type: "单选",
      anonymous: false,
      options: [
        { id: "o1", label: "一兰拉面" },
        { id: "o2", label: "蟹道乐" },
        { id: "o3", label: "大阪烧" },
      ],
      votes: [
        { memberId: "m1", optionIds: ["o1"] },
        { memberId: "m3", optionIds: ["o1"] },
        { memberId: "m4", optionIds: ["o1"] },
        { memberId: "m5", optionIds: ["o2"] },
        { memberId: "m2", optionIds: ["o3"] },
      ],
      createdBy: "m5",
      createdAt: nowISO(),
    },
  ];

  const meta: TripMeta = {
    name: "关西初夏之旅",
    destination: "日本 · 大阪 / 京都 / 奈良",
    startDate: d0,
    endDate: d4,
    budget: 22000,
    currency: "CNY",
  };

  return { meta, members: MEMBERS, itinerary, expenses, guides, packing, votes };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const LS_KEY = "jack-trip-state-v1";
const LS_THEME = "jack-trip-theme";
const LS_USER = "jack-trip-current-user";

interface TripContextValue {
  state: TripState;
  theme: "light" | "dark";
  toggleTheme: () => void;
  currentUserId: ID;
  currentUser: Member;
  setCurrentUser: (id: ID) => void;
  canEdit: (createdBy?: ID) => boolean;
  // mutations
  addItinerary: (item: Omit<ItineraryItem, "id" | "createdAt" | "updatedAt" | "order"> & { order?: number }) => void;
  updateItinerary: (id: ID, patch: Partial<ItineraryItem>) => void;
  deleteItinerary: (id: ID) => void;
  reorderItinerary: (date: string, orderedIds: ID[]) => void;
  addExpense: (e: Omit<Expense, "id" | "createdAt" | "updatedAt" | "cny" | "splits">) => void;
  updateExpense: (id: ID, patch: Partial<Expense>) => void;
  deleteExpense: (id: ID) => void;
  settleExpense: (id: ID, settled: boolean) => void;
  addGuide: (g: Omit<Guide, "id" | "collectedAt" | "comments">) => void;
  updateGuide: (id: ID, patch: Partial<Guide>) => void;
  deleteGuide: (id: ID) => void;
  toggleStar: (id: ID) => void;
  addGuideComment: (id: ID, text: string, at?: ID) => void;
  addPacking: (p: Omit<PackingItem, "id" | "createdBy"> & { createdBy: ID }) => void;
  updatePacking: (id: ID, patch: Partial<PackingItem>) => void;
  deletePacking: (id: ID) => void;
  addVote: (v: Omit<Vote, "id" | "createdAt" | "votes">) => void;
  castVote: (id: ID, cast: { memberId: ID; optionIds: ID[]; score?: number }) => void;
  closeVote: (id: ID) => void;
  deleteVote: (id: ID) => void;
  addMember: (m: Omit<Member, "id" | "joinedAt">) => void;
  updateMember: (id: ID, patch: Partial<Member>) => void;
  deleteMember: (id: ID) => void;
  updateMeta: (patch: Partial<TripMeta>) => void;
  resetAll: () => void;
}

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TripState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw) as TripState;
    } catch {
      /* ignore */
    }
    return buildSeed();
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const t = localStorage.getItem(LS_THEME);
    if (t === "light" || t === "dark") return t;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [currentUserId, setCurrentUserId] = useState<ID>(() => {
    return localStorage.getItem(LS_USER) || "m1";
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);
  useEffect(() => {
    const el = document.getElementById("jack-trip-root");
    if (el) el.classList.toggle("dark", theme === "dark");
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem(LS_USER, currentUserId);
  }, [currentUserId]);

  const currentUser = useMemo(
    () => state.members.find((m) => m.id === currentUserId) ?? state.members[0],
    [state.members, currentUserId]
  );

  const canEdit = (createdBy?: ID) => {
    if (currentUser.role === "管理员") return true;
    if (!createdBy) return true; // 新建内容默认自己创建
    return createdBy === currentUserId;
  };

  // ----- itinerary -----
  const addItinerary: TripContextValue["addItinerary"] = (item) => {
    setState((s) => {
      const sameDay = s.itinerary.filter((i) => i.date === item.date);
      const order = item.order ?? sameDay.length + 1;
      const full: ItineraryItem = {
        ...item,
        id: uid("t"),
        order,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      return { ...s, itinerary: [...s.itinerary, full] };
    });
  };
  const updateItinerary = (id: ID, patch: Partial<ItineraryItem>) =>
    setState((s) => ({
      ...s,
      itinerary: s.itinerary.map((i) =>
        i.id === id ? { ...i, ...patch, updatedAt: nowISO() } : i
      ),
    }));
  const deleteItinerary = (id: ID) =>
    setState((s) => ({ ...s, itinerary: s.itinerary.filter((i) => i.id !== id) }));
  const reorderItinerary = (date: string, orderedIds: ID[]) =>
    setState((s) => ({
      ...s,
      itinerary: s.itinerary.map((i) =>
        i.date === date
          ? { ...i, order: orderedIds.indexOf(i.id) + 1, updatedAt: nowISO() }
          : i
      ),
    }));

  // ----- expense -----
  const addExpense: TripContextValue["addExpense"] = (e) => {
    setState((s) => {
      const cny = toCNY(e.amount, e.rate);
      const explicit = e.participants.map((id) => ({ memberId: id, amount: cny }));
      const splits = computeSplits(e.splitMode, cny, e.participants, explicit);
      const full: Expense = {
        ...e,
        id: uid("e"),
        cny: round2(cny),
        splits,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      return { ...s, expenses: [full, ...s.expenses] };
    });
  };
  const updateExpense = (id: ID, patch: Partial<Expense>) =>
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((x) => {
        if (x.id !== id) return x;
        const merged = { ...x, ...patch, updatedAt: nowISO() };
        if (
          patch.amount !== undefined ||
          patch.rate !== undefined ||
          patch.participants !== undefined ||
          patch.splitMode !== undefined ||
          patch.splits !== undefined
        ) {
          const cny = toCNY(merged.amount, merged.rate);
          const explicit = merged.splits ?? merged.participants.map((id) => ({ memberId: id, amount: cny }));
          merged.cny = round2(cny);
          merged.splits = computeSplits(merged.splitMode, cny, merged.participants, explicit);
        }
        return merged;
      }),
    }));
  const deleteExpense = (id: ID) =>
    setState((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) }));
  const settleExpense = (id: ID, settled: boolean) =>
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((x) => (x.id === id ? { ...x, settled, updatedAt: nowISO() } : x)),
    }));

  // ----- guide -----
  const addGuide: TripContextValue["addGuide"] = (g) =>
    setState((s) => ({
      ...s,
      guides: [
        { ...g, id: uid("g"), collectedAt: nowISO(), comments: [] },
        ...s.guides,
      ],
    }));
  const updateGuide = (id: ID, patch: Partial<Guide>) =>
    setState((s) => ({ ...s, guides: s.guides.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  const deleteGuide = (id: ID) =>
    setState((s) => ({ ...s, guides: s.guides.filter((g) => g.id !== id) }));
  const toggleStar = (id: ID) =>
    setState((s) => ({
      ...s,
      guides: s.guides.map((g) => (g.id === id ? { ...g, starred: !g.starred } : g)),
    }));
  const addGuideComment = (id: ID, text: string, at?: ID) =>
    setState((s) => ({
      ...s,
      guides: s.guides.map((g) =>
        g.id === id
          ? {
              ...g,
              comments: [
                ...g.comments,
                { id: uid("c"), memberId: currentUserId, text, at, createdAt: nowISO() },
              ],
            }
          : g
      ),
    }));

  // ----- packing -----
  const addPacking: TripContextValue["addPacking"] = (p) =>
    setState((s) => ({ ...s, packing: [...s.packing, { ...p, id: uid("p") }] }));
  const updatePacking = (id: ID, patch: Partial<PackingItem>) =>
    setState((s) => ({ ...s, packing: s.packing.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const deletePacking = (id: ID) =>
    setState((s) => ({ ...s, packing: s.packing.filter((p) => p.id !== id) }));

  // ----- vote -----
  const addVote: TripContextValue["addVote"] = (v) =>
    setState((s) => ({ ...s, votes: [{ ...v, id: uid("v"), createdAt: nowISO(), votes: [] }, ...s.votes] }));
  const castVote: TripContextValue["castVote"] = (id, cast) =>
    setState((s) => ({
      ...s,
      votes: s.votes.map((v) =>
        v.id === id
          ? { ...v, votes: [...v.votes.filter((c) => c.memberId !== cast.memberId), cast] }
          : v
      ),
    }));
  const closeVote = (id: ID) =>
    setState((s) => ({ ...s, votes: s.votes.map((v) => (v.id === id ? { ...v, closed: true } : v)) }));
  const deleteVote = (id: ID) =>
    setState((s) => ({ ...s, votes: s.votes.filter((v) => v.id !== id) }));

  // ----- member -----
  const addMember: TripContextValue["addMember"] = (m) =>
    setState((s) => ({
      ...s,
      members: [...s.members, { ...m, id: uid("m"), joinedAt: todayISO() }],
    }));
  const updateMember = (id: ID, patch: Partial<Member>) =>
    setState((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const deleteMember = (id: ID) =>
    setState((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) }));

  const updateMeta = (patch: Partial<TripMeta>) =>
    setState((s) => ({ ...s, meta: { ...s.meta, ...patch } }));

  const resetAll = () => setState(buildSeed());

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const value: TripContextValue = {
    state,
    theme,
    toggleTheme,
    currentUserId,
    currentUser,
    setCurrentUser: setCurrentUserId,
    canEdit,
    addItinerary,
    updateItinerary,
    deleteItinerary,
    reorderItinerary,
    addExpense,
    updateExpense,
    deleteExpense,
    settleExpense,
    addGuide,
    updateGuide,
    deleteGuide,
    toggleStar,
    addGuideComment,
    addPacking,
    updatePacking,
    deletePacking,
    addVote,
    castVote,
    closeVote,
    deleteVote,
    addMember,
    updateMember,
    deleteMember,
    updateMeta,
    resetAll,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within TripProvider");
  return ctx;
}
