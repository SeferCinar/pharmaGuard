// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PharmaGuard is ERC1155, AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");

    struct ItemDetails {
        string name;
        string batchNumber;
        uint256 productionDate;
        uint256 expiryDate;
        bool isFrozen;
    }

    mapping(uint256 => ItemDetails) public itemRegistry;

    event ItemTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 quantity, uint256 timestamp);
    event AnomalousActivityFlagged(uint256 indexed tokenId, string reason, uint8 riskScore);

    constructor(string memory uri) ERC1155(uri) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- role registry (kept isolated for future SupplyChainRegistry extraction) ---
    function registerManufacturer(address a) external onlyRole(DEFAULT_ADMIN_ROLE) { _grantRole(MANUFACTURER_ROLE, a); }
    function registerDistributor(address a) external onlyRole(DEFAULT_ADMIN_ROLE) { _grantRole(DISTRIBUTOR_ROLE, a); }
    function registerPharmacy(address a) external onlyRole(DEFAULT_ADMIN_ROLE) { _grantRole(PHARMACY_ROLE, a); }
    function registerAIOracle(address a) external onlyRole(DEFAULT_ADMIN_ROLE) { _grantRole(AI_ORACLE_ROLE, a); }

    function mintProduct(
        address to, uint256 id, uint256 amount,
        string memory name, string memory batchNumber, uint256 expiryDate, bytes memory data
    ) external onlyRole(MANUFACTURER_ROLE) {
        _mint(to, id, amount, data);
        itemRegistry[id] = ItemDetails(name, batchNumber, block.timestamp, expiryDate, false);
        emit ItemTransferred(id, address(0), to, amount, block.timestamp);
    }

    function safeTransferItem(address from, address to, uint256 id, uint256 amount, bytes memory data) public {
        require(!itemRegistry[id].isFrozen, "PharmaGuard: Bu urun hile/sahtecilik suphesiyle dondurulmustur.");
        safeTransferFrom(from, to, id, amount, data);
        emit ItemTransferred(id, from, to, amount, block.timestamp);
    }

    function flagAndFreezeProduct(uint256 id, string memory reason, uint8 riskScore) external onlyRole(AI_ORACLE_ROLE) {
        require(riskScore > 75, "PharmaGuard: Risk skoru dondurma islemi icin yetersiz.");
        itemRegistry[id].isFrozen = true;
        emit AnomalousActivityFlagged(id, reason, riskScore);
    }

    function unfreezeProduct(uint256 id) external onlyRole(DEFAULT_ADMIN_ROLE) {
        itemRegistry[id].isFrozen = false;
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
