# Aragon Network Implementation Spec

## Introduction
The Aragon Network is an internet-based jurisdiction that provides reliable dispute resolution services and other critical infrastructure to individuals and organizations.

Currently, the [Network](https://mainnet.aragon.org/#/network.aragonid.eth) is under the control of a [Governor Council](https://mainnet.aragon.org/#/network/0xda15e525b09266488c95c2742e849ca71683a0f5/) composed of [five voting members](https://blog.aragon.one/aragon-network-deploy/#governor-council) from the Aragon community. At some point in the future control of the Network and its assets will be transferred from the Governor Council to Aragon Network Token (ANT) holders.

Before the transfer can be executed, ANT holders will have to come to a consensus about what the initial state of the Aragon Network organization should be when they assume control. This document describes one such possible organization configuration that could be adopted by ANT holders.

## Implementation overview
The existing Network contract and app configuration is suitable for the Governor Council’s 3-of-5 governance model, but needs adjustment to accommodate the needs of an open organization governed by ANT holders. The Aragon Association proposes the following initial organization configuration for the ANT holder-governed Aragon Network:

### Governance structure

#### Voting rights
Voting rights in the organization are proportional to the amount of ANT controlled by a given Ethereum account. ANT is a transferable ERC-20 token with the contract address `0x960b236a07cf122663c4303350609a66a7b288c0`.

#### Decisions
The Aragon Network will have decision-making authority over:  
- Aragon Network organization apps/contracts and their modifiable parameters  
- Aragon Court contracts and their modifiable parameters

#### Organization specification
Apps installed on the organization and their parameters.

- ACL. Used to set who has permission to initialize permissions.

- Agent 1. Used to interact with Ethereum contracts on behalf of the organization the Agent is installed on.

- Agent 2. Used to interact with Ethereum contracts on behalf of the organization the Agent is installed on. This Agent will be transferred, with the parameters and permission configuration specified in this document, from network.aragonid.eth to the new Aragon Network by the Governor Council after the Aragon Network adopts an Aragon Agreement.

- Agreement. Establishes human-readable guidelines that actions and proposals in the organization must comply with. Actors and proposal authors could have collateral that they have staked slashed if their actions/proposals do not comply with the Agreement.

    - Parameterization:  
      - Arbitrator: `0xee4650cbe7a2b23701d416f58b41d8b76b617797`  
      - Staking pool: TBD  
      - Title: Aragon Network Agreement  
      - Content: https://github.com/aragon/agreement/pull/1/files

    - Disputable Voting 1 parameterization:  
      - Challenge response duration: 24 hours  
      - Collateral token: `0x960b236a07cf122663c4303350609a66a7b288c0`  
      - Action collateral: 100 ANT  
      - Challenge collateral: 100 ANT

    - Disputable Voting 2 parameterization:  
      - Challenge response duration: 24 hours  
      - Collateral token: `0x960b236a07cf122663c4303350609a66a7b288c0`  
      - Action collateral: 10,000 ANT  
      - Challenge collateral: 1,000 ANT

- EVM Script Registry. Enables the management of EVMScripts and EVMScript executors.

- Kernel. Manages apps installed on the organization, including setting the default Vault of the organization.

- Permissions. Allows users to add/grant or remove permissions to members or entities, as needed. It represents the governance structure of the organization.

- Voting Aggregator. Allows users to aggregate voting power over multiple sources.
    - Parameterization:
      - Token: `0x960b236a07cf122663c4303350609a66a7b288c0`  
      - Staking pool: TBD  

- Disputable Voting 1. Used to start new votes and poll tokenholders about specific issues. This Voting app is parameterized for less risky types of proposals (compared to Voting 2: lower approval and support thresholds, shorter vote duration, lower collateral requirements, etc).

    - Parameterization:   
      - Token: Voting aggregator 
      - Support: 66.6666666666666666%  
      - Minimum approval: 0.25%  
      - Duration: 60 hours  
      - Quiet ending:  
        - Quiet ending period: 12 hours  
        - Duration extension: 12 hours  
      - Execution delay: 12 hours  
      - Registered for Agreements: Yes  
      - Disputable parameters:  
        - Challenge response duration: 24 hours  
        - Collateral token: `0x960b236a07cf122663c4303350609a66a7b288c0`  
        - Action collateral: 100 ANT  
        - Challenge collateral: 100 ANT

- Disputable Voting 2. Used to start new votes and poll tokenholders about specific issues. This Voting app is parameterized for more risky types of proposals (compared to Voting 1: higher approval and support thresholds, longer vote duration, higher collateral requirements, etc).

    - Parameterization:  
      - Token: Voting aggregator
      - Support: 66.6666666666666666%  
      - Minimum approval: 10%  
      - Duration: 7 days  
      - Quiet ending:  
        - Quiet ending period: 12 hours  
        - Duration extension: 12 hours  
      - Execution delay: 24 hours  
      - Registered for Agreements: Yes  
      - Disputable parameters:  
        - Challenge response duration: 24 hours  
        - Collateral token: `0x960b236a07cf122663c4303350609a66a7b288c0`  
        - Action collateral: 10,000 ANT  
        - Challenge collateral: 1,000 ANT

#### Permissions
The permissions that will be set on each app are:


| App                 | Permission/Action                 | Grantee         | Manager         |
| -------------       | :-------------:                   | :-------------: | :-------------: |
| ACL                 | Create permissions                | Voting 2        | Voting 2        |
| Agent 1             | Execute action                    | Voting 1        | Voting 2        |
|                     | Run EVM Script                    | Voting 1        | Voting 2        |
|                     | Transfer Agent's tokens           | Voting 1        | Voting 2        |
| Agent 2             | Execute action                    | Voting 2        | Voting 2        |
|                     | Run EVM Script                    | Voting 2        | Voting 2        |
|                     | Transfer Agent's tokens           | Voting 2        | Voting 2        |
| Agreement           | Change Agreement content          | Voting 2        | Voting 2        |
|                     | Manage disputable                 | Voting 2        | Voting 2        |
| EVM Script Registry | Add executors                     | Voting 2        | Voting 2        |
|                     | Enable and disable executors      | Voting 2        | Voting 2        |
| Kernel              | Manage apps                       | Voting 2        | Voting 2        |
| Voting Aggregator   |	Add power source                  | Voting 2      	| Voting 2        |
|                     |	Manage power source               | Voting 2      	| Voting 2        |
|                     |	Manage weights                    | Voting 2      	| Voting 2        |
| Voting 1            | Challenge actions                 | `ANY_ENTITY`    | Voting 2        |
|                     | Create votes                      | `ANY_ENTITY`    | Voting 2        |
|                     | Manage quiet ending configuration | Voting 2        | Voting 2        |
|                     | Modify execution delay            | Voting 2        | Voting 2        |
|                     | Modify overrule window            | Voting 2        | Voting 2        |
|                     | Modify quorum                     | Voting 2        | Voting 2        |
|                     | Modify support                    | Voting 2        | Voting 2        |
|                     | Change vote time                  | Voting 2        | Voting 2        |
|                     | Set Agreement app                 | Agreement       | Voting 2        |
| Voting 2            | Challenge actions                 | `ANY_ENTITY`    | Voting 2        |
|                     | Create votes                      | `ANY_ENTITY`    | Voting 2        |
|                     | Manage quiet ending configuration | Voting 2        | Voting 2        |
|                     | Modify execution delay            | Voting 2        | Voting 2        |
|                     | Modify overrule window            | Voting 2        | Voting 2        |
|                     | Modify quorum                     | Voting 2        | Voting 2        |
|                     | Modify support                    | Voting 2        | Voting 2        |
|                     | Change vote time                  | Voting 2        | Voting 2        |
|                     | Set Agreement app                 | Agreement       | Voting 2        |


### Development needs
Some of the Aragon apps that will be required for this initial configuration will need to either be updated with new changes or built from scratch. Those apps and the new changes needed are:

- Agreement
  - This app makes it possible to dispute proposed actions based on the terms of a human-readable Agreement adopted by the Network.
    - Create Agreement
    - Update Agreement
    - Sign Agreement
    - Manage collateral

- Voting
  - Disputable: proposals can be disputed (taken to Aragon Court) during the time between when a vote starts and when an approved proposal is executed.
  - Delayed Execution: proposals cannot be executed until a specific amount of time has passed since approval.
  - Rolling Snapshot Quiet Ending: If the outcome of a proposal is different at the end of the quiet ending period than it was at the beginning, the vote duration is extended for another specified period of time.
  - Simple Delegation: ANT holders can delegate their voting power to another Ethereum account while retaining transfer control of their tokens.

### Aragon Court changes
The following Aragon Court configuration parameters will be changed by the current Aragon Court Governor Council after the mainnet launch and approval of the Aragon Network by ANT holders.

- Configurations governor - Agent 1
- Funds governor - Agent 2
- Modules governor - Agent 2

## Future configuration changes
While out of scope for the initial Aragon Network configuration, potential changes left for consideration in future updates include:

- Controlling the ANT contract: The Network will take over governance of the modifiable parameters of the ANT contract (currently controlled by the Aragon Community Multisig).
- Controlling certain aragonPM repos: The Network will take over governance of certain aragonPM repos hosting critical infrastructure for the Aragon Network (currently controlled by Aragon One).
- Controlling certain ENS names: The Network will take over governance of certain ENS names (currently controlled by the Aragon Association).
- Locked voting: ANT holders will have to lock their ANT for a specified period of time to be eligible to vote on proposals.
- Voting rewards: ANT holders who participate in Network votes will be financially compensated for their efforts. Rewards could be determined by a specific participation rate target and adjusted upward or downward until the target is met.
- Secret ballot: In the current implementation, votes are publicly linked to voter addresses during and after the vote. The Network could adopt secret ballot technology to protect voter privacy and protect against collusion and bribery.
- Court Governor: This app provides granular control over the governance parameters of Aragon Court contracts and their modifiable parameters. For example, updating the “Modify Final round fees reduction percentage” setting would require the use of Voting 2 while updating the “Juror fee” setting would require the use of Voting 1.
