"use client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { GraphState } from "../lib/useGraph";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

const C = {
  ink: "#0e151c",
  verified: "#33e1c2",
  verifiedDim: "#1c6b5e",
  quarantine: "#ff5a47",
  paper: "#e9f1f3",
  mist: "#7e97a4",
  line: "#21303b",
};

const ROLE_TR: Record<string, string> = {
  manufacturer: "ÜRETİCİ",
  distributor: "DAĞITICI",
  pharmacy: "ECZANE",
  unknown: "DÜĞÜM",
};

export function AIMonitor({ state }: { state: GraphState }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const anyFrozen = state.frozen.length > 0;

  // nodes touching a frozen edge are the quarantined ones
  const frozenNodeIds = useMemo(() => {
    const s = new Set<string>();
    for (const e of state.edges) {
      if (e.frozen) {
        s.add(e.source);
        s.add(e.target);
      }
    }
    return s;
  }, [state.edges]);

  const data = useMemo(
    () => ({
      nodes: state.nodes.map((n) => ({
        id: n.id,
        role: ROLE_TR[n.role] ?? (n.role || "DÜĞÜM").toUpperCase(),
        city: n.city || "—",
        frozen: frozenNodeIds.has(n.id),
      })),
      links: state.edges.map((e) => ({ source: e.source, target: e.target, frozen: e.frozen })),
    }),
    [state.nodes, state.edges, frozenNodeIds]
  );

  const hasGraph = data.nodes.length > 0;

  return (
    <div className={`pg-scope${anyFrozen ? " is-alert" : ""}`}>
      <div className="pg-scope-frame" ref={frameRef}>
        {size.w > 0 && (
          <ForceGraph2D
            graphData={data}
            width={size.w}
            height={size.h}
            backgroundColor={C.ink}
            cooldownTicks={120}
            nodeLabel={(n: any) => `${n.role} · ${n.city}`}
            linkColor={(l: any) => (l.frozen ? C.quarantine : C.verifiedDim)}
            linkWidth={(l: any) => (l.frozen ? 3 : 1)}
            linkDirectionalParticles={(l: any) => (l.frozen ? 0 : 2)}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleColor={() => C.verified}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, scale: number) => {
              if (node.x == null) return;
              const r = 6;
              const color = node.frozen ? C.quarantine : C.verified;
              // halo
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
              ctx.fillStyle = node.frozen ? "rgba(255,90,71,0.16)" : "rgba(51,225,194,0.14)";
              ctx.fill();
              // core
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
              ctx.lineWidth = 1.5 / scale;
              ctx.strokeStyle = C.ink;
              ctx.stroke();
              // labels
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.font = `600 ${10 / scale}px 'IBM Plex Mono', monospace`;
              ctx.fillStyle = C.paper;
              ctx.fillText(node.city, node.x, node.y + r + 3 / scale);
              ctx.font = `${8 / scale}px 'IBM Plex Mono', monospace`;
              ctx.fillStyle = node.frozen ? C.quarantine : C.mist;
              ctx.fillText(node.role, node.x, node.y + r + 14 / scale);
            }}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              if (node.x == null) return;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 9, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
          />
        )}

        <span className="pg-scope-tl">Ağ Topolojisi · Canlı</span>
        <span className="pg-scope-tr">
          <i className="pg-dot" />
          {anyFrozen ? "ANOMALİ TESPİT EDİLDİ" : "Gözetim Aktif"}
        </span>

        {!hasGraph && <div className="pg-empty">Sinyal bekleniyor — bir işlem başlatın</div>}

        {anyFrozen && (
          <>
            <div className="pg-scanline" />
            <div className="pg-banner" role="status">
              <b>KARANTİNA</b>
              <span>Klon tespit edildi · zincir üstünde donduruldu</span>
            </div>
          </>
        )}

        <div className="pg-legend">
          <span><i className="ok" /> Doğrulandı</span>
          <span><i className="bad" /> Karantina</span>
        </div>
      </div>
    </div>
  );
}
