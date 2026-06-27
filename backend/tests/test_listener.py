from app.graph_store import GraphStore
from app.detector import Detector, impossible_speed_rule
from app.listener import handle_transfer_event

class FakeChain:
    def __init__(self): self.frozen = []
    def freeze(self, token_id, reason, risk): self.frozen.append((token_id, reason, risk)); return "0xh"

def args(tid, frm, to, qty, ts):
    return {"tokenId": tid, "from": frm, "to": to, "quantity": qty, "timestamp": ts}

def test_handler_freezes_on_clone_and_marks_store():
    store = GraphStore()
    det = Detector(); det.register(impossible_speed_rule)
    chain = FakeChain()
    cities = {"0xa": "Izmir", "0xb": "Gaziantep"}
    updates = []
    # legit first hop
    handle_transfer_event(store, det, chain, cities, args(1, "0xm", "0xa", 10, 1000), updates.append)
    assert chain.frozen == []
    # clone hop -> different city within window
    handle_transfer_event(store, det, chain, cities, args(1, "0xm", "0xb", 10, 1500), updates.append)
    assert chain.frozen and chain.frozen[0][0] == 1
    assert chain.frozen[0][2] == 90
    assert store.is_frozen(1) is True
    assert len(updates) == 2

def test_handler_does_not_double_freeze():
    store = GraphStore()
    det = Detector(); det.register(impossible_speed_rule)
    chain = FakeChain()
    cities = {"0xa": "Izmir", "0xb": "Gaziantep"}
    handle_transfer_event(store, det, chain, cities, args(1, "0xm", "0xa", 10, 1000), lambda s: None)
    handle_transfer_event(store, det, chain, cities, args(1, "0xm", "0xb", 10, 1500), lambda s: None)
    handle_transfer_event(store, det, chain, cities, args(1, "0xm", "0xb", 10, 1600), lambda s: None)
    assert len(chain.frozen) == 1  # only frozen once

def test_full_demo_scenario_honest_then_clone():
    store = GraphStore()
    det = Detector(); det.register(impossible_speed_rule)
    chain = FakeChain()
    cities = {"0xmfr": "Istanbul", "0xdist": "Ankara", "0xpha": "Izmir", "0xphb": "Gaziantep"}
    # honest inter-city chain: mint -> mfr, mfr -> dist, dist -> pharmA
    handle_transfer_event(store, det, chain, cities, args(1, "0x0", "0xmfr", 100, 1000), lambda s: None)
    handle_transfer_event(store, det, chain, cities, args(1, "0xmfr", "0xdist", 50, 1005), lambda s: None)
    handle_transfer_event(store, det, chain, cities, args(1, "0xdist", "0xpha", 20, 1010), lambda s: None)
    assert chain.frozen == []  # no honest hop ever flags
    # clone fork: stale holder mfr ships again while pharmA legitimately holds the token
    handle_transfer_event(store, det, chain, cities, args(1, "0xmfr", "0xphb", 20, 1015), lambda s: None)
    assert len(chain.frozen) == 1
    assert chain.frozen[0][0] == 1
    assert chain.frozen[0][2] == 90
    assert store.is_frozen(1) is True
