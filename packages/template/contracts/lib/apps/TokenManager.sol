/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

import "../minime/MiniMeToken.sol";


interface TokenManager {
    function MINT_ROLE() external view returns (bytes32);
    function BURN_ROLE() external view returns (bytes32);

    function initialize(MiniMeToken _token, bool _transferable, uint256 _maxAccountTokens) external;
    function mint(address _receiver, uint256 _amount) external;
}
