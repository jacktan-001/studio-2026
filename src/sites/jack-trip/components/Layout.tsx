import { NavLink, useNavigate } from "react-router-dom";
import { Plane, MapPinned, Wallet, BookMarked, Users, Sun, Moon, ChevronDown } from "lucide-react";
import { useTrip } from "../store";
import { classNames } from "../lib/format";

const TABS = [
  { to: "/", label: "首页", icon: Plane },
  { to: "/trip", label: "行程", icon: MapPinned },
  { to: "/expense", label: "记账", icon: Wallet },
  { to: "/guide", label: "攻略", icon: BookMarked },
  { to: "/members", label: "我的", icon: Users },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state, theme, toggleTheme, currentUser } = useTrip();
  const navigate = useNavigate();

  return (
    <div className="app-bg flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <Plane size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                Jack Trip
              </span>
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                多人旅行协作
              </span>
            </div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">
              {state.meta.name} · {state.meta.destination}
            </div>
          </div>
          <button
            onClick={() => navigate("/members")}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300"
          >
            <span className="max-w-[3.5rem] truncate">{currentUser.name}</span>
            <ChevronDown size={12} />
          </button>
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20"
            aria-label="切换主题"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/60 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pb-safe pt-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === "/"}
                className={({ isActive }) =>
                  classNames(
                    "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition",
                    isActive
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={21} className={isActive ? "scale-110 transition" : ""} />
                    {t.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
