from fastapi.testclient import TestClient
from app import main

class FakeChain:
    def mint(self, **k): return "0xmint"
    def transfer(self, **k): return "0xxfer"

def setup_function():
    main.store.reset()
    main.chain = FakeChain()

def test_state_empty_then_reset():
    client = TestClient(main.app)
    r = client.get("/state")
    assert r.status_code == 200
    assert r.json()["nodes"] == []
    assert client.post("/reset").status_code == 200

def test_mint_returns_tx_hash():
    client = TestClient(main.app)
    r = client.post("/mint", json={"token_id": 1, "amount": 100, "name": "X", "batch": "B", "expiry": 999})
    assert r.status_code == 200
    assert r.json()["tx"] == "0xmint"
