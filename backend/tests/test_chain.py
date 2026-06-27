from app.chain import ChainClient

class FakeSigner:
    def __init__(self): self.calls = []
    def address(self, role): return "0x" + role
    def send(self, role, fn_name, *args):
        self.calls.append((role, fn_name, args)); return "0xhash"

def test_mint_routes_to_signer_as_manufacturer():
    fake = FakeSigner()
    c = ChainClient(signer=fake)
    h = c.mint(token_id=1, amount=100, name="X", batch="B", expiry=999)
    assert h == "0xhash"
    role, fn, args = fake.calls[0]
    assert role == "manufacturer" and fn == "mintProduct"

def test_freeze_routes_to_oracle_with_threshold_args():
    fake = FakeSigner()
    c = ChainClient(signer=fake)
    c.freeze(token_id=1, reason="clone", risk=90)
    role, fn, args = fake.calls[0]
    assert role == "oracle" and fn == "flagAndFreezeProduct"
    assert args[2] == 90
