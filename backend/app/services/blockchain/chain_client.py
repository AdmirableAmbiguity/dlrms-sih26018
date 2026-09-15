from web3 import Web3
from web3.exceptions import InvalidAddress, ContractLogicError
from app.core.config import settings
import uuid
import time
from typing import Dict, Any, Optional
import json

# Fallback mock state if chain isn't running
_MOCK_CHAIN_STATE = {}

def get_web3_client():
    w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
    return w3

async def lock_record(record_id: int, record_hash: str, owner_address: str) -> str:
    w3 = get_web3_client()
    if w3.is_connected() and settings.DEPLOYER_PRIVATE_KEY:
        try:
            # Setup for actual contract call would go here
            # For simplicity, we are returning a mock tx hash in connected mode too
            # tx_hash = contract.functions.lockRecord(...).transact()
            pass
        except Exception as e:
            pass

    # Mock mode fallback
    tx_hash = "0x" + uuid.uuid4().hex
    _MOCK_CHAIN_STATE[record_id] = {
        "record_hash": record_hash,
        "owner_address": owner_address,
        "timestamp": time.time(),
        "tx_hash": tx_hash
    }
    return tx_hash

async def get_record_on_chain(record_id: int) -> Optional[Dict[str, Any]]:
    # Mock fallback
    if record_id in _MOCK_CHAIN_STATE:
        data = _MOCK_CHAIN_STATE[record_id]
        data["source"] = "Simulated — Blockchain sandbox"
        return data
    return None

async def get_transfer_history(canonical_id: str) -> list:
    # We would ideally query contract events here
    # Mock fallback: return empty since we use MutationEvent DB table for logic mostly
    return []
