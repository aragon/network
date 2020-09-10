/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

import "./EVMScriptRegistry.sol";


interface ACL {
    function CREATE_PERMISSIONS_ROLE() external pure returns (bytes32);

    function createPermission(address _entity, address _app, bytes32 _role, address _manager) external;
    function grantPermission(address _entity, address _app, bytes32 _role) external;
    function revokePermission(address _entity, address _app, bytes32 _role) external;
    function setPermissionManager(address _newManager, address _app, bytes32 _role) external;
    function removePermissionManager(address _app, bytes32 _role) external;
    function getEVMScriptRegistry() external view returns (EVMScriptRegistry);
}
