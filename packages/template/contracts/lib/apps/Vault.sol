/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

interface Vault {
    function TRANSFER_ROLE() external view returns (bytes32);

    function initialize() external;
}
