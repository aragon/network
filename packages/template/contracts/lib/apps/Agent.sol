/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;


interface Agent {
    function EXECUTE_ROLE() external pure returns (bytes32);
    function RUN_SCRIPT_ROLE() external pure returns (bytes32);

    function initialize() external;
}
