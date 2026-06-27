from fastapi.testclient import TestClient
from web3.exceptions import ContractLogicError
from app import main

class FakeChain:
    def mint(self, **k): return "0xmint"
    def transfer(self, **k): return "0xxfer"
    def address(self, role): return "0x" + role
    def freeze(self, *a, **k): return "0xfreeze"

class FrozenChain(FakeChain):
    def transfer(self, **k): raise ContractLogicError("execution reverted")

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

def test_transfer_of_frozen_token_returns_clean_error():
    main.chain = FrozenChain()
    client = TestClient(main.app)
    r = client.post("/transfer", json={"role": "pharmacy_b", "to_role": "pharmacy_a", "token_id": 1, "amount": 5})
    assert r.status_code == 400
    assert "frozen" in r.json()["detail"]
