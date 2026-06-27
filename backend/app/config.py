from eth_account import Account
from pydantic_settings import BaseSettings, SettingsConfigDict

ROLE_CITY = {  # demo geography for the impossible-speed rule
    "manufacturer": "Istanbul",
    "distributor": "Ankara",
    "pharmacy_a": "Izmir",
    "pharmacy_b": "Gaziantep",
}

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    monad_rpc_url: str = ""
    contract_address: str = ""
    admin_pk: str = ""
    oracle_pk: str = ""
    manufacturer_pk: str = ""
    distributor_pk: str = ""
    pharmacy_a_pk: str = ""
    pharmacy_b_pk: str = ""

    @property
    def keys(self) -> dict[str, str]:
        return {
            "admin": self.admin_pk, "oracle": self.oracle_pk,
            "manufacturer": self.manufacturer_pk, "distributor": self.distributor_pk,
            "pharmacy_a": self.pharmacy_a_pk, "pharmacy_b": self.pharmacy_b_pk,
        }

    @property
    def actor_cities(self) -> dict[str, str]:
        out = {}
        for role, city in ROLE_CITY.items():
            pk = self.keys[role]
            if pk:
                out[Account.from_key(pk).address.lower()] = city
        return out

settings = Settings()
