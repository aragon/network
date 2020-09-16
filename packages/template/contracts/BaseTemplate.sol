/*
 * SPDX-License-Identifier:    MIT
 */

pragma solidity 0.5.17;

import "./lib/apps/Agent.sol";
import "./lib/apps/Vault.sol";
import "./lib/apps/Agreement.sol";
import "./lib/apps/DisputableVoting.sol";
import "./lib/apps/VotingAggregator.sol";
import "./lib/apps/Finance.sol";
import "./lib/apps/TokenManager.sol";

import "./lib/minime/MiniMeToken.sol";

import "./lib/apm/ENS.sol";
import "./lib/apm/Repo.sol";
import "./lib/apm/PublicResolver.sol";

import "./lib/os/ACL.sol";
import "./lib/os/Kernel.sol";
import "./lib/os/DAOFactory.sol";
import "./lib/os/IsContract.sol";
import "./lib/os/Uint256Helpers.sol";
import "./lib/os/EVMScriptRegistry.sol";

import "./lib/id/IFIFSResolvingRegistrar.sol";


contract BaseTemplate is IsContract {
    using Uint256Helpers for uint256;

    // App IDs for [app].aragonpm.eth:
    bytes32 constant internal AGENT_APP_ID = 0x9ac98dc5f995bf0211ed589ef022719d1487e5cb2bab505676f0d084c07cf89a;
    bytes32 constant internal FINANCE_APP_ID = 0xbf8491150dafc5dcaee5b861414dca922de09ccffa344964ae167212e8c673ae;
    bytes32 constant internal TOKEN_MANAGER_APP_ID = 0x6b20a3010614eeebf2138ccec99f028a61c811b3b1a3343b6ff635985c75c91f;
    bytes32 constant internal VAULT_APP_ID = 0x7e852e0fcfce6551c13800f1e7476f982525c2b5277ba14b24339c68416336d1;

    string constant private ERROR_ENS_NOT_CONTRACT = "TEMPLATE_ENS_NOT_CONTRACT";
    string constant private ERROR_DAO_FACTORY_NOT_CONTRACT = "TEMPLATE_DAO_FAC_NOT_CONTRACT";

    ENS public ens;
    DAOFactory public daoFactory;
    bytes32 public agreementId;
    bytes32 public disputableVotingId;
    bytes32 public votingAggregatorId;

    event DeployDao(address dao);
    event SetupDao(address dao);
    event DeployToken(address token);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(DAOFactory _daoFactory, ENS _ens, bytes32[3] memory _appIds) public {
        require(isContract(address(_ens)), ERROR_ENS_NOT_CONTRACT);
        require(isContract(address(_daoFactory)), ERROR_DAO_FACTORY_NOT_CONTRACT);

        ens = _ens;
        daoFactory = _daoFactory;
        agreementId = _appIds[0];
        disputableVotingId = _appIds[1];
        votingAggregatorId = _appIds[2];
    }

    /**
    * @dev Create a DAO using the DAO Factory and grant the template root permissions so it has full
    *      control during setup. Once the DAO setup has finished, it is recommended to call the
    *      `_transferRootPermissionsFromTemplateAndFinalizeDAO()` helper to transfer the root
    *      permissions to the end entity in control of the organization.
    */
    function _createDAO() internal returns (Kernel dao, ACL acl) {
        dao = daoFactory.newDAO(address(this));
        emit DeployDao(address(dao));
        acl = ACL(dao.acl());
        _createPermissionForTemplate(acl, address(dao), dao.APP_MANAGER_ROLE());
    }

    /* ACL */

    function _createPermissions(ACL _acl, address[] memory _grantees, address _app, bytes32 _permission, address _manager) internal {
        _acl.createPermission(_grantees[0], _app, _permission, address(this));
        for (uint256 i = 1; i < _grantees.length; i++) {
            _acl.grantPermission(_grantees[i], _app, _permission);
        }
        _acl.revokePermission(address(this), _app, _permission);
        _acl.setPermissionManager(_manager, _app, _permission);
    }

    function _createPermissionForTemplate(ACL _acl, address _app, bytes32 _permission) internal {
        _acl.createPermission(address(this), _app, _permission, address(this));
    }

    function _removePermissionFromTemplate(ACL _acl, address _app, bytes32 _permission) internal {
        _acl.revokePermission(address(this), _app, _permission);
        _acl.removePermissionManager(_app, _permission);
    }

    function _transferRootPermissionsFromTemplateAndFinalizeDAO(Kernel _dao, address _to, address _manager) internal {
        ACL _acl = ACL(_dao.acl());
        _transferPermissionFromTemplate(_acl, address(_dao), _to, _dao.APP_MANAGER_ROLE(), _manager);
        _transferPermissionFromTemplate(_acl, address(_acl), _to, _acl.CREATE_PERMISSIONS_ROLE(), _manager);
        emit SetupDao(address(_dao));
    }

    function _transferPermissionFromTemplate(ACL _acl, address _app, address _to, bytes32 _permission, address _manager) internal {
        _acl.grantPermission(_to, _app, _permission);
        _acl.revokePermission(address(this), _app, _permission);
        _acl.setPermissionManager(_manager, _app, _permission);
    }

    /* AGREEMENT */

    function _installAgreementApp(
        Kernel _dao,
        address _arbitrator,
        bool _setAppFeesCashier,
        string memory _title,
        bytes memory _content,
        address _stakingFactory
    )
        internal
        returns (Agreement)
    {
        bytes memory initializeData = abi.encodeWithSelector(
            Agreement(0).initialize.selector,
            _arbitrator,
            _setAppFeesCashier,
            _title,
            _content,
            _stakingFactory
        );
        return Agreement(_installNonDefaultApp(_dao, agreementId, initializeData));
    }

    function _createAgreementPermissions(ACL _acl, Agreement _agreement, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, address(_agreement), _agreement.CHANGE_AGREEMENT_ROLE(), _manager);
        _createPermissionForTemplate(_acl, address(_agreement), _agreement.MANAGE_DISPUTABLE_ROLE());
    }

    /* AGENT */

    function _installAgentApp(Kernel _dao) internal returns (Agent) {
        bytes memory initializeData = abi.encodeWithSelector(Agent(0).initialize.selector);
        Agent agent = Agent(_installDefaultApp(_dao, AGENT_APP_ID, initializeData));
        // We assume that installing the Agent app as a default app means the DAO should have its
        // Vault replaced by the Agent. Thus, we also set the DAO's recovery app to the Agent.
        _dao.setRecoveryVaultAppId(AGENT_APP_ID);
        return agent;
    }

    function _createAgentPermissions(ACL _acl, Agent _agent, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, address(_agent), _agent.EXECUTE_ROLE(), _manager);
        _acl.createPermission(_grantee, address(_agent), _agent.RUN_SCRIPT_ROLE(), _manager);
    }

    function _createVaultPermissions(ACL _acl, Vault _vault, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, address(_vault), _vault.TRANSFER_ROLE(), _manager);
    }

    /* DISPUTABLE VOTING */

    function _installDisputableVotingApp(Kernel _dao, MiniMeToken _token, uint64[7] memory _votingSettings) internal returns (DisputableVoting) {
        uint64 duration = _votingSettings[0];
        uint64 support = _votingSettings[1];
        uint64 acceptance = _votingSettings[2];
        uint64 delegatedVotingPeriod = _votingSettings[3];
        uint64 quietEndingPeriod = _votingSettings[4];
        uint64 quietEndingExtension = _votingSettings[5];
        uint64 executionDelay = _votingSettings[6];

        bytes memory initializeData = abi.encodeWithSelector(
            DisputableVoting(0).initialize.selector,
            _token,
            duration,
            support,
            acceptance,
            delegatedVotingPeriod,
            quietEndingPeriod,
            quietEndingExtension,
            executionDelay
        );
        return DisputableVoting(_installNonDefaultApp(_dao, disputableVotingId, initializeData));
    }

    function _createDisputableVotingPermissions(ACL _acl, DisputableVoting _voting, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, address(_voting), _voting.CHANGE_VOTE_TIME_ROLE(), _manager);
        _acl.createPermission(_grantee, address(_voting), _voting.CHANGE_SUPPORT_ROLE(), _manager);
        _acl.createPermission(_grantee, address(_voting), _voting.CHANGE_QUORUM_ROLE(), _manager);
        _acl.createPermission(_grantee, address(_voting), _voting.CHANGE_DELEGATED_VOTING_PERIOD_ROLE(), _manager);
        _acl.createPermission(_grantee, address(_voting), _voting.CHANGE_QUIET_ENDING_ROLE(), _manager);
        _acl.createPermission(_grantee, address(_voting), _voting.CHANGE_EXECUTION_DELAY_ROLE(), _manager);
    }

    /* VOTING AGGREGATOR */

    function _installVotingAggregatorApp(Kernel _dao, MiniMeToken _votingToken) internal returns (VotingAggregator) {
        bytes memory initializeData = abi.encodeWithSelector(
            VotingAggregator(0).initialize.selector,
            _votingToken.name(),
            _votingToken.symbol(),
            _votingToken.decimals()
        );
        return VotingAggregator(_installNonDefaultApp(_dao, votingAggregatorId, initializeData));
    }

    function _createVotingAggregatorPermissions(ACL _acl, VotingAggregator _votingAggregator, address _grantee, address _manager) internal {
        _acl.createPermission(_grantee, address(_votingAggregator), _votingAggregator.MANAGE_POWER_SOURCE_ROLE(), _manager);
        _acl.createPermission(_grantee, address(_votingAggregator), _votingAggregator.MANAGE_WEIGHTS_ROLE(), _manager);
    }

    /* EVM SCRIPTS */

    function _createEvmScriptsRegistryPermissions(ACL _acl, address _grantee, address _manager) internal {
        EVMScriptRegistry registry = EVMScriptRegistry(_acl.getEVMScriptRegistry());
        _acl.createPermission(_grantee, address(registry), registry.REGISTRY_MANAGER_ROLE(), _manager);
        _acl.createPermission(_grantee, address(registry), registry.REGISTRY_ADD_EXECUTOR_ROLE(), _manager);
    }

    /* APPS */

    function _installNonDefaultApp(Kernel _dao, bytes32 _appId) internal returns (address) {
        return _installNonDefaultApp(_dao, _appId, new bytes(0));
    }

    function _installNonDefaultApp(Kernel _dao, bytes32 _appId, bytes memory _initializeData) internal returns (address) {
        return _installApp(_dao, _appId, _initializeData, false);
    }

    function _installDefaultApp(Kernel _dao, bytes32 _appId) internal returns (address) {
        return _installDefaultApp(_dao, _appId, new bytes(0));
    }

    function _installDefaultApp(Kernel _dao, bytes32 _appId, bytes memory _initializeData) internal returns (address) {
        return _installApp(_dao, _appId, _initializeData, true);
    }

    function _installApp(Kernel _dao, bytes32 _appId, bytes memory _initializeData, bool _setDefault) internal returns (address) {
        address latestBaseAppAddress = _latestVersionAppBase(_appId);
        address instance = address(_dao.newAppInstance(_appId, latestBaseAppAddress, _initializeData, _setDefault));
        emit InstalledApp(instance, _appId);
        return instance;
    }

    function _latestVersionAppBase(bytes32 _appId) internal view returns (address base) {
        Repo repo = Repo(PublicResolver(ens.resolver(_appId)).addr(_appId));
        (,base,) = repo.getLatest();
    }
}
