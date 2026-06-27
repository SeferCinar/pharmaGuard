"use client";
import { GraphState } from "../lib/useGraph";
import { TurkeyMap } from "./TurkeyMap";

export function AIMonitor({ state }: { state: GraphState }) {
  const anyFrozen = state.frozen.length > 0;

  return (
    <div className={`pg-scope${anyFrozen ? " is-alert" : ""}`}>
      <div className="pg-scope-frame">
        <TurkeyMap state={state} />

        <span className="pg-scope-tl">Turkey · Supply Network · Live</span>
        <span className="pg-scope-tr">
          <i className="pg-dot" />
          {anyFrozen ? "ANOMALY DETECTED" : "Surveillance Active"}
        </span>

        {anyFrozen && (
          <>
            <div className="pg-scanline" />
            <div className="pg-banner" role="status">
              <b>QUARANTINE</b>
              <span>Clone detected · frozen on-chain</span>
            </div>
          </>
        )}

        <div className="pg-legend">
          <span><i className="ok" /> Verified</span>
          <span><i className="bad" /> Quarantined</span>
        </div>
      </div>
    </div>
  );
}
