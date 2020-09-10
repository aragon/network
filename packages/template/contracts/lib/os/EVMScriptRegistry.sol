/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

interface EVMScriptRegistry {
    function REGISTRY_MANAGER_ROLE() external pure returns (bytes32);
    function REGISTRY_ADD_EXECUTOR_ROLE() external pure returns (bytes32);
}
