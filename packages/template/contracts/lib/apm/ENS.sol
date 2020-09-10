/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;


interface ENS {
    function resolver(bytes32 node) external view returns (address);
}
