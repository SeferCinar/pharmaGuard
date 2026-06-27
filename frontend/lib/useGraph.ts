"use client";
import { useEffect, useState } from "react";
import { WS_URL, api } from "./api";

export type GraphState = {
  nodes: { id: string; city: string; role: string }[];
  edges: { source: string; target: string; token_id: number; frozen: boolean }[];
  frozen: number[];
};

const EMPTY: GraphState = { nodes: [], edges: [], frozen: [] };

export function useGraph(): GraphState {
  const [state, setState] = useState<GraphState>(EMPTY);
  useEffect(() => {
    api.state().then(setState).catch(() => {});
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (e) => setState(JSON.parse(e.data));
    return () => ws.close();
  }, []);
  return state;
}
