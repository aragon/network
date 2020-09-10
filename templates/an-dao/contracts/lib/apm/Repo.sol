/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;


interface Repo {
    function getLatest() external view returns (uint16[3] memory semanticVersion, address contractAddress, bytes memory contentURI);
}
