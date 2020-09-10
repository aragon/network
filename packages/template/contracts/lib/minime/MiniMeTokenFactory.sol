/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

import "./MiniMeToken.sol";


interface MiniMeTokenFactory {
    function createCloneToken(
        MiniMeToken _parentToken,
        uint _snapshotBlock,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        bool _transfersEnabled
    ) external returns (MiniMeToken);
}
