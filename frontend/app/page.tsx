"use client";
import { useGraph } from "../lib/useGraph";
import { AIMonitor } from "../components/AIMonitor";
import { DemoControls } from "../components/DemoControls";

export default function Home() {
  const state = useGraph();
  return (
    <main style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, padding: 24 }}>
      <section>
        <h1>PharmaGuard GNN</h1>
        <DemoControls />
      </section>
      <section>
        <AIMonitor state={state} />
      </section>
    </main>
  );
}
