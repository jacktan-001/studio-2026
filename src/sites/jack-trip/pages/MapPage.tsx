import { useMemo, useState } from "react";
import { MapPin, Navigation, ExternalLink, Route } from "lucide-react";
import { useTrip } from "../store";
import { Card, SectionTitle, Badge, EmptyState } from "../components/ui";
import { classNames, fmtDate } from "../lib/format";
import { haversine, etaHours, projectToViewbox, amapRouteUrl, amapUrl, baiduUrl } from "../lib/geo";
import type { ItineraryItem } from "../types";

export default function MapPage() {
  const { state } = useTrip();
  const withCoords = useMemo(
    () => state.itinerary.filter((i) => i.coords),
    [state.itinerary]
  );
  const dateOptions = useMemo(() => {
    const set = new Set(withCoords.map((i) => i.date));
    return [...set].sort();
  }, [withCoords]);

  const [selDate, setSelDate] = useState<string | null>(dateOptions[0] || null);

  const dayItems = useMemo(() => {
    const arr = withCoords
      .filter((i) => i.date === selDate)
      .sort((a, b) => a.order - b.order);
    return arr;
  }, [withCoords, selDate]);

  const points = useMemo(() => dayItems.map((i) => i.coords!), [dayItems]);
  const projected = useMemo(() => projectToViewbox(points), [points]);

  if (withCoords.length === 0) {
    return (
      <div>
        <SectionTitle title="地图路线" subtitle="可视化行程节点与路线规划" />
        <EmptyState icon={<MapPin />} text="行程中暂未标注坐标，去行程页补充地点坐标即可显示" />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle title="地图路线" subtitle="按天查看规划路线 · 一键导出导航" />

      {/* Day chips */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scroll-thin">
        {dateOptions.map((d) => (
          <button
            key={d}
            onClick={() => setSelDate(d)}
            className={classNames(
              "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
              selDate === d ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
            )}
          >
            {fmtDate(d)}
          </button>
        ))}
      </div>

      {/* Map SVG */}
      <Card className="!p-2">
        <svg viewBox="0 0 320 200" className="h-48 w-full rounded-xl bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
          {projected.length > 1 && (
            <polyline
              points={projected.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          )}
          {projected.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="9" fill="#f97316" />
              <text x={p.x} y={p.y + 3.5} fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">
                {idx + 1}
              </text>
            </g>
          ))}
        </svg>
        <div className="mt-1 flex items-center justify-between px-1">
          <span className="text-xs text-slate-500">共 {dayItems.length} 个标注点</span>
          <div className="flex gap-2">
            <a
              href={amapRouteUrl(dayItems.map((i) => ({ ...i.coords!, name: i.title })))}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
            >
              <Navigation size={12} /> 高德导航
            </a>
            <a
              href={dayItems[0] ? baiduUrl(dayItems[0].coords!, dayItems[0].title) : "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
            >
              <ExternalLink size={12} /> 百度地图
            </a>
          </div>
        </div>
      </Card>

      {/* Node list with distance */}
      <div className="mt-4 space-y-2">
        {dayItems.map((it, idx) => {
          const next = dayItems[idx + 1];
          const dist = next?.coords ? haversine(it.coords!, next.coords) : null;
          return (
            <Card key={it.id} className="!p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900 dark:text-white">{it.title}</div>
                  <div className="truncate text-xs text-slate-500">{it.locationName}</div>
                </div>
                <a
                  href={amapUrl(it.coords!, it.title)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600"
                  title="在高德中打开"
                >
                  <MapPin size={16} />
                </a>
              </div>
              {dist !== null && (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-500 dark:bg-white/5">
                  <Route size={12} /> 距下一站约 {dist} km · 预计 {etaHours(dist)} 小时
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-400">
        导出链接基于公开地图服务；精确路线请在地图 App 中查看
      </p>
    </div>
  );
}
