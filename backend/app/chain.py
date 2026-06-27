import json
from pathlib import Path
from typing import Protocol
from eth_account import Account
from web3 import Web3
from app.config import settings

ABI = json.loads((Path(__file__).parent / "abi" / "PharmaGuard.json").read_text())["abi"]

class Signer(Protocol):
    def address(self, role: str) -> str: ...
    def send(self, role: str, fn_name: str, *args) -> str: ...

class BackendSigner:
    """Signs with per-role local private keys. Wallet-connect impl can replace this at the ChainClient seam."""
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.monad_rpc_url))
        self.contract = self.w3.eth.contract(address=Web3.to_checksum_address(settings.contract_address), abi=ABI)
        self.accounts = {role: Account.from_key(pk) for role, pk in settings.keys.items() if pk}

    def address(self, role: str) -> str:
        return self.accounts[role].address

    def send(self, role: str, fn_name: str, *args) -> str:
        acct = self.accounts[role]
        fn = getattr(self.contract.functions, fn_name)(*args)
        tx = fn.build_transaction({
            "from": acct.address,
            "nonce": self.w3.eth.get_transaction_count(acct.address),
            "chainId": self.w3.eth.chain_id,
        })
        signed = acct.sign_transaction(tx)
        h = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        return h.hex()

class ChainClient:
    def __init__(self, signer: Signer | None = None):
        self.signer = signer or BackendSigner()

    @property
    def contract(self):
        return self.signer.contract  # used by the event listener

    @property
    def w3(self):
        return self.signer.w3  # expose Web3 instance for the listener

    def address(self, role: str) -> str:
        return self.signer.address(role)

    def mint(self, token_id: int, amount: int, name: str, batch: str, expiry: int) -> str:
        to = self.signer.address("manufacturer")
        return self.signer.send("manufacturer", "mintProduct", to, token_id, amount, name, batch, expiry, b"")

    def transfer(self, role: str, to_role: str, token_id: int, amount: int) -> str:
        frm = self.signer.address(role)
        to = self.signer.address(to_role)
        return self.signer.send(role, "safeTransferItem", frm, to, token_id, amount, b"")

    def freeze(self, token_id: int, reason: str, risk: int) -> str:
        return self.signer.send("oracle", "flagAndFreezeProduct", token_id, reason, risk)
