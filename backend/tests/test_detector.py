from app.graph_store import GraphStore, TransferRecord
from app.detector import Detector, impossible_speed_rule, FREEZE_THRESHOLD

def test_impossible_speed_flags_clone():
    s = GraphStore()
    s.add_transfer(TransferRecord(1, "0xm", "0xa", 10, 1000, "Izmir"))
    rec2 = TransferRecord(1, "0xm", "0xb", 10, 1500, "Gaziantep")  # 500s later, different city
    s.add_transfer(rec2)
    risk, reason = impossible_speed_rule(s, rec2)
    assert risk == 90
    assert reason is not None

def test_impossible_speed_ignores_same_city():
    s = GraphStore()
    s.add_transfer(TransferRecord(1, "0xm", "0xa", 10, 1000, "Izmir"))
    rec2 = TransferRecord(1, "0xa", "0xc", 10, 1500, "Izmir")
    s.add_transfer(rec2)
    risk, _ = impossible_speed_rule(s, rec2)
    assert risk == 0

def test_impossible_speed_ignores_legit_holder_move():
    # Legit because the transfer originates from the current holder (0xa),
    # even though it moves to a different city.
    s = GraphStore()
    s.add_transfer(TransferRecord(1, "0xm", "0xa", 10, 1000, "Izmir"))
    rec2 = TransferRecord(1, "0xa", "0xb", 10, 1000 + 7200, "Gaziantep")
    s.add_transfer(rec2)
    risk, _ = impossible_speed_rule(s, rec2)
    assert risk == 0

def test_detector_freezes_above_threshold():
    d = Detector()
    d.register(impossible_speed_rule)
    s = GraphStore()
    s.add_transfer(TransferRecord(1, "0xm", "0xa", 10, 1000, "Izmir"))
    rec2 = TransferRecord(1, "0xm", "0xb", 10, 1500, "Gaziantep")
    s.add_transfer(rec2)
    result = d.evaluate(s, rec2)
    assert result.risk == 90
    assert d.should_freeze(result) is True
    assert FREEZE_THRESHOLD == 75

def test_honest_intercity_chain_never_flags():
    d = Detector(); d.register(impossible_speed_rule)
    s = GraphStore()
    s.add_transfer(TransferRecord(1, "0x0", "0xmfr", 100, 1000, "Istanbul"))
    assert d.evaluate(s, s.get_token_history(1)[-1]).risk == 0
    s.add_transfer(TransferRecord(1, "0xmfr", "0xdist", 50, 1005, "Ankara"))
    assert d.evaluate(s, s.get_token_history(1)[-1]).risk == 0
    s.add_transfer(TransferRecord(1, "0xdist", "0xpha", 20, 1010, "Izmir"))
    assert d.evaluate(s, s.get_token_history(1)[-1]).risk == 0

def test_clone_fork_from_stale_holder_flags():
    d = Detector(); d.register(impossible_speed_rule)
    s = GraphStore()
    s.add_transfer(TransferRecord(1, "0x0", "0xmfr", 100, 1000, "Istanbul"))
    s.add_transfer(TransferRecord(1, "0xmfr", "0xdist", 50, 1005, "Ankara"))
    s.add_transfer(TransferRecord(1, "0xdist", "0xpha", 20, 1010, "Izmir"))
    s.add_transfer(TransferRecord(1, "0xmfr", "0xphb", 20, 1015, "Gaziantep"))
    result = d.evaluate(s, s.get_token_history(1)[-1])
    assert result.risk == 90
    assert d.should_freeze(result) is True
