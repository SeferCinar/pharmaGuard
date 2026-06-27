import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from web3.exceptions import ContractLogicError
from app.graph_store import GraphStore
from app.detector import detector
from app.listener import handle_transfer_event
from app.config import settings
from app.ws import manager

ZERO_ADDR = "0x0000000000000000000000000000000000000000"

store = GraphStore()
chain = None  # lazily created so tests can inject a fake before first use

def get_chain():
    global chain
    if chain is None:
        from app.chain import ChainClient
        chain = ChainClient()
    return chain

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ingestion is driven directly by the mint/transfer handlers (the backend is
    # the signer for every demo role, so it knows each transfer as it routes it).
    # This is instant and does not depend on eth_getLogs, which the public Monad
    # RPC throttles. The on-chain pure indexer (app.listener.run_listener) remains
    # available for a deployment that prefers reading ItemTransferred events.
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class MintBody(BaseModel):
    token_id: int; amount: int; name: str; batch: str; expiry: int

class TransferBody(BaseModel):
    role: str; to_role: str; token_id: int; amount: int

def _ingest(from_addr: str, to_addr: str, token_id: int, amount: int):
    """Feed a confirmed transfer into the graph + detector (may trigger a freeze)."""
    args = {
        "tokenId": token_id, "from": from_addr, "to": to_addr,
        "quantity": amount, "timestamp": int(time.time()),
    }
    handle_transfer_event(store, detector, get_chain(), settings.actor_cities, args, lambda snap: None)

@app.get("/state")
def state():
    return store.snapshot()

@app.post("/mint")
async def mint(body: MintBody):
    tx = get_chain().mint(token_id=body.token_id, amount=body.amount, name=body.name, batch=body.batch, expiry=body.expiry)
    _ingest(ZERO_ADDR, get_chain().address("manufacturer"), body.token_id, body.amount)
    await manager.broadcast(store.snapshot())
    return {"tx": tx}

@app.post("/transfer")
async def transfer(body: TransferBody):
    try:
        tx = get_chain().transfer(role=body.role, to_role=body.to_role, token_id=body.token_id, amount=body.amount)
    except ContractLogicError:
        # the contract's require(!isFrozen) rejected the transfer of a quarantined token
        raise HTTPException(status_code=400, detail="Zincir reddetti: ürün dondurulmuş (sahtecilik şüphesi)")
    _ingest(get_chain().address(body.role), get_chain().address(body.to_role), body.token_id, body.amount)
    await manager.broadcast(store.snapshot())
    return {"tx": tx}

@app.post("/reset")
async def reset():
    store.reset()
    await manager.broadcast(store.snapshot())
    return {"ok": True}

@app.websocket("/ws")
async def ws(ws: WebSocket):
    await manager.connect(ws)
    await ws.send_json(store.snapshot())
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
