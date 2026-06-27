from dataclasses import dataclass
import networkx as nx

@dataclass
class TransferRecord:
    token_id: int
    from_addr: str
    to_addr: str
    quantity: int
    timestamp: int
    city: str

class GraphStore:
    def __init__(self):
        self._g = nx.DiGraph()
        self._history: dict[int, list[TransferRecord]] = {}
        self._frozen: set[int] = set()

    def add_actor(self, address: str, role: str, city: str):
        self._g.add_node(address.lower(), role=role, city=city)

    def add_transfer(self, rec: TransferRecord):
        for addr in (rec.from_addr, rec.to_addr):
            if addr and addr.lower() not in self._g:
                self._g.add_node(addr.lower(), role="unknown", city=rec.city)
        if rec.from_addr:
            self._g.add_edge(rec.from_addr.lower(), rec.to_addr.lower(), token_id=rec.token_id)
        self._history.setdefault(rec.token_id, []).append(rec)

    def get_token_history(self, token_id: int) -> list[TransferRecord]:
        return self._history.get(token_id, [])

    def mark_frozen(self, token_id: int):
        self._frozen.add(token_id)

    def is_frozen(self, token_id: int) -> bool:
        return token_id in self._frozen

    def snapshot(self) -> dict:
        nodes = [{"id": n, "city": d.get("city"), "role": d.get("role")} for n, d in self._g.nodes(data=True)]
        edges = [{"source": u, "target": v, "token_id": d.get("token_id"),
                  "frozen": d.get("token_id") in self._frozen} for u, v, d in self._g.edges(data=True)]
        return {"nodes": nodes, "edges": edges, "frozen": sorted(self._frozen)}

    def reset(self):
        self._g.clear()
        self._history.clear()
        self._frozen.clear()

    def to_pyg(self):  # GNN representation seam; not on the live path
        from torch_geometric.utils import from_networkx
        return from_networkx(self._g)
