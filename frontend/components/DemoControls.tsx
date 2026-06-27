"use client";
import { useState } from "react";
import { api } from "../lib/api";

const TID = 1;

type Op = {
  id: number;
  num: string;
  label: string;
  sub: string;
  cell?: { name: string; loc: string };
  clone?: boolean;
  run: () => Promise<{ tx?: string }>;
};

const OPS: Op[] = [
  {
    id: 1, num: "01", label: "Produce drug", sub: "Manufacturer · Mint",
    cell: { name: "Production", loc: "İstanbul" },
    run: () => api.mint({ token_id: TID, amount: 100, name: "Cancer Drug X", batch: "B1", expiry: 2000000000 }),
  },
  {
    id: 2, num: "02", label: "Manufacturer → Distributor", sub: "Transfer · 50 units",
    cell: { name: "Distributor", loc: "Ankara" },
    run: () => api.transfer({ role: "manufacturer", to_role: "distributor", token_id: TID, amount: 50 }),
  },
  {
    id: 3, num: "03", label: "Distributor → Pharmacy A", sub: "Transfer · 20 units",
    cell: { name: "Pharmacy A", loc: "İzmir" },
    run: () => api.transfer({ role: "distributor", to_role: "pharmacy_a", token_id: TID, amount: 20 }),
  },
  {
    id: 4, num: "04", label: "Clone: Manufacturer → Pharmacy B", sub: "Fork from stale holder", clone: true,
    cell: { name: "Pharmacy B", loc: "Gaziantep" },
    run: () => api.transfer({ role: "manufacturer", to_role: "pharmacy_b", token_id: TID, amount: 20 }),
  },
  {
    id: 5, num: "05", label: "Try to move frozen item", sub: "Chain must reject (revert)",
    run: () => api.transfer({ role: "pharmacy_b", to_role: "pharmacy_a", token_id: TID, amount: 5 }),
  },
];

const CELLS = OPS.filter((o) => o.cell);

export function DemoControls() {
  const [log, setLog] = useState<{ msg: string; error: boolean }[]>([]);
  const [done, setDone] = useState<Set<number>>(new Set());

  const run = (op: Op) => async () => {
    try {
      const r = await op.run();
      setLog((l) => [{ msg: `${op.num} ${op.label} → ${r.tx ?? "ok"}`, error: false }, ...l]);
      setDone((d) => new Set(d).add(op.id));
    } catch (e: any) {
      setLog((l) => [{ msg: `${op.num} ${op.label} → ${e.message}`, error: true }, ...l]);
      setDone((d) => new Set(d).add(op.id));
    }
  };

  const reset = async () => {
    try {
      await api.reset();
    } catch {
      /* reset is best-effort; clearing local state matters most for the demo */
    }
    setDone(new Set());
    setLog([{ msg: "Console reset", error: false }]);
  };

  return (
    <>
      {/* signature: chain-of-custody blister strip */}
      <div className="pg-custody" aria-label="Chain of custody">
        {CELLS.map((op) => {
          const isDone = done.has(op.id);
          const state = isDone ? (op.clone ? "is-void" : "is-filled") : "";
          return (
            <div className={`pg-cell ${state}`} key={op.id}>
              <div className="pg-cell-dome">
                {op.clone && isDone && <span className="pg-cell-stamp">VOID</span>}
                {op.clone && isDone ? (
                  <CrossIcon />
                ) : isDone ? (
                  <CheckIcon />
                ) : (
                  <PillIcon />
                )}
              </div>
              <span className="pg-cell-loc">
                {op.cell!.name}
                <br />
                {op.cell!.loc}
              </span>
            </div>
          );
        })}
      </div>

      {/* operations */}
      <div className="pg-ops">
        {OPS.map((op) => {
          const cls = ["pg-op"];
          if (op.clone) cls.push("is-clone");
          else if (done.has(op.id)) cls.push("is-done");
          return (
            <button className={cls.join(" ")} key={op.id} onClick={run(op)}>
              <span className="pg-op-num">{op.num}</span>
              <span className="pg-op-main">
                <span className="pg-op-label">{op.label}</span>
                <span className="pg-op-sub">{op.sub}</span>
              </span>
              <span className="pg-op-go">{op.clone ? "⚠" : done.has(op.id) ? "✓" : "→"}</span>
            </button>
          );
        })}
        <button className="pg-op pg-op-reset" onClick={reset}>
          Reset demo
        </button>
      </div>

      {/* telemetry */}
      <div style={{ marginTop: 16 }}>
        <div className="pg-eyebrow" style={{ marginBottom: 8 }}>Telemetry Feed</div>
        <div className="pg-log">
          {log.length === 0 ? (
            <div className="pg-log-empty">Awaiting action…</div>
          ) : (
            log.map((l, i) => (
              <div className={`pg-log-line${l.error ? " is-error" : ""}`} key={i}>
                {l.msg}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function PillIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <line x1="12" y1="9" x2="12" y2="15" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}
function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
