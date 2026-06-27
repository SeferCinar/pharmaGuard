"use client";
import { GraphState } from "../lib/useGraph";

// Simplified Turkey border, projected (equirectangular w/ mid-lat correction) to a
// 1000 x 430 viewBox. Cities below are projected with the SAME transform, so they
// sit at their true geographic positions on the silhouette.
const TR_PATH =
  "M576.8,48.7 L653.9,75.4 L716.4,64.7 L762.6,70.9 L826.0,34.8 L883.2,31.5 L935.0,65.4 L944.1,89.7 L938.9,123.3 L978.8,140.5 L1000.0,160.6 L963.2,180.3 L980.0,259.5 L969.5,280.8 L998.9,336.1 L973.1,347.8 L954.3,330.2 L891.8,321.3 L868.7,332.0 L807.7,342.8 L778.7,341.6 L716.9,367.5 L672.8,367.7 L644.2,354.7 L585.1,373.9 L567.5,360.5 L564.6,399.0 L550.2,414.1 L535.8,429.3 L516.1,398.0 L536.4,372.0 L503.7,377.9 L458.8,362.0 L421.8,401.8 L340.3,409.5 L296.9,372.5 L239.0,370.1 L226.6,398.8 L189.5,407.0 L137.6,370.2 L79.0,371.5 L47.1,302.8 L7.9,264.5 L34.0,210.8 L0.0,177.9 L59.6,111.8 L142.3,109.1 L164.8,56.6 L267.1,65.8 L331.7,21.0 L394.3,1.5 L483.1,0.0 L576.8,48.7 Z";

type IconKind = "factory" | "depot" | "pharmacy";
type Station = { slug: string; x: number; y: number; city: string; role: string; icon: IconKind };

const STATIONS: Station[] = [
  { slug: "istanbul", x: 150.8, y: 71.2, city: "İstanbul", role: "ÜRETİCİ", icon: "factory" },
  { slug: "ankara", x: 359.2, y: 145.4, city: "Ankara", role: "DAĞITICI", icon: "depot" },
  { slug: "izmir", x: 52.2, y: 249.6, city: "İzmir", role: "ECZANE A", icon: "pharmacy" },
  { slug: "gaziantep", x: 602.1, y: 343.3, city: "Gaziantep", role: "ECZANE B", icon: "pharmacy" },
];
const BY_SLUG = Object.fromEntries(STATIONS.map((s) => [s.slug, s]));

function slugFor(city: string | undefined): string | undefined {
  if (!city) return undefined;
  const c = city.toLowerCase();
  if (c.startsWith("ist")) return "istanbul";
  if (c.startsWith("ank")) return "ankara";
  if (c.startsWith("izm") || c.startsWith("İzm")) return "izmir";
  if (c.startsWith("gaz")) return "gaziantep";
  return undefined;
}

// gentle curved route between two stations
function routeD(a: Station, b: Station): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const off = len * 0.13;
  const cx = mx - (dy / len) * off;
  const cy = my + (dx / len) * off;
  return `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
}

function Icon({ kind }: { kind: IconKind }) {
  // drawn within a -8..8 box, centered at station origin
  if (kind === "factory")
    return <path className="pg-station-icon" d="M-7,5 L-7,-1 L-2,2 L-2,-1 L3,2 L3,-3 L7,-3 L7,5 Z" />;
  if (kind === "depot")
    return <path className="pg-station-icon" d="M-7,5 L-7,-2 L0,-6 L7,-2 L7,5 M-3,5 L-3,0 L3,0 L3,5" />;
  return <path className="pg-station-icon" d="M-1,-6 L1,-6 L1,-1 L6,-1 L6,1 L1,1 L1,6 L-1,6 L-1,1 L-6,1 L-6,-1 L-1,-1 Z" />;
}

export function TurkeyMap({ state }: { state: GraphState }) {
  const addrToSlug = new Map<string, string>();
  for (const n of state.nodes) {
    const s = slugFor(n.city);
    if (s) addrToSlug.set(n.id, s);
  }

  const activeSlugs = new Set<string>(addrToSlug.values());

  // build unique routes from edges (skip self/mint loops)
  const routeMap = new Map<string, { from: Station; to: Station; frozen: boolean }>();
  for (const e of state.edges) {
    const fs = addrToSlug.get(e.source);
    const ts = addrToSlug.get(e.target);
    if (!fs || !ts || fs === ts) continue;
    const key = `${fs}->${ts}`;
    const prev = routeMap.get(key);
    routeMap.set(key, { from: BY_SLUG[fs], to: BY_SLUG[ts], frozen: e.frozen || prev?.frozen || false });
  }
  const routes = [...routeMap.values()];

  const frozenSlugs = new Set<string>();
  for (const r of routes) if (r.frozen) {
    frozenSlugs.add(r.from.slug);
    frozenSlugs.add(r.to.slug);
  }

  return (
    <div className="pg-map">
      <svg viewBox="0 0 1000 430" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Türkiye tedarik ağı haritası">
        <defs>
          <linearGradient id="pg-land-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#142029" />
            <stop offset="100%" stopColor="#0d141b" />
          </linearGradient>
        </defs>

        <path className="pg-land" d={TR_PATH} />

        {/* routes */}
        {routes.map((r, i) => {
          const d = routeD(r.from, r.to);
          if (r.frozen) {
            const mx = (r.from.x + r.to.x) / 2;
            const my = (r.from.y + r.to.y) / 2;
            return (
              <g key={i}>
                <path className="pg-route-frozen" d={d} />
                <line className="pg-route-x" x1={mx - 6} y1={my - 6} x2={mx + 6} y2={my + 6} />
                <line className="pg-route-x" x1={mx + 6} y1={my - 6} x2={mx - 6} y2={my + 6} />
              </g>
            );
          }
          return (
            <g key={i}>
              <path className="pg-route-base" d={d} />
              <path className="pg-route-flow" d={d} />
            </g>
          );
        })}

        {/* stations */}
        {STATIONS.map((s) => {
          const frozen = frozenSlugs.has(s.slug);
          const active = activeSlugs.has(s.slug) && !frozen;
          const cls = `pg-station ${frozen ? "is-frozen" : active ? "is-active" : "is-idle"}`;
          const ring = frozen ? "var(--quarantine)" : "var(--verified)";
          return (
            <g className={cls} key={s.slug} transform={`translate(${s.x},${s.y})`}>
              {(active || frozen) && <circle className="pg-station-ping" r="15" fill={ring} opacity="0.4" />}
              <circle className="pg-station-core" r="15" />
              <Icon kind={s.icon} />
              <text className="pg-st-city" y="33">{s.city}</text>
              <text className="pg-st-role" y="46">{s.role}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
