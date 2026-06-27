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

def test_impossible_speed_ignores_slow_legit_move():
    s = GraphStore()
    s.add_transfer(TransferRecord(1, "0xm", "0xa", 10, 1000, "Izmir"))
    rec2 = TransferRecord(1, "0xa", "0xb", 10, 1000 + 7200, "Gaziantep")  # 2h later
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
