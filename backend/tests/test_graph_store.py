from app.graph_store import GraphStore, TransferRecord

def make_rec(tid=1, frm="0xa", to="0xb", qty=10, ts=1000, city="Izmir"):
    return TransferRecord(tid, frm, to, qty, ts, city)

def test_add_transfer_records_history():
    s = GraphStore()
    s.add_transfer(make_rec())
    hist = s.get_token_history(1)
    assert len(hist) == 1
    assert hist[0].to_addr == "0xb"

def test_mark_and_query_frozen():
    s = GraphStore()
    s.add_transfer(make_rec())
    assert s.is_frozen(1) is False
    s.mark_frozen(1)
    assert s.is_frozen(1) is True

def test_snapshot_has_nodes_edges_and_frozen():
    s = GraphStore()
    s.add_transfer(make_rec(frm="0xa", to="0xb"))
    s.mark_frozen(1)
    snap = s.snapshot()
    ids = {n["id"] for n in snap["nodes"]}
    assert {"0xa", "0xb"} <= ids
    assert snap["edges"][0]["frozen"] is True
    assert 1 in snap["frozen"]

def test_reset_clears_everything():
    s = GraphStore()
    s.add_transfer(make_rec())
    s.mark_frozen(1)
    s.reset()
    assert s.get_token_history(1) == []
    assert s.is_frozen(1) is False
    assert s.snapshot()["nodes"] == []
