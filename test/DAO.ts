import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers, network } from 'hardhat';
import { fromWei, moveBlocks, moveTime, toWei } from '../utils/functions';
import {
    ADDRESS_ZERO,
    FUNC_STORE,
    KEY,
    VALUE,
    MIN_DELAY,
    PROPOSAL_DESCRIPTION,
    PROPOSAL_DESCRIPTION2,
    VOTING_DELAY,
    VOTING_PERIOD,
    devChains,
} from '../utils/constants';

describe('DAO TEST', () => {
    async function deployContracts() {
        const [deployer, user1, user2, user3, user4] =
            await ethers.getSigners();
        console.log('deployer', deployer.address);
        console.log('user1', user1.address);

        // GOVERNANCE TOKEN CONTRACT
        const governanceTokenFactory = await ethers.getContractFactory(
            'GovernanceToken',
            deployer,
        );
        const governanceToken = await governanceTokenFactory.deploy(
            'PenPoll Token',
            'PP',
            toWei(10000000),
        );
        await governanceToken.deployed();
        console.log(`Governance Token Deployed : ${governanceToken.address}`);

        // TIMELOCK CONTRACT
        const timeLockFactory = await ethers.getContractFactory(
            'TimeLock',
            deployer,
        );
        const timeLock = await timeLockFactory.deploy(MIN_DELAY, [], []);
        await timeLock.deployed();
        console.log(`TimeLock Deployed : ${timeLock.address}`);

        // GOVERNOR CONTRACT
        const governorFactory = await ethers.getContractFactory(
            'GovernorContract',
            deployer,
        );
        const governor = await governorFactory.deploy(
            governanceToken.address,
            timeLock.address,
            VOTING_DELAY,
            VOTING_PERIOD,
        );
        await governor.deployed();
        console.log(`Governor Contract Deployed : ${governor.address}`);

        // POSTING CONTRACT
        const postingFactory = await ethers.getContractFactory(
            'Posting',
            deployer,
        );
        const posting = await postingFactory.deploy();
        await posting.deployed();
        console.log(`Posting Deployed : ${posting.address}`);

        /******************************* SETUP ****************************************/
        const proposerRole = await timeLock.PROPOSER_ROLE();
        const executorRole = await timeLock.EXECUTOR_ROLE();
        const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

        const deployerOwnTimeLock = await timeLock.hasRole(
            adminRole,
            timeLock.address,
        );
        console.log('deployerOwnTimeLock', deployerOwnTimeLock);

        const proposerTx = await timeLock.grantRole(
            proposerRole,
            governor.address,
        ); // Only Governor Contract can be a proposer
        await proposerTx.wait(1);
        const executorTx = await timeLock.grantRole(executorRole, ADDRESS_ZERO); // Anybody can execute
        await executorTx.wait(1);
        const revokeTx = await timeLock.revokeRole(adminRole, deployer.address); // Nobody owns timelock
        await revokeTx.wait(1);

        const deployerOwnTimeLockAfter = await timeLock.hasRole(
            adminRole,
            deployer.address,
        );
        console.log('deployerOwnTimeLockAfter', deployerOwnTimeLockAfter);

        // timeLock should own Posting Contract
        const transferOwnerTx = await posting.transferOwnership(
            timeLock.address,
        );
        await transferOwnerTx.wait(1);

        const ownerOfPosting = await posting.owner();
        console.log('ownerOfPosting', ownerOfPosting);

        console.log('--------------------------------------------------------');
        return {
            governanceToken,
            timeLock,
            governor,
            posting,
            accounts: { deployer, user1, user2, user3, user4 },
        };
    }

    describe('Governance Token', () => {
        const delegate = async (
            governanceTokenAddress: string,
            delegatedAccount: string,
            connnector: any,
        ) => {
            const governanceToken = await ethers.getContractAt(
                'GovernanceToken',
                governanceTokenAddress,
            );
            const tx = await governanceToken
                .connect(connnector)
                .delegate(delegatedAccount);
            await tx.wait(1);

            console.log(
                `Checkpoints ${await governanceToken.numCheckpoints(
                    delegatedAccount,
                )}`,
            );
        };

        it('balances', async () => {
            const {
                governanceToken,
                accounts: { deployer, user1 },
            } = await loadFixture(deployContracts);

            const deployerBalance = await governanceToken.balanceOf(
                deployer.address,
            );
            console.log('deployerBalance', fromWei(deployerBalance));
            const user1Balance = await governanceToken.balanceOf(user1.address);
            console.log('user1Balance', fromWei(user1Balance));
        });

        it.only('delegate gt & propose', async () => {
            const {
                governanceToken,
                governor,
                posting,
                accounts: { deployer, user1, user2, user3, user4 },
            } = await loadFixture(deployContracts);

            // await governanceToken.transfer(user1.address, toWei(2));
            await governanceToken.transfer(user2.address, toWei(3));
            // await governanceToken.transfer(user3.address, toWei(3));
            // await governanceToken.transfer(user4.address, toWei(1));
            const deployerBalance = await governanceToken.balanceOf(
                deployer.address,
            );
            const user1Balance = await governanceToken.balanceOf(user1.address);
            const user2Balance = await governanceToken.balanceOf(user2.address);
            const user3Balance = await governanceToken.balanceOf(user3.address);
            const user4Balance = await governanceToken.balanceOf(user4.address);
            console.log('deployerBalance', fromWei(deployerBalance));
            console.log('user1Balance', fromWei(user1Balance));
            console.log('user2Balance', fromWei(user2Balance));
            console.log('user3Balance', fromWei(user3Balance));
            console.log('user4Balance', fromWei(user4Balance));

            const deployerVotes = await governanceToken.getVotes(
                deployer.address,
            );
            const user1Votes = await governanceToken.getVotes(user1.address);
            const user2Votes = await governanceToken.getVotes(user2.address);
            const user3Votes = await governanceToken.getVotes(user3.address);
            const user4Votes = await governanceToken.getVotes(user4.address);
            console.log(
                'deployerVotes before delegate : ',
                fromWei(deployerVotes),
            );
            console.log('user1Votes before delegate : ', fromWei(user1Votes));
            console.log('user2Votes before delegate : ', fromWei(user2Votes));
            console.log('user3Votes before delegate :', fromWei(user3Votes));
            console.log('user4Votes before delegate :', fromWei(user4Votes));

            await delegate(governanceToken.address, deployer.address, deployer);
            await delegate(governanceToken.address, user1.address, user1);
            await delegate(governanceToken.address, user2.address, user2);
            await delegate(governanceToken.address, user3.address, user3);
            await delegate(governanceToken.address, user4.address, user4);

            const deployerVotesAfter = await governanceToken.getVotes(
                deployer.address,
            );
            const user1VotesAfter = await governanceToken.getVotes(
                user1.address,
            );
            const user2VotesAfter = await governanceToken.getVotes(
                user2.address,
            );
            const user3VotesAfter = await governanceToken.getVotes(
                user3.address,
            );
            const user4VotesAfter = await governanceToken.getVotes(
                user4.address,
            );
            console.log(
                'deployerVotes after delegate : ',
                fromWei(deployerVotesAfter),
            );
            console.log(
                'user1Votes after delegate : ',
                fromWei(user1VotesAfter),
            );
            console.log(
                'user2Votes after delegate : ',
                fromWei(user2VotesAfter),
            );
            console.log(
                'user3Votes after delegate : ',
                fromWei(user3VotesAfter),
            );
            console.log(
                'user4Votes after delegate : ',
                fromWei(user4VotesAfter),
            );

            console.log('');
            console.log('transfer to user1 after delegate');
            await governanceToken.transfer(user1.address, toWei(1));
            const user1VotesAfterTransfer = await governanceToken.getVotes(
                user1.address,
            );
            console.log(
                'user1VotesAfterTransfer',
                fromWei(user1VotesAfterTransfer),
            );

            /************************ Propose *******************************/
            console.log('----------------------------------------------------');

            const valueOfPosting = await posting.retrieve(KEY);
            console.log('valueOfPosting', valueOfPosting);
            const encodedFunctionCall = posting.interface.encodeFunctionData(
                FUNC_STORE,
                [KEY, VALUE],
            );

            console.log(
                `Proposing ${FUNC_STORE} on ${posting.address} with ${[
                    KEY,
                    VALUE,
                ]}`,
            );
            console.log(`Proposal Description: \n ${PROPOSAL_DESCRIPTION}`);
            const proposeTx = await governor
                .connect(user1)
                .propose(
                    [posting.address],
                    [0],
                    [encodedFunctionCall],
                    PROPOSAL_DESCRIPTION,
                );
            const proposeReceipt = await proposeTx.wait(1);

            const proposeTx2 = await governor
                .connect(user1)
                .propose(
                    [posting.address],
                    [0],
                    [encodedFunctionCall],
                    PROPOSAL_DESCRIPTION2,
                );
            const proposeReceipt2 = await proposeTx2.wait(1);

            if (devChains.includes(network.name)) {
                await moveBlocks(VOTING_DELAY + 1);
            }

            // @ts-ignore
            const proposalId = proposeReceipt.events[0].args.proposalId;
            console.log(`Proposed with proposal ID:\n  ${proposalId}`);
            // @ts-ignore
            const proposalId2 = proposeReceipt2.events[0].args.proposalId;
            console.log(`Proposed with proposal ID 2:\n  ${proposalId2}`);

            const proposalState = await governor.state(proposalId);
            const proposalSnapShot = await governor.proposalSnapshot(
                proposalId,
            );
            const proposalDeadline = await governor.proposalDeadline(
                proposalId,
            );

            // the Proposal State is an enum data type, defined in the IGovernor contract.
            // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
            console.log(`Current Proposal State: ${proposalState}`);
            // What block # the proposal was snapshot
            console.log(`Current Proposal Snapshot: ${proposalSnapShot}`);
            // The block number the proposal voting expires
            console.log(`Current Proposal Deadline: ${proposalDeadline}`);

            /************************* Votes *****************************/
            // Against : 0
            // For : 1
            // Abstain : 2
            const voteTx = await governor
                .connect(user1)
                .castVote(proposalId, 0);
            const voteTxReceipt = await voteTx.wait(1);

            const voteTx2 = await governor
                .connect(user2)
                .castVote(proposalId, 1);
            const voteTxReceipt2 = await voteTx2.wait(1);

            const voteTx3 = await governor
                .connect(user3)
                .castVote(proposalId, 2);
            const voteTxReceipt3 = await voteTx3.wait(1);

            const proposalStateAfterVotes = await governor.state(proposalId);
            console.log('proposalStateAfterVotes', proposalStateAfterVotes);
            console.log('');

            console.log('----- Proposal Votes State -----');
            const proposalVotes = await governor.proposalVotes(proposalId);
            console.log('proposalVotes Against : ', fromWei(proposalVotes[0]));
            console.log('proposalVotes For : ', fromWei(proposalVotes[1]));
            console.log('proposalVotes Abstain : ', fromWei(proposalVotes[2]));

            console.log(
                `Posting value (still voting,,) : ${await posting.retrieve(
                    KEY,
                )}`,
            );
            console.log('');

            // proposal2
            const voteTxForProposal2 = await governor
                .connect(user1)
                .castVote(proposalId2, 1);
            const voteTxReceiptForProposal2 = await voteTxForProposal2.wait(1);
            console.log('----- Proposal Votes State 2-----');
            const proposalVotes2 = await governor.proposalVotes(proposalId2);
            console.log('proposalVotes2 Against', fromWei(proposalVotes2[0]));
            console.log('proposalVotes2 For', fromWei(proposalVotes2[1]));
            console.log('proposalVotes2 Abtain', fromWei(proposalVotes2[2]));

            /************************* Voting Period *****************************/
            if (devChains.includes(network.name)) {
                console.log('Moving vote period,,,');
                await moveBlocks(VOTING_PERIOD + 10);
            }

            const proposalStateAfterVotePeriod = await governor.state(
                proposalId,
            );
            console.log(
                'proposalStateAfterVotePeriod',
                proposalStateAfterVotePeriod,
            );
            console.log('');

            /************************* Queued *****************************/
            const descriptionHash = ethers.utils.keccak256(
                ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION),
            );

            console.log('Queueing,,,');
            const queueTx = await governor.queue(
                [posting.address],
                [0],
                [encodedFunctionCall],
                descriptionHash,
            );
            await queueTx.wait(1);

            const proposalStateAfterQueued = await governor.state(proposalId);
            console.log('proposalStateAfterQueued', proposalStateAfterQueued);

            console.log('Queued Delay,,,,');
            if (devChains.includes(network.name)) {
                await moveTime(MIN_DELAY + 1);
                // await moveBlocks(1);
            }
            console.log('');

            /************************* Execute *****************************/
            console.log(
                `Posting value before execute : ${await posting.retrieve(KEY)}`,
            );
            console.log('Executing,,,');
            const executeTx = await governor
                .connect(user1)
                .execute(
                    [posting.address],
                    [0],
                    [encodedFunctionCall],
                    descriptionHash,
                );
            await executeTx.wait(1);

            const proposalStateAfterExecute = await governor.state(proposalId);
            console.log('proposalStateAfterExecute', proposalStateAfterExecute);
            console.log(`Posting value: ${await posting.retrieve(KEY)}`);
        });
    });
});
