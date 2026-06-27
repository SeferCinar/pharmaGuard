import { createWalletClient, createPublicClient, http, defineChain, type WalletClient, type PublicClient, type Account, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { PHARMA_ABI } from "./abi";
import { GraphStore, evaluate, FREEZE_THRESHOLD, type TransferRecord } from "./detector";

const ROLE_CITY: Record<string, string> = {
  manufacturer: "Istanbul", distributor: "Ankara", pharmacy_a: "Izmir", pharmacy_b: "Gaziantep",
};
const ROLE_KEY_ENV: Record<string, string> = {
  admin: "ADMIN_PK", oracle: "ORACLE_PK", manufacturer: "MANUFACTURER_PK",
  distributor: "DISTRIBUTOR_PK", pharmacy_a: "PHARMACY_A_PK", pharmacy_b: "PHARMACY_B_PK",
};
const ZERO = "0x0000000000000000000000000000000000000000";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export interface Env {
  CONSOLE: DurableObjectNamespace;
  MONAD_RPC_URL: string;
  MONAD_CHAIN_ID: string;
  CONTRACT_ADDRESS: string;
  ADMIN_PK: string; ORACLE_PK: string; MANUFACTURER_PK: string;
  DISTRIBUTOR_PK: string; PHARMACY_A_PK: string; PHARMACY_B_PK: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const id = env.CONSOLE.idFromName("console");
    return env.CONSOLE.get(id).fetch(req);
  },
};

export class ConsoleDO {
  private store = new GraphStore();
  private env: Env;
  private state: DurableObjectState;
  private chain: Chain;
  private publicClient: PublicClient;
  private accounts: Record<string, Account> = {};
  private wallets: Record<string, WalletClient> = {};
  private contract: `0x${string}`;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.contract = env.CONTRACT_ADDRESS as `0x${string}`;
    this.chain = defineChain({
      id: Number(env.MONAD_CHAIN_ID || "10143"),
      name: "Monad Testnet",
      nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
      rpcUrls: { default: { http: [env.MONAD_RPC_URL] } },
    });
    this.publicClient = createPublicClient({ chain: this.chain, transport: http(env.MONAD_RPC_URL) });
    for (const [role, envKey] of Object.entries(ROLE_KEY_ENV)) {
      const pk = (env as unknown as Record<string, string>)[envKey];
      if (pk) {
        const acct = privateKeyToAccount((pk.startsWith("0x") ? pk : "0x" + pk) as `0x${string}`);
        this.accounts[role] = acct;
        this.wallets[role] = createWalletClient({ account: acct, chain: this.chain, transport: http(env.MONAD_RPC_URL) });
      }
    }
    // restore persisted graph so state survives DO eviction/restarts
    this.state.blockConcurrencyWhile(async () => {
      const saved = await this.state.storage.get<ReturnType<GraphStore["toJSON"]>>("store");
      if (saved) this.store.load(saved);
    });
  }

  private async save() {
    await this.state.storage.put("store", this.store.toJSON());
  }

  private addr(role: string): `0x${string}` {
    return this.accounts[role].address;
  }

  private cities(): Record<string, string> {
    const m: Record<string, string> = {};
    for (const [role, city] of Object.entries(ROLE_CITY)) {
      const a = this.accounts[role];
      if (a) m[a.address.toLowerCase()] = city;
    }
    return m;
  }

  private ingest(from: string, to: string, tokenId: number, amount: number) {
    const city = this.cities()[to.toLowerCase()] ?? "unknown";
    const rec: TransferRecord = { tokenId, from, to, quantity: amount, timestamp: Math.floor(Date.now() / 1000), city };
    this.store.addTransfer(rec);
    return { rec, result: evaluate(this.store, rec) };
  }

  private async broadcast() {
    const msg = JSON.stringify(this.store.snapshot());
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(msg); } catch { /* dropped socket */ }
    }
  }

  private json(obj: unknown, status = 200): Response {
    return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  async fetch(req: Request): Promise<Response> {
    const path = new URL(req.url).pathname;

    if (path === "/ws") {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      pair[1].send(JSON.stringify(this.store.snapshot()));
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (path === "/state") return this.json(this.store.snapshot());

    if (req.method === "POST" && path === "/mint") {
      const b = (await req.json()) as { token_id: number; amount: number; name: string; batch: string; expiry: number };
      const tx = await this.wallets["manufacturer"].writeContract({
        address: this.contract, abi: PHARMA_ABI, functionName: "mintProduct",
        args: [this.addr("manufacturer"), BigInt(b.token_id), BigInt(b.amount), b.name, b.batch, BigInt(b.expiry), "0x"],
        chain: this.chain, account: this.accounts["manufacturer"],
      });
      this.ingest(ZERO, this.addr("manufacturer"), b.token_id, b.amount);
      await this.save();
      await this.broadcast();
      return this.json({ tx });
    }

    if (req.method === "POST" && path === "/transfer") {
      const b = (await req.json()) as { role: string; to_role: string; token_id: number; amount: number };
      const from = this.addr(b.role);
      const to = this.addr(b.to_role);
      // simulate first so a frozen token is rejected cleanly (the contract reverts)
      try {
        await this.publicClient.simulateContract({
          account: this.accounts[b.role], address: this.contract, abi: PHARMA_ABI,
          functionName: "safeTransferItem", args: [from, to, BigInt(b.token_id), BigInt(b.amount), "0x"],
        });
      } catch {
        return this.json({ detail: "Chain rejected: item is frozen (suspected counterfeit)" }, 400);
      }
      const tx = await this.wallets[b.role].writeContract({
        address: this.contract, abi: PHARMA_ABI, functionName: "safeTransferItem",
        args: [from, to, BigInt(b.token_id), BigInt(b.amount), "0x"],
        chain: this.chain, account: this.accounts[b.role],
      });
      const { rec, result } = this.ingest(from, to, b.token_id, b.amount);
      if (result.risk > FREEZE_THRESHOLD && !this.store.isFrozen(rec.tokenId)) {
        this.store.markFrozen(rec.tokenId); // optimistic; contract require(!frozen) handles chain-side idempotency
        try {
          await this.wallets["oracle"].writeContract({
            address: this.contract, abi: PHARMA_ABI, functionName: "flagAndFreezeProduct",
            args: [BigInt(rec.tokenId), result.reasons[0] ?? "Anomali", result.risk],
            chain: this.chain, account: this.accounts["oracle"],
          });
        } catch { /* freeze tx send failed; store stays frozen, chain is authoritative */ }
      }
      await this.save();
      await this.broadcast();
      return this.json({ tx });
    }

    if (req.method === "POST" && path === "/reset") {
      this.store.reset();
      await this.save();
      await this.broadcast();
      return this.json({ ok: true });
    }

    return new Response("not found", { status: 404, headers: CORS });
  }

  // Hibernation API handlers (required when using acceptWebSocket)
  async webSocketMessage(_ws: WebSocket, _msg: string | ArrayBuffer) { /* clients only receive */ }
  async webSocketClose(_ws: WebSocket) { /* no-op */ }
  async webSocketError(_ws: WebSocket) { /* no-op */ }
}
