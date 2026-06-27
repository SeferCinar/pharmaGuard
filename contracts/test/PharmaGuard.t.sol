// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PharmaGuard.sol";

contract PharmaGuardTest is Test {
    PharmaGuard pg;
    address admin = address(0xA11CE);
    address oracle = address(0x0AC1E);
    address mfr = address(0x1);
    address dist = address(0x2);
    address pharmacy = address(0x3);

    function setUp() public {
        vm.prank(admin);
        pg = new PharmaGuard("uri://{id}");
        vm.startPrank(admin);
        pg.registerManufacturer(mfr);
        pg.registerDistributor(dist);
        pg.registerPharmacy(pharmacy);
        pg.registerAIOracle(oracle);
        vm.stopPrank();
    }

    function test_mint_setsRegistryAndBalance() public {
        vm.prank(mfr);
        pg.mintProduct(mfr, 1, 100, "Cancer Drug X", "BATCH-1", block.timestamp + 365 days, "");
        assertEq(pg.balanceOf(mfr, 1), 100);
        (string memory name,,,, bool frozen) = pg.itemRegistry(1);
        assertEq(name, "Cancer Drug X");
        assertEq(frozen, false);
    }

    function test_mint_revertsForNonManufacturer() public {
        vm.prank(dist);
        vm.expectRevert();
        pg.mintProduct(dist, 1, 100, "X", "B", block.timestamp + 1, "");
    }

    function test_freeze_blocksTransfer() public {
        vm.prank(mfr);
        pg.mintProduct(mfr, 1, 100, "X", "B", block.timestamp + 365 days, "");
        vm.prank(oracle);
        pg.flagAndFreezeProduct(1, "impossible-speed clone", 90);
        vm.prank(mfr);
        vm.expectRevert("PharmaGuard: Bu urun hile/sahtecilik suphesiyle dondurulmustur.");
        pg.safeTransferItem(mfr, dist, 1, 10, "");
    }

    function test_freeze_revertsBelowThreshold() public {
        vm.prank(oracle);
        vm.expectRevert("PharmaGuard: Risk skoru dondurma islemi icin yetersiz.");
        pg.flagAndFreezeProduct(1, "low", 75);
    }

    function test_freeze_revertsForNonOracle() public {
        vm.prank(mfr);
        vm.expectRevert();
        pg.flagAndFreezeProduct(1, "x", 90);
    }
}
