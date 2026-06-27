"use client";
import { useGraph } from "../lib/useGraph";
import { ConsoleHeader } from "../components/ConsoleHeader";
import { AIMonitor } from "../components/AIMonitor";
import { DemoControls } from "../components/DemoControls";

export default function Home() {
  const state = useGraph();
  const anyFrozen = state.frozen.length > 0;

  return (
    <div className="pg-app">
      <ConsoleHeader anyFrozen={anyFrozen} />

      <div className="pg-console">
        <section className="pg-rail">
          <div className="pg-panel">
            <div className="pg-panel-head">
              <span className="pg-eyebrow">Operasyon Konsolu</span>
              <span className="pg-panel-tag">TOKEN #1</span>
            </div>
            <div className="pg-panel-body">
              <DemoControls />
            </div>
          </div>
        </section>

        <section className="pg-stage">
          <div className="pg-panel" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div className="pg-panel-head">
              <span className="pg-eyebrow">Gözetim · Graf Sinir Ağı</span>
              <span className="pg-panel-tag">PyTorch Geometric</span>
            </div>
            <div className="pg-panel-body" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <AIMonitor state={state} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
