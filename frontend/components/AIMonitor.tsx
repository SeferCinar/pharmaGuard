"use client";
import { GraphState } from "../lib/useGraph";
import { TurkeyMap } from "./TurkeyMap";

export function AIMonitor({ state }: { state: GraphState }) {
  const anyFrozen = state.frozen.length > 0;

  return (
    <div className={`pg-scope${anyFrozen ? " is-alert" : ""}`}>
      <div className="pg-scope-frame">
        <TurkeyMap state={state} />

        <span className="pg-scope-tl">Türkiye · Tedarik Ağı · Canlı</span>
        <span className="pg-scope-tr">
          <i className="pg-dot" />
          {anyFrozen ? "ANOMALİ TESPİT EDİLDİ" : "Gözetim Aktif"}
        </span>

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
