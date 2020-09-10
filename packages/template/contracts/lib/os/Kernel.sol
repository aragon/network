/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

import "./ACL.sol";


interface Kernel {
    function APP_MANAGER_ROLE() external pure returns (bytes32);

    function acl() external view returns (ACL);
    function setRecoveryVaultAppId(bytes32 _recoveryVaultAppId) external;
    function newAppInstance(bytes32 _appId, address _appBase, bytes _initializePayload, bool _setDefault) external returns (address);
}
