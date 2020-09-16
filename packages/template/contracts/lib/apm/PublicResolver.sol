/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

interface PublicResolver {
    function supportsInterface(bytes4 _interfaceID) external view returns (bool);
    function addr(bytes32 _node) external view returns (address ret);
    function setAddr(bytes32 _node, address _addr) external;
    function hash(bytes32 _node) external view returns (bytes32 ret);
    function setHash(bytes32 _node, bytes32 _hash) external;
}
