from dataclasses import dataclass, field
from typing import Callable
from app.graph_store import GraphStore, TransferRecord

FREEZE_THRESHOLD = 75          # MUST match contract require(riskScore > 75)
IMPOSSIBLE_SPEED_SECONDS = 3600

Rule = Callable[[GraphStore, TransferRecord], tuple[int, "str | None"]]

@dataclass
class DetectorResult:
    risk: int
    reasons: list[str] = field(default_factory=list)

def impossible_speed_rule(store: GraphStore, rec: TransferRecord) -> tuple[int, "str | None"]:
    history = store.get_token_history(rec.token_id)
    for prev in history[:-1]:  # all transfers before the current one
        if prev.city != rec.city and abs(rec.timestamp - prev.timestamp) < IMPOSSIBLE_SPEED_SECONDS:
            return 90, (f"Imkansiz hiz: token {rec.token_id} {prev.city} -> {rec.city} "
                        f"arasinda {abs(rec.timestamp - prev.timestamp)} sn icinde hareket etti (klon suphesi).")
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
