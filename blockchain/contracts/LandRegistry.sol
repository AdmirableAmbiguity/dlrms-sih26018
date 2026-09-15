// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LandRegistry {
    struct LandRecord {
        string canonicalId;
        bytes32 recordHash;
        address lockedBy;
        uint256 lockedAt;
        bool isLocked;
    }

    struct TransferEvent {
        string canonicalId;
        address fromOwner;
        address toOwner;
        uint256 transferPrice;
        uint256 transferDate;
        string eventType;
        uint256 timestamp;
    }

    mapping(string => LandRecord) public records;
    mapping(string => TransferEvent[]) public transferHistory;

    event RecordLocked(string indexed canonicalId, bytes32 recordHash, address lockedBy, uint256 timestamp);
    event OwnershipTransferred(string indexed canonicalId, address fromOwner, address toOwner, uint256 price, uint256 timestamp);

    function lockRecord(string memory canonicalId, bytes32 recordHash) external {
        require(!records[canonicalId].isLocked, "Record already locked");
        
        records[canonicalId] = LandRecord({
            canonicalId: canonicalId,
            recordHash: recordHash,
            lockedBy: msg.sender,
            lockedAt: block.timestamp,
            isLocked: true
        });
        
        emit RecordLocked(canonicalId, recordHash, msg.sender, block.timestamp);
    }

    function recordTransfer(string memory canonicalId, address fromOwner, address toOwner, uint256 price, uint256 date, string memory eventType) external {
        TransferEvent memory newTransfer = TransferEvent({
            canonicalId: canonicalId,
            fromOwner: fromOwner,
            toOwner: toOwner,
            transferPrice: price,
            transferDate: date,
            eventType: eventType,
            timestamp: block.timestamp
        });
        
        transferHistory[canonicalId].push(newTransfer);
        
        emit OwnershipTransferred(canonicalId, fromOwner, toOwner, price, block.timestamp);
    }

    function getRecord(string memory canonicalId) external view returns (LandRecord memory) {
        return records[canonicalId];
    }

    function getTransferHistory(string memory canonicalId) external view returns (TransferEvent[] memory) {
        return transferHistory[canonicalId];
    }

    function verifyRecord(string memory canonicalId, bytes32 recordHash) external view returns (bool) {
        require(records[canonicalId].isLocked, "Record not found or not locked");
        return records[canonicalId].recordHash == recordHash;
    }
}
