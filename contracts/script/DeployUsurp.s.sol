// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Usurp} from "../Usurp.sol";

/**
 * @title DeployUsurp
 * @notice Deploy Usurp.sol to Arc Testnet (or any EVM chain) from your own wallet.
 *
 * Usage — Arc Testnet:
 *   forge script contracts/script/DeployUsurp.s.sol \
 *     --rpc-url arc_testnet \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify \
 *     --verifier blockscout \
 *     --verifier-url https://explorer.testnet.arc.io/api \
 *     -vvvv
 *
 * Required env vars (set in .env, loaded automatically by forge):
 *   PRIVATE_KEY          — your deployer wallet private key (never commit this)
 *   FEE_ADDRESS          — wallet that receives 50% of every steal payment
 *   USDC_ADDRESS         — Arc Testnet USDC: 0x3600000000000000000000000000000000000000
 *
 * Optional: override USDC for a different network.
 *
 * After deploy:
 *   1. Record the contract address in AGENTS.md and docs/DECISIONS.md.
 *   2. Call seedPot() via cast or the /admin page to seed the pot before going live.
 *   3. Transfer ownership to a multisig before mainnet.
 */
contract DeployUsurp is Script {
    function run() external {
        address feeAddress = vm.envAddress("FEE_ADDRESS");
        address usdc = vm.envAddress("USDC_ADDRESS");

        require(feeAddress != address(0), "DeployUsurp: FEE_ADDRESS not set");
        require(usdc != address(0), "DeployUsurp: USDC_ADDRESS not set");

        vm.startBroadcast();

        Usurp usurp = new Usurp(feeAddress, usdc);

        console.log("Usurp deployed at:", address(usurp));
        console.log("Owner:            ", usurp.owner());
        console.log("Fee address:      ", usurp.feeAddress());
        console.log("USDC:             ", address(usurp.USDC()));
        console.log("Start price:      ", usurp.currentPrice());
        console.log("Round:            ", usurp.round());

        vm.stopBroadcast();
    }
}
