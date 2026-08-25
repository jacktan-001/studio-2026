import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Crown, Copy, ShieldCheck, ListChecks, Vote, Map as MapIcon, Download, RotateCcw, UserPlus, Wifi } from "lucide-react";
import { useTrip } from "../store";
import { Card, SectionTitle, Badge, Modal, Field, Button, inputCls, Avatar } from "../components/ui";
import { classNames, fmtDate } from "../lib/format";
import type { ID, Role } from "../types";

const QUICK = [
  { to: "/list", label: "出行清单", icon: ListChecks, color: "bg-violet-500" },
  { to: "/vote", label: "投票决策", icon: Vote, color: "bg-rose-500" },
  { to: "/map", label: "地图路线", icon: MapIcon, color: "bg-amber-500" },
];

export default function Members() {
  const { state, currentUser, setCurrentUser, canEdit, addMember, updateMember, deleteMember, resetAll } = useTrip();
  const [addOpen, setAddOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const inviteLink = `https://jacktan-studio.pages.dev/jack-trip?invite=${state.meta.name}-${Date.now().toString(36)}`;

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 1500);
    } catch {
      alert(inviteLink);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jack-trip-${state.meta.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="我的 / 成员管理" subtitle={`${state.members.length} 位同行成员`} />

      {/* Identity switch (demo permissions) */}
      <Card>
        <div className="flex items-center gap-3">
          <Avatar member={currentUser} size={44} />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
              {currentUser.role === "管理员" ? (
                <Crown size={14} className="text-amber-500" />
              ) : (
                <ShieldCheck size={14} className="text-slate-400" />
              )}
            </div>
            <div className="text-xs text-slate-500">{currentUser.responsibility}</div>
          </div>
          <select
            value={currentUserIdValue(currentUser.id)}
            onChange={(e) => setCurrentUser(e.target.value as ID)}
            className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm dark:border-white/10 dark:bg-slate-900/60"
          >
            {state.members.map((m) => (
              <option key={m.id} value={m.id}>
                切换为 {m.name}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-500 dark:bg-white/5">
          演示权限：管理员可改全部；普通成员仅能编辑自己创建的内容。当前以「{currentUser.name}」身份浏览。
        </p>
      </Card>

      {/* Member list */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">成员列表</h2>
          {canEdit() && (
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-1 text-sm font-medium text-brand-600">
              <UserPlus size={15} /> 添加
            </button>
          )}
        </div>
        <div className="space-y-2">
          {state.members.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 !p-3">
              <div className="relative">
                <Avatar member={m} size={40} />
                <span
                  className={classNames(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800",
                    m.online ? "bg-emerald-500" : "bg-slate-300"
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-900 dark:text-white">{m.name}</span>
                  <Badge tone={m.role === "管理员" ? "amber" : "slate"}>{m.role}</Badge>
                </div>
                <div className="truncate text-xs text-slate-500">{m.responsibility} · 加入 {fmtDate(m.joinedAt)}</div>
              </div>
              {m.contact && <span className="text-xs text-slate-400">{m.contact}</span>}
            </Card>
          ))}
        </div>
      </section>

      {/* Invite */}
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <Crown size={16} className="text-brand-500" />
          <span className="font-semibold text-slate-900 dark:text-white">邀请新成员</span>
        </div>
        <p className="mb-2 text-xs text-slate-500">生成邀请链接或二维码，成员扫码即可加入团队。</p>
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-mono leading-tight text-emerald-400">
            ▦ QR<br />CODE
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-500 dark:bg-white/5">{inviteLink}</div>
            <Button variant="outline" className="mt-2" onClick={copyInvite}>
              <Copy size={14} /> {inviteCopied ? "已复制" : "复制邀请链接"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <section>
        <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-white">其他模块</h2>
        <div className="grid grid-cols-3 gap-3">
          {QUICK.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.to}
                to={q.to}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm active:scale-95 dark:border-white/10 dark:bg-slate-800/60"
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

      {/* Data & settings */}
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <Wifi size={16} className="text-brand-500" />
          <span className="font-semibold text-slate-900 dark:text-white">数据与设置</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJSON}>
            <Download size={14} /> 导出数据 JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm("重置为演示数据？当前修改将丢失。")) resetAll();
            }}
          >
            <RotateCcw size={14} /> 重置演示数据
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">数据保存在本机浏览器（localStorage），可导出为 Excel / PDF（按需求扩展）。</p>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="添加成员">
        <AddMemberForm
          onClose={() => setAddOpen(false)}
          onSubmit={(data) => {
            addMember(data);
            setAddOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

function currentUserIdValue(id: ID) {
  return id;
}

function AddMemberForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: { name: string; avatar: string; color: string; role: Role; responsibility: string; contact: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    avatar: "🙂",
    color: "#0ea5e9",
    role: "普通成员" as Role,
    responsibility: "",
    contact: "",
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return alert("请填写昵称");
        onSubmit(form);
      }}
    >
      <Field label="昵称">
        <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="头像 emoji">
          <input className={inputCls} value={form.avatar} onChange={(e) => set("avatar", e.target.value)} />
        </Field>
        <Field label="角色">
          <select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option>普通成员</option>
            <option>管理员</option>
          </select>
        </Field>
      </div>
      <Field label="负责事项">
        <input className={inputCls} value={form.responsibility} onChange={(e) => set("responsibility", e.target.value)} placeholder="如：交通统筹" />
      </Field>
      <Field label="联系方式">
        <input className={inputCls} value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="微信/手机号" />
      </Field>
      <div className="mt-2 flex gap-2">
        <Button type="submit" className="flex-1">添加成员</Button>
        <Button variant="ghost" onClick={onClose}>取消</Button>
      </div>
    </form>
  );
}
