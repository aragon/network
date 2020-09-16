/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

import "./EVMScriptRegistry.sol";


contract ACL {
    address public constant ANY_ENTITY = address(-1);

    function CREATE_PERMISSIONS_ROLE() external pure returns (bytes32);

    function createPermission(address _entity, address _app, bytes32 _role, address _manager) external;
    function grantPermission(address _entity, address _app, bytes32 _role) external;
    function revokePermission(address _entity, address _app, bytes32 _role) external;
    function setPermissionManager(address _newManager, address _app, bytes32 _role) external;
    function removePermissionManager(address _app, bytes32 _role) external;
    function getPermissionManager(address _app, bytes32 _role) external view returns (address);
    function hasPermission(address _who, address _where, bytes32 _what) external view returns (bool);
    function getEVMScriptRegistry() external view returns (EVMScriptRegistry);
}
