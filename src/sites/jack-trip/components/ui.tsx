import React, { useEffect } from "react";
import { classNames } from "../lib/format";

// ---------- Card ----------
export function Card({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={classNames(
        "rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/60",
        onClick && "active:scale-[0.99] transition cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------- SectionTitle ----------
export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

// ---------- Badge ----------
export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: "slate" | "brand" | "green" | "amber" | "red" | "blue" | "violet" | "rose";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    blue: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  };
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ---------- Avatar ----------
export function Avatar({
  member,
  size = 36,
}: {
  member: { name: string; avatar: string; color: string };
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: member.color,
        fontSize: size * 0.42,
      }}
      title={member.name}
    >
      {member.avatar || member.name.slice(0, 1)}
    </div>
  );
}

// ---------- Segmented ----------
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-white/10">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={classNames(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition",
            value === o.value
              ? "bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-300"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- FAB ----------
export function FAB({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition active:scale-95 hover:bg-brand-600"
      aria-label={label || "添加"}
    >
      {icon}
    </button>
  );
}

// ---------- Field ----------
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-slate-900/60 dark:text-white dark:focus:ring-brand-500/20";

// ---------- Modal (bottom sheet on mobile) ----------
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 animate-fade" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-2xl animate-slide-up dark:bg-slate-900 sm:max-w-md sm:rounded-3xl scroll-thin">
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ---------- EmptyState ----------
export function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-slate-400">
      <div className="text-4xl opacity-60">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ---------- Stat ----------
export function Stat({
  label,
  value,
  sub,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "brand" | "green" | "amber" | "violet";
}) {
  const toneCls: Record<string, string> = {
    brand: "text-brand-600 dark:text-brand-400",
    green: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
  };
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-slate-800/60">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={classNames("mt-1 text-xl font-bold", toneCls[tone])}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

// ---------- ProgressBar ----------
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={classNames("h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10", className)}>
      <div
        className="h-full rounded-full bg-brand-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ---------- Button ----------
export function Button({
  children,
  onClick,
  variant = "brand",
  className,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "brand" | "ghost" | "outline";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const v: Record<string, string> = {
    brand: "bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200",
    outline:
      "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
        v[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
