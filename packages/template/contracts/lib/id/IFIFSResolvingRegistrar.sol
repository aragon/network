/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

import "../apm/PublicResolver.sol";


interface IFIFSResolvingRegistrar {
    function register(bytes32 _subnode, address _owner) external;
    function registerWithResolver(bytes32 _subnode, address _owner, PublicResolver _resolver) external;
}
