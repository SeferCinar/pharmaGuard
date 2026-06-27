import asyncio
from app.graph_store import GraphStore, TransferRecord
from app.detector import Detector

def handle_transfer_event(store, detector, chain, cities, event_args, on_update):
    to_addr = event_args["to"]
    rec = TransferRecord(
        token_id=int(event_args["tokenId"]),
        from_addr=event_args["from"],
        to_addr=to_addr,
        quantity=int(event_args["quantity"]),
        timestamp=int(event_args["timestamp"]),
        city=cities.get(to_addr.lower(), "unknown"),
    )
    store.add_transfer(rec)
    result = detector.evaluate(store, rec)
    if detector.should_freeze(result) and not store.is_frozen(rec.token_id):
        reason = result.reasons[0] if result.reasons else "Anomali"
        store.mark_frozen(rec.token_id)
        chain.freeze(rec.token_id, reason, result.risk)
    on_update(store.snapshot())
    return result

# Monad testnet caps the eth_getLogs block range; poll in bounded windows so a
# request never exceeds the limit (otherwise the listener 413s and stalls).
MAX_BLOCK_SPAN = 90

async def run_listener(store: GraphStore, chain, broadcast):
    from app.config import settings
    w3 = chain.contract.w3
    event = chain.contract.events.ItemTransferred
    last_block = w3.eth.block_number
    while True:
        try:
            current = w3.eth.block_number
            while last_block <= current:
                to_block = min(current, last_block + MAX_BLOCK_SPAN)
                logs = event.get_logs(from_block=last_block, to_block=to_block)
                for log in logs:
                    handle_transfer_event(store, _shared_detector(),
                                          chain, settings.actor_cities, dict(log["args"]),
                                          lambda snap: asyncio.create_task(broadcast(snap)))
                last_block = to_block + 1
        except Exception as e:  # keep the demo alive across transient RPC hiccups
            print("listener error:", e)
        await asyncio.sleep(2)

def _shared_detector():
    from app.detector import detector
    return detector
