const API = process.env.NEXT_PUBLIC_API ?? "http://localhost:8000";

async function post(path: string, body?: unknown) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${path} failed: ${r.status}`);
  return r.json();
}

export const api = {
  mint: (b: { token_id: number; amount: number; name: string; batch: string; expiry: number }) => post("/mint", b),
  transfer: (b: { role: string; to_role: string; token_id: number; amount: number }) => post("/transfer", b),
  reset: () => post("/reset"),
  state: async () => (await fetch(`${API}/state`)).json(),
};

export const WS_URL = API.replace(/^http/, "ws") + "/ws";
