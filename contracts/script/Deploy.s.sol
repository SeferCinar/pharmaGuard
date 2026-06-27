// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PharmaGuard.sol";

contract Deploy is Script {
    function run() external {
        uint256 adminPk = vm.envUint("ADMIN_PK");
        string memory uri = vm.envString("TOKEN_URI");
        vm.startBroadcast(adminPk);
        PharmaGuard pg = new PharmaGuard(uri);
        console.log("PharmaGuard deployed at:", address(pg));
        vm.stopBroadcast();
    }
}
