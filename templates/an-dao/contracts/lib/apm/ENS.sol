/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;


interface ENS {
    function owner(bytes32 node) external view returns (address);
    function resolver(bytes32 node) external view returns (address);
}
