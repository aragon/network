/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;


interface Repo {
    function getLatest() external view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI);
}
