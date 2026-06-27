"use client";

export function ConsoleHeader({ anyFrozen }: { anyFrozen: boolean }) {
  return (
    <header className={`pg-header${anyFrozen ? " is-alert" : ""}`}>
      <div className="pg-brand">
        <div className="pg-mark" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          <div className="pg-brand-name">PHARMA<b>GUARD</b> GNN</div>
          <div className="pg-brand-sub">Anti-Counterfeit · Supply Chain Console</div>
        </div>
      </div>

      <div className="pg-readout">
        <div className="pg-stat">
          <span className="pg-stat-k">System</span>
          <span className="pg-stat-v">
            <i className="pg-dot" />
            {anyFrozen ? "QUARANTINE" : "MONITORING"}
          </span>
        </div>
        <div className="pg-stat">
          <span className="pg-stat-k">Chain</span>
          <span className="pg-stat-v">Monad Testnet</span>
        </div>
        <div className="pg-stat">
          <span className="pg-stat-k">Model</span>
          <span className="pg-stat-v">GNN · Fork</span>
        </div>
        <div className="pg-threat">
          <span className="pg-stat-k">Threat Level</span>
          <span className="pg-threat-bars" aria-hidden>
            <i style={anyFrozen ? undefined : { background: "var(--verified)" }} />
            <i />
            <i />
          </span>
          <span className="pg-threat-label">{anyFrozen ? "CRITICAL" : "LOW"}</span>
        </div>
      </div>
    </header>
  );
}
