"use client";
import { useState } from "react";
import { api } from "../lib/api";

export function DemoControls() {
  const [log, setLog] = useState<string[]>([]);
  const add = (m: string) => setLog((l) => [m, ...l]);
  const wrap = (label: string, fn: () => Promise<any>) => async () => {
    try { const r = await fn(); add(`${label}: ${r.tx ?? "ok"}`); }
    catch (e: any) { add(`${label} HATA: ${e.message}`); }
  };

  const TID = 1;
  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 360 }}>
      <button onClick={wrap("Üretim (Mint)", () => api.mint({ token_id: TID, amount: 100, name: "Kanser İlacı X", batch: "B1", expiry: 2000000000 }))}>
        1) Üretici: İlaç üret
      </button>
      <button onClick={wrap("Dağıtıcıya transfer", () => api.transfer({ role: "manufacturer", to_role: "distributor", token_id: TID, amount: 50 }))}>
        2) Üretici → Dağıtıcı
      </button>
      <button onClick={wrap("Eczane A'ya transfer", () => api.transfer({ role: "distributor", to_role: "pharmacy_a", token_id: TID, amount: 20 }))}>
        3) Dağıtıcı → Eczane A
      </button>
      <button style={{ background: "#fdd" }} onClick={wrap("KLON transferi", () => api.transfer({ role: "manufacturer", to_role: "pharmacy_b", token_id: TID, amount: 20 }))}>
        4) 🚨 Klon: Üretici → Eczane B (farklı şehir)
      </button>
      <button onClick={wrap("Dondurulan ürünü transfer dene", () => api.transfer({ role: "pharmacy_b", to_role: "pharmacy_a", token_id: TID, amount: 5 }))}>
        5) Dondurulan ürünü taşımayı dene (revert beklenir)
      </button>
      <button onClick={wrap("Sıfırla", () => api.reset())}>Demoyu sıfırla</button>
      <pre style={{ fontSize: 12, maxHeight: 160, overflow: "auto" }}>{log.join("\n")}</pre>
    </div>
  );
}
