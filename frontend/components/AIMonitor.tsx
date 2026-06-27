"use client";
import dynamic from "next/dynamic";
import { GraphState } from "../lib/useGraph";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export function AIMonitor({ state }: { state: GraphState }) {
  const data = {
    nodes: state.nodes.map((n) => ({ id: n.id, label: `${n.role}\n${n.city}` })),
    links: state.edges.map((e) => ({ source: e.source, target: e.target, frozen: e.frozen })),
  };
  const anyFrozen = state.frozen.length > 0;
  return (
    <div style={{ border: anyFrozen ? "3px solid #e11" : "1px solid #ccc", borderRadius: 8 }}>
      <h2 style={{ padding: 8 }}>AI Monitör {anyFrozen ? "🚨 DONDURULDU" : "🟢 İzleniyor"}</h2>
      <ForceGraph2D
        graphData={data}
        height={420}
        nodeColor={(n: any) => (
          anyFrozen &&
          data.links.some((l: any) =>
            ((l.source.id ?? l.source) === n.id || (l.target.id ?? l.target) === n.id) && l.frozen
          )
          ? "#e11" : "#2a7"
        )}
        linkColor={(l: any) => (l.frozen ? "#e11" : "#999")}
        linkWidth={(l: any) => (l.frozen ? 4 : 1)}
        nodeLabel="label"
      />
    </div>
  );
}
