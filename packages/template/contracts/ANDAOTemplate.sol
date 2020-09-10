/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.4.24;

import "./BaseTemplate.sol";
import "./lib/os/ERC20.sol";


contract ANDAOTemplate is BaseTemplate {
    string constant private ERROR_BAD_VOTE_SETTINGS = "BAD_VOTE_SETTINGS";
    string constant private ERROR_BAD_COLLATERAL_REQUIREMENT_SETTINGS = "BAD_COL_REQ_SETTINGS";

    bool constant private SET_APP_FEES_CASHIER = false;
    address constant private ANY_ENTITY = address(-1);

    constructor(DAOFactory _daoFactory, ENS _ens)
        BaseTemplate(_daoFactory, _ens)
        public
    {}

    function createDAO(
        string _title,
        bytes _content,
        address _arbitrator,
        address _stakingFactory,
        MiniMeToken _token,
        uint64[7] _votingSettings,
        uint256[4] _collateralRequirements
    )
        external
    {
        (Kernel dao, ACL acl) = _createDAO();
        (Agent agent, Agreement agreement, DisputableVoting voting) = _installApps(dao, _title, _content, _arbitrator, _stakingFactory, _token, _votingSettings);

        _setupPermissions(acl, agent, agreement, voting);
        _activateDisputableVoting(acl, agreement, voting, _collateralRequirements);
        _transferRootPermissionsFromTemplateAndFinalizeDAO(dao, voting, voting);
    }

    function _installApps(
        Kernel _dao,
        string _title,
        bytes _content,
        address _arbitrator,
        address _stakingFactory,
        MiniMeToken _token,
        uint64[7] _votingSettings
    )
        internal
        returns (Agent, Agreement, DisputableVoting)
    {
        Agent agent = _installAgentApp(_dao);
        Agreement agreement = _installAgreementApp(_dao, _arbitrator, SET_APP_FEES_CASHIER, _title, _content, _stakingFactory);
        DisputableVoting voting = _installDisputableVotingApp(_dao, _token, _votingSettings);
        return (agent, agreement, voting);
    }

    function _setupPermissions(ACL _acl, Agent _agent, Agreement _agreement, DisputableVoting _voting) internal {
        _createAgentPermissions(_acl, _agent, _voting, _voting);
        _createVaultPermissions(_acl, Vault(_agent), _voting, _voting);
        _createAgreementPermissions(_acl, _agreement, _voting, _voting);
        _createEvmScriptsRegistryPermissions(_acl, _voting, _voting);
        _createDisputableVotingPermissions(_acl, _voting, _voting, _voting);

        _acl.createPermission(ANY_ENTITY, _voting, _voting.CREATE_VOTES_ROLE(), _voting);
        _acl.createPermission(ANY_ENTITY, _voting, _voting.CHALLENGE_ROLE(), _voting);
    }

    function _activateDisputableVoting(ACL _acl, Agreement _agreement, DisputableVoting _voting, uint256[4] _collateralRequirements) internal {
        ERC20 collateralToken = ERC20(_collateralRequirements[0]);
        uint64 challengeDuration = uint64(_collateralRequirements[1]);
        uint256 actionCollateral = _collateralRequirements[2];
        uint256 challengeCollateral = _collateralRequirements[3];

        _acl.createPermission(_agreement, _voting, _voting.SET_AGREEMENT_ROLE(), _voting);
        _agreement.activate(_voting, collateralToken, challengeDuration, actionCollateral, challengeCollateral);
        _transferPermissionFromTemplate(_acl, _agreement, _voting, _agreement.MANAGE_DISPUTABLE_ROLE(), _voting);
    }
}
