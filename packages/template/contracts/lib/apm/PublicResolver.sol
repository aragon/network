/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

interface PublicResolver {
    function supportsInterface(bytes4 interfaceID) external view returns (bool);
    function addr(bytes32 node) external view returns (address ret);
    function setAddr(bytes32 node, address addr) external;
    function hash(bytes32 node) external view returns (bytes32 ret);
    function setHash(bytes32 node, bytes32 hash) external;
}
