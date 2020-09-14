pragma solidity ^0.5.17;


interface VotingAggregator {
    enum PowerSourceType {
        Invalid,
        ERC20WithCheckpointing,
        ERC900
    }

    function ADD_POWER_SOURCE_ROLE() external view returns (bytes32);
    function MANAGE_POWER_SOURCE_ROLE() external view returns (bytes32);
    function MANAGE_WEIGHTS_ROLE() external view returns (bytes32);

    function initialize(string calldata _name, string calldata _symbol, uint8 _decimals) external;
    function addPowerSource(address _sourceAddr, PowerSourceType _sourceType, uint256 _weight) external;
}
