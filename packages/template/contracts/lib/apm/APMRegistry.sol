/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

import "./Repo.sol";


interface APMRegistry {
    function newRepoWithVersion(
        string calldata _name,
        address _dev,
        uint16[3] calldata _initialSemanticVersion,
        address _contractAddress,
        bytes calldata _contentURI
    ) external returns (Repo);
}
