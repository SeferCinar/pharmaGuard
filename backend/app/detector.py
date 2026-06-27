from dataclasses import dataclass, field
from typing import Callable
from app.graph_store import GraphStore, TransferRecord

FREEZE_THRESHOLD = 75          # MUST match contract require(riskScore > 75)

Rule = Callable[[GraphStore, TransferRecord], tuple[int, "str | None"]]

@dataclass
class DetectorResult:
    risk: int
    reasons: list[str] = field(default_factory=list)

def impossible_speed_rule(store: GraphStore, rec: TransferRecord) -> tuple[int, "str | None"]:
    history = store.get_token_history(rec.token_id)
    prior = history[:-1]  # transfers before the current one
    if not prior:
        return 0, None  # mint / first event establishes the holder
    expected_holder = prior[-1].to_addr.lower()
    if rec.from_addr and rec.from_addr.lower() != expected_holder:
        held_city = prior[-1].city
        return 90, (f"Imkansiz konum: token {rec.token_id} yasal olarak {held_city} "
                    f"bolgesindeki sahibindeyken {rec.city} bolgesinden ({rec.from_addr}) "
                    f"transfer girisimi yapildi (klon/cift harcama suphesi).")
    return 0, None

class Detector:
    def __init__(self):
        self._rules: list[Rule] = []

    def register(self, rule: Rule):
        self._rules.append(rule)

    def evaluate(self, store: GraphStore, rec: TransferRecord) -> DetectorResult:
        risk = 0
        reasons: list[str] = []
        for rule in self._rules:
            r, reason = rule(store, rec)
            if r > 0 and reason:
                reasons.append(reason)
            risk = max(risk, r)
        return DetectorResult(risk=risk, reasons=reasons)

    def should_freeze(self, result: DetectorResult) -> bool:
        return result.risk > FREEZE_THRESHOLD

detector = Detector()
detector.register(impossible_speed_rule)
