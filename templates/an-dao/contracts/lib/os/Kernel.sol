/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

import "./ACL.sol";


interface Kernel {
    event NewAppProxy(address proxy, bool isUpgradeable, bytes32 appId);

    function APP_MANAGER_ROLE() external pure returns (bytes32);

    function acl() external view returns (ACL);
    function setRecoveryVaultAppId(bytes32 _recoveryVaultAppId) external;
    function newAppInstance(bytes32 _appId, address _appBase, bytes calldata _initializePayload, bool _setDefault) external returns (address);
    function getApp(bytes32 _namespace, bytes32 _appId) external view returns (address);
}
