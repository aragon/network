/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

interface Vault {
    function TRANSFER_ROLE() external view returns (bytes32);

    function initialize() external;
}
