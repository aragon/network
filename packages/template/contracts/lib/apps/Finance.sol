/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

import "./Vault.sol";


interface Finance {
    function CREATE_PAYMENTS_ROLE() external pure returns (bytes32);
    function MANAGE_PAYMENTS_ROLE() external pure returns (bytes32);
    function EXECUTE_PAYMENTS_ROLE() external pure returns (bytes32);

    function initialize(Vault _vault, uint64 _periodDuration) external;
}
