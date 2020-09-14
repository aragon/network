/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

import "./lib/minime/MiniMeToken.sol";


contract TokenCache {
    string constant private ERROR_MISSING_TOKEN_CACHE = "TEMPLATE_MISSING_TOKEN_CACHE";

    mapping (address => address payable) internal tokenCache;

    function _cacheToken(MiniMeToken _token, address _owner) internal {
        tokenCache[_owner] = address(_token);
    }

    function _popTokenCache(address _owner) internal returns (MiniMeToken) {
        require(tokenCache[_owner] != address(0), ERROR_MISSING_TOKEN_CACHE);

        MiniMeToken token = MiniMeToken(tokenCache[_owner]);
        delete tokenCache[_owner];
        return token;
    }
}
