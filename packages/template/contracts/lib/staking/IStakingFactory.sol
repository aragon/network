/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;


interface IStakingFactory {
    function getOrCreateInstance(address) external returns (address);
}
