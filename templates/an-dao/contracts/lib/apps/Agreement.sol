/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

import "../os/ERC20.sol";


interface Agreement {
    function CHANGE_AGREEMENT_ROLE() external pure returns (bytes32);
    function MANAGE_DISPUTABLE_ROLE() external pure returns (bytes32);
    function CHALLENGE_ROLE() external pure returns (bytes32);

    function initialize(
        address _arbitrator,
        bool _setAppFeesCashier,
        string calldata _title,
        bytes calldata _content,
        address _stakingFactory
    ) external;

    function activate(
        address _disputableAddress,
        ERC20 _collateralToken,
        uint64 _challengeDuration,
        uint256 _actionAmount,
        uint256 _challengeAmount
    ) external;
}
