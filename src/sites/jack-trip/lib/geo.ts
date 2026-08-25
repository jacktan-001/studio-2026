// 地图与距离工具

/** Haversine 距离（公里） */
export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/** 预计通行时间（小时），按平均速度 40km/h（城市混合）估算 */
export function etaHours(km: number, speed = 40): number {
  return Math.round((km / speed) * 10) / 10;
}

/** 高德地图路线/坐标导航链接 */
export function amapUrl(p: { lat: number; lng: number }, name?: string): string {
  const q = name ? encodeURIComponent(name) : "";
  return `https://uri.amap.com/marker?position=${p.lng},${p.lat}&name=${q}&src=jacktrip&coordinate=gaode&callnative=1`;
}

/** 百度地图坐标导航链接（bd09 近似用经纬度直传） */
export function baiduUrl(p: { lat: number; lng: number }, name?: string): string {
  const q = name ? encodeURIComponent(name) : "";
  return `https://api.map.baidu.com/marker?location=${p.lat},${p.lng}&title=${q}&content=${q}&output=html&coord_type=gcj02&src=jacktrip`;
}

/** 将一组坐标点生成高德"沿途"搜索链接（示例：以首点为起点） */
export function amapRouteUrl(points: { lat: number; lng: number; name?: string }[]): string {
  if (points.length === 0) return "https://www.amap.com/";
  const first = points[0];
  const q = first.name ? encodeURIComponent(first.name) : "目的地";
  return `https://uri.amap.com/navigation?to=${first.lng},${first.lat},${q}&mode=car&src=jacktrip&coordinate=gaode&callnative=1`;
}

/** 轻量 SVG 路线示意图：把经纬度归一化到 viewBox，按 order 连线 */
export function projectToViewbox(
  points: { lat: number; lng: number }[],
  w = 320,
  h = 200,
  pad = 24
) {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  return points.map((p) => ({
    x: pad + ((p.lng - minLng) / spanLng) * (w - pad * 2),
    // 纬度反向（北在上）
    y: pad + ((maxLat - p.lat) / spanLat) * (h - pad * 2),
  }));
}
