/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

import "./Kernel.sol";


interface DAOFactory {
    event DeployDAO(address dao);
    function newDAO(address _root) external returns (Kernel);
}
