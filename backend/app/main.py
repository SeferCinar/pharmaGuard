import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from web3.exceptions import ContractLogicError
from app.graph_store import GraphStore
from app.ws import manager
from app.listener import run_listener

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
    task = asyncio.create_task(run_listener(store, get_chain(), manager.broadcast))
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class MintBody(BaseModel):
    token_id: int; amount: int; name: str; batch: str; expiry: int

class TransferBody(BaseModel):
    role: str; to_role: str; token_id: int; amount: int

@app.get("/state")
def state():
    return store.snapshot()

@app.post("/mint")
def mint(body: MintBody):
    tx = get_chain().mint(token_id=body.token_id, amount=body.amount, name=body.name, batch=body.batch, expiry=body.expiry)
    return {"tx": tx}

@app.post("/transfer")
def transfer(body: TransferBody):
    try:
        tx = get_chain().transfer(role=body.role, to_role=body.to_role, token_id=body.token_id, amount=body.amount)
    except ContractLogicError:
        # the contract's require(!isFrozen) rejected the transfer of a quarantined token
        raise HTTPException(status_code=400, detail="Zincir reddetti: ürün dondurulmuş (sahtecilik şüphesi)")
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
