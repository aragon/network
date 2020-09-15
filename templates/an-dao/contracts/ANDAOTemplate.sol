/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

import "./BaseTemplate.sol";
import "./lib/os/ERC20.sol";
import "./lib/staking/IStakingFactory.sol";


contract ANDAOTemplate is BaseTemplate {
    string constant private ERROR_MISSING_CACHE = "TEMPLATE_MISSING_CACHE";
    string constant private ERROR_BAD_VOTE_SETTINGS = "BAD_VOTE_SETTINGS";
    string constant private ERROR_BAD_COLLATERAL_REQUIREMENT_SETTINGS = "BAD_COL_REQ_SETTINGS";

    bool constant private SET_APP_FEES_CASHIER = false;

    struct Cache {
        address dao;
        address agreement;
        address votingAggregator;
    }

    mapping (address => Cache) internal cache;

    constructor(DAOFactory _daoFactory, ENS _ens, bytes32[3] memory _appIds)
        BaseTemplate(_daoFactory, _ens, _appIds)
        public
    {}

    function createDaoAndInstallAgreement(MiniMeToken _votingToken, string calldata _title, bytes calldata _content, address _arbitrator, IStakingFactory _stakingFactory) external {
        (Kernel dao, ACL acl) = _createDAO();

        Agreement agreement = _installAgreementApp(dao, _arbitrator, SET_APP_FEES_CASHIER, _title, _content, address(_stakingFactory));
        VotingAggregator votingAggregator = _installVotingAggregatorApp(dao, _votingToken);

        // Add token as power source to Voting Aggregator
        _createPermissionForTemplate(acl, address(votingAggregator), votingAggregator.ADD_POWER_SOURCE_ROLE());
        votingAggregator.addPowerSource(address(_votingToken), VotingAggregator.PowerSourceType.ERC20WithCheckpointing, 1);
        // Add staking as power source to Voting Aggregator
        address staking = _stakingFactory.getOrCreateInstance(address(_votingToken));
        votingAggregator.addPowerSource(staking, VotingAggregator.PowerSourceType.ERC900, 1);
        _storeCache(dao, agreement, votingAggregator);
    }

    function installApps(
        uint64[7] calldata _votingSettings1,
        uint256[4] calldata _collateralRequirements1,
        uint64[7] calldata _votingSettings2,
        uint256[4] calldata _collateralRequirements2
    )
        external
    {
        (Kernel dao, Agreement agreement, VotingAggregator votingAggregator) = _popCache();

        address payable aggregatorAddress = address(uint160(address(votingAggregator)));

        ACL acl = ACL(dao.acl());

        DisputableVoting voting2 = _installApps2(dao, acl, votingAggregator, agreement, aggregatorAddress, _votingSettings2, _collateralRequirements2);
        _installApps1(dao, acl, agreement, voting2, aggregatorAddress, _votingSettings1, _collateralRequirements1);

        // Remove permissions from template
        _transferPermissionFromTemplate(acl, address(agreement), address(voting2), agreement.MANAGE_DISPUTABLE_ROLE(), address(voting2));
        _transferPermissionFromTemplate(acl, address(votingAggregator), address(voting2), votingAggregator.ADD_POWER_SOURCE_ROLE(), address(voting2));
        _transferRootPermissionsFromTemplateAndFinalizeDAO(dao, address(voting2), address(voting2));
    }

    function _installApps2(
        Kernel _dao,
        ACL _acl,
        VotingAggregator _votingAggregator,
        Agreement _agreement,
        address payable _aggregatorAddress,
        uint64[7] memory _votingSettings2,
        uint256[4] memory _collateralRequirements2
    )
        internal
        returns (DisputableVoting)
    {
        Agent agent2 = _installAgentApp(_dao);
        DisputableVoting voting2 = _installDisputableVotingApp(_dao, MiniMeToken(_aggregatorAddress), _votingSettings2);

        _setupMainPermissions(_acl, agent2, _agreement, voting2, _votingAggregator);

        // Activate Disputable voting app
        _activateDisputableVoting(_acl, _agreement, voting2, voting2, _collateralRequirements2);

        return voting2;
    }

    function _installApps1(
        Kernel _dao,
        ACL _acl,
        Agreement _agreement,
        DisputableVoting _voting2,
        address payable _aggregatorAddress,
        uint64[7] memory _votingSettings1,
        uint256[4] memory _collateralRequirements1
    )
        internal
    {
        Agent agent1 = _installAgentApp(_dao);
        DisputableVoting voting1 = _installDisputableVotingApp(_dao, MiniMeToken(_aggregatorAddress), _votingSettings1);

        _setupVoting1Permissions(_acl, agent1, voting1, _voting2);

        // Activate Disputable voting app
        _activateDisputableVoting(_acl, _agreement, voting1, _voting2, _collateralRequirements1);
    }

    function _setupMainPermissions(
        ACL _acl,
        Agent _agent,
        Agreement _agreement,
        DisputableVoting _voting,
        VotingAggregator _votingAggregator
    )
        internal
    {
        // Agent
        _createAgentPermissions(_acl, _agent, address(_voting), address(_voting));
        _createVaultPermissions(_acl, Vault(address(_agent)), address(_voting), address(_voting));
        // Agreement
        _createAgreementPermissions(_acl, _agreement, address(_voting), address(_voting));
        // Voting
        _acl.createPermission(_acl.ANY_ENTITY(), address(_voting), _voting.CREATE_VOTES_ROLE(), address(_voting));
        _acl.createPermission(_acl.ANY_ENTITY(), address(_voting), _voting.CHALLENGE_ROLE(), address(_voting));
        _createVotingAggregatorPermissions(_acl, _votingAggregator, address(_voting), address(_voting));
        _createDisputableVotingPermissions(_acl, _voting, address(_voting), address(_voting));
        // EVM Script Registry
        _createEvmScriptsRegistryPermissions(_acl, address(_voting), address(_voting));
    }

    function _setupVoting1Permissions(
        ACL _acl,
        Agent _agent,
        DisputableVoting _voting1,
        DisputableVoting _voting2
    )
        internal
    {
        _acl.createPermission(_acl.ANY_ENTITY(), address(_voting1), _voting1.CREATE_VOTES_ROLE(), address(_voting2));
        _acl.createPermission(_acl.ANY_ENTITY(), address(_voting1), _voting1.CHALLENGE_ROLE(), address(_voting2));
        _createAgentPermissions(_acl, _agent, address(_voting1), address(_voting2));
        _createVaultPermissions(_acl, Vault(address(_agent)), address(_voting1), address(_voting2));
        _createDisputableVotingPermissions(_acl, _voting1, address(_voting2), address(_voting2));
    }

    function _activateDisputableVoting(
        ACL _acl,
        Agreement _agreement,
        DisputableVoting _voting,
        DisputableVoting _votingManager,
        uint256[4] memory _collateralRequirements
    )
        internal
    {
        ERC20 collateralToken = ERC20(_collateralRequirements[0]);
        uint64 challengeDuration = uint64(_collateralRequirements[1]);
        uint256 actionCollateral = _collateralRequirements[2];
        uint256 challengeCollateral = _collateralRequirements[3];

        _acl.createPermission(address(_agreement), address(_voting), _voting.SET_AGREEMENT_ROLE(), address(_votingManager));
        _agreement.activate(address(_voting), collateralToken, challengeDuration, actionCollateral, challengeCollateral);
    }

    function _storeCache(Kernel _dao, Agreement _agreement, VotingAggregator _votingAggregator) internal {
        Cache storage c = cache[msg.sender];
        c.dao = address(_dao);
        c.agreement = address(_agreement);
        c.votingAggregator = address(_votingAggregator);
    }

    function _popCache() internal returns (Kernel dao, Agreement agreement, VotingAggregator votingAggregator) {
        Cache storage c = cache[msg.sender];
        require(c.dao != address(0), ERROR_MISSING_CACHE);

        dao = Kernel(c.dao);
        agreement = Agreement(c.agreement);
        votingAggregator = VotingAggregator(c.votingAggregator);

        delete c.dao;
        delete c.agreement;
        delete c.votingAggregator;
    }

    function _loadCache() internal view returns (Kernel) {
        Cache storage c = cache[msg.sender];
        require(c.dao != address(0), ERROR_MISSING_CACHE);
        return Kernel(c.dao);
    }
}
