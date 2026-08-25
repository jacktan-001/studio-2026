import { useMemo, useState } from "react";
import { Plus, Trash2, Vote as VoteIcon, BarChart3, EyeOff, Check, Star } from "lucide-react";
import { useTrip } from "../store";
import { Card, SectionTitle, Badge, FAB, Modal, Field, Button, inputCls, EmptyState, Avatar } from "../components/ui";
import { classNames, fmtDate } from "../lib/format";
import type { ID, Vote, VoteType } from "../types";

export default function VotePage() {
  const { state, addVote, castVote, closeVote, deleteVote, canEdit, currentUserId, currentUser } = useTrip();
  const [open, setOpen] = useState(false);

  const memberOf = (id: ID) => state.members.find((m) => m.id === id);

  return (
    <div>
      <SectionTitle title="投票决策" subtitle="选餐厅 / 选活动 / 选时间，一键统计结果" />
      {state.votes.length === 0 ? (
        <EmptyState icon={<VoteIcon />} text="还没有投票，点右下角发起一个" />
      ) : (
        <div className="space-y-3">
          {state.votes.map((v) => (
            <VoteCard
              key={v.id}
              vote={v}
              currentUserId={currentUserId}
              canEdit={canEdit(v.createdBy)}
              onCast={(cast) => castVote(v.id, cast)}
              onClose={() => closeVote(v.id)}
              onDelete={() => deleteVote(v.id)}
              memberOf={memberOf}
            />
          ))}
        </div>
      )}
      <FAB onClick={() => setOpen(true)} icon={<Plus size={24} />} label="发起投票" />
      <Modal open={open} onClose={() => setOpen(false)} title="发起投票">
        <CreateVoteForm
          onClose={() => setOpen(false)}
          onSubmit={(data) => {
            addVote(data);
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

function VoteCard({
  vote,
  currentUserId,
  canEdit,
  onCast,
  onClose,
  onDelete,
  memberOf,
}: {
  vote: Vote;
  currentUserId: ID;
  canEdit: boolean;
  onCast: (cast: { memberId: ID; optionIds: ID[]; score?: number }) => void;
  onClose: () => void;
  onDelete: () => void;
  memberOf: (id: ID) => any;
}) {
  const myCast = vote.votes.find((c) => c.memberId === currentUserId);
  const [picked, setPicked] = useState<ID[]>(myCast?.optionIds || []);
  const [score, setScore] = useState<number>(myCast?.score || 5);

  const counts = useMemo(() => {
    const c: Record<ID, number> = {};
    vote.options.forEach((o) => (c[o.id] = 0));
    vote.votes.forEach((v) => v.optionIds.forEach((id) => (c[id] = (c[id] || 0) + 1)));
    return c;
  }, [vote]);
  const totalVotes = vote.votes.length;

  const toggle = (id: ID) => {
    if (vote.type === "单选") {
      setPicked([id]);
      onCast({ memberId: currentUserId, optionIds: [id] });
    } else if (vote.type === "多选") {
      setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    } else {
      setScore(Number(id));
      onCast({ memberId: currentUserId, optionIds: [], score: Number(id) });
    }
  };

  const submitMulti = () => onCast({ memberId: currentUserId, optionIds: picked });

  return (
    <Card className="animate-pop">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white">{vote.title}</span>
            <Badge tone="rose">{vote.type}</Badge>
            {vote.anonymous && (
              <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                <EyeOff size={11} /> 匿名
              </span>
            )}
            {vote.closed && <Badge tone="slate">已结束</Badge>}
          </div>
          <div className="text-xs text-slate-500">
            {totalVotes} 人参与{vote.deadline ? ` · 截止 ${fmtDate(vote.deadline)}` : ""}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-1">
            {!vote.closed && (
              <button onClick={onClose} className="text-xs text-slate-400 hover:text-brand-600">结束</button>
            )}
            <button onClick={onDelete} className="text-slate-400 hover:text-rose-500">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {vote.type === "评分" ? (
        <div className="flex items-center gap-1 py-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => toggle(String(n))} className={classNames("text-3xl", n <= score ? "text-amber-400" : "text-slate-300")}>
              ★
            </button>
          ))}
          <span className="ml-2 text-sm text-slate-500">我的评分 {score}</span>
        </div>
      ) : (
        <div className="space-y-2">
          {vote.options.map((o) => {
            const cnt = counts[o.id] || 0;
            const pct = totalVotes ? Math.round((cnt / totalVotes) * 100) : 0;
            const isPicked = picked.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                disabled={vote.closed}
                className={classNames(
                  "relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm transition",
                  isPicked
                    ? "border-brand-400 bg-brand-50 dark:bg-brand-500/10"
                    : "border-slate-200 dark:border-white/10"
                )}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-brand-100/60 dark:bg-brand-500/15"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                    {isPicked && <Check size={14} className="text-brand-600" />}
                    {o.label}
                  </span>
                  <span className="text-xs text-slate-500">{cnt} 票 · {pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {vote.type === "多选" && !vote.closed && (
        <Button className="mt-2 w-full" onClick={submitMulti}>提交我的选择</Button>
      )}

      {!vote.anonymous && totalVotes > 0 && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-white/10">
          <span className="text-[11px] text-slate-400">已投：</span>
          <div className="flex -space-x-1.5">
            {vote.votes.map((c) => {
              const m = memberOf(c.memberId);
              return m ? <Avatar key={c.memberId} member={m} size={22} /> : null;
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function CreateVoteForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: Omit<Vote, "id" | "createdAt" | "votes">) => void;
  onClose: () => void;
}) {
  const { state } = useTrip();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<VoteType>("单选");
  const [anonymous, setAnonymous] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);

  const setOpt = (i: number, v: string) =>
    setOptions((o) => o.map((x, idx) => (idx === i ? v : x)));
  const addOpt = () => setOptions((o) => [...o, ""]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return alert("请填写投票标题");
        const opts = options.map((o, i) => o.trim()).filter(Boolean);
        if (opts.length < 2) return alert("请至少填写 2 个选项");
        onSubmit({
          title: title.trim(),
          type,
          anonymous,
          options: opts.map((label, i) => ({ id: `o${i}`, label })),
          createdBy: state.members[0].id,
        });
      }}
    >
      <Field label="投票标题">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：今晚晚餐选哪家？" />
      </Field>
      <Field label="投票类型">
        <div className="flex gap-2">
          {(["单选", "多选", "评分"] as VoteType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={classNames(
                "flex-1 rounded-xl py-2 text-sm font-medium",
                type === t ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </Field>
      {type !== "评分" && (
        <Field label="选项">
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={inputCls} value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`选项 ${i + 1}`} />
                {options.length > 2 && (
                  <button type="button" onClick={() => setOptions((arr) => arr.filter((_, idx) => idx !== i))} className="text-slate-400">
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addOpt} className="text-sm font-medium text-brand-600">
              + 添加选项
            </button>
          </div>
        </Field>
      )}
      <label className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm dark:bg-white/5">
        <span>匿名投票</span>
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
      </label>
      <div className="mt-2 flex gap-2">
        <Button type="submit" className="flex-1">发起投票</Button>
        <Button variant="ghost" onClick={onClose}>取消</Button>
      </div>
    </form>
  );
}
