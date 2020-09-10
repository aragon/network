/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

interface Agent {
    function EXECUTE_ROLE() external pure returns (bytes32);
    function RUN_SCRIPT_ROLE() external pure returns (bytes32);

    function initialize() external;
}
