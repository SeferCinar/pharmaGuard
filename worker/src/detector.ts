// Graph store + stale-holder fork detector (TypeScript port of the Python backend).

export type TransferRecord = {
  tokenId: number;
  from: string;
  to: string;
  quantity: number;
  timestamp: number;
  city: string;
};

export const FREEZE_THRESHOLD = 75; // MUST match contract require(riskScore > 75)

export class GraphStore {
  private nodes = new Map<string, { city: string; role: string }>();
  private edges: { source: string; target: string; tokenId: number }[] = [];
  private history = new Map<number, TransferRecord[]>();
  private frozen = new Set<number>();

  addTransfer(rec: TransferRecord) {
    for (const a of [rec.from, rec.to]) {
      if (a && !this.nodes.has(a.toLowerCase())) {
        this.nodes.set(a.toLowerCase(), { city: rec.city, role: "unknown" });
      }
    }
    if (rec.from) {
      this.edges.push({ source: rec.from.toLowerCase(), target: rec.to.toLowerCase(), tokenId: rec.tokenId });
    }
    const h = this.history.get(rec.tokenId) ?? [];
    h.push(rec);
    this.history.set(rec.tokenId, h);
  }

  getHistory(tokenId: number): TransferRecord[] {
    return this.history.get(tokenId) ?? [];
  }

  markFrozen(tokenId: number) { this.frozen.add(tokenId); }
  isFrozen(tokenId: number): boolean { return this.frozen.has(tokenId); }
  reset() { this.nodes.clear(); this.edges = []; this.history.clear(); this.frozen.clear(); }

  // (de)serialize for Durable Object storage so state survives eviction
  toJSON() {
    return {
      nodes: [...this.nodes.entries()],
      edges: this.edges,
      history: [...this.history.entries()],
      frozen: [...this.frozen],
    };
  }
  load(d: ReturnType<GraphStore["toJSON"]> | undefined) {
    if (!d) return;
    this.nodes = new Map(d.nodes);
    this.edges = d.edges;
    this.history = new Map(d.history.map(([k, v]) => [Number(k), v]));
    this.frozen = new Set(d.frozen);
  }

  snapshot() {
    return {
      nodes: [...this.nodes].map(([id, d]) => ({ id, city: d.city, role: d.role })),
      edges: this.edges.map((e) => ({
        source: e.source, target: e.target, token_id: e.tokenId, frozen: this.frozen.has(e.tokenId),
      })),
      frozen: [...this.frozen].sort((a, b) => a - b),
    };
  }
}

// Flags a transfer that originates from an address which has already shipped the
// token onward — the token would be in two places at once (clone / double-spend).
export function impossibleSpeedRule(store: GraphStore, rec: TransferRecord): { risk: number; reason: string | null } {
  const history = store.getHistory(rec.tokenId);
  const prior = history.slice(0, -1); // transfers before the current one
  if (prior.length === 0) return { risk: 0, reason: null }; // mint / first event
  const expectedHolder = prior[prior.length - 1].to.toLowerCase();
  if (rec.from && rec.from.toLowerCase() !== expectedHolder) {
    const heldCity = prior[prior.length - 1].city;
    return {
      risk: 90,
      reason: `Impossible location: token ${rec.tokenId} is legitimately held in ${heldCity} but a transfer originated from ${rec.city} (${rec.from}) - clone/double-spend suspected.`,
    };
  }
  return { risk: 0, reason: null };
}

export function evaluate(store: GraphStore, rec: TransferRecord): { risk: number; reasons: string[] } {
  const { risk, reason } = impossibleSpeedRule(store, rec);
  return { risk, reasons: reason ? [reason] : [] };
}
