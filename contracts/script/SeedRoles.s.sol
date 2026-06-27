// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PharmaGuard.sol";

contract SeedRoles is Script {
    function run() external {
        uint256 adminPk = vm.envUint("ADMIN_PK");
        PharmaGuard pg = PharmaGuard(vm.envAddress("CONTRACT_ADDRESS"));
        vm.startBroadcast(adminPk);
        pg.registerManufacturer(vm.addr(vm.envUint("MANUFACTURER_PK")));
        pg.registerDistributor(vm.addr(vm.envUint("DISTRIBUTOR_PK")));
        pg.registerPharmacy(vm.addr(vm.envUint("PHARMACY_A_PK")));
        pg.registerPharmacy(vm.addr(vm.envUint("PHARMACY_B_PK")));
        pg.registerAIOracle(vm.addr(vm.envUint("ORACLE_PK")));
        vm.stopBroadcast();
    }
}
