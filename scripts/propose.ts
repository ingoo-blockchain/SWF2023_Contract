import { ethers, network } from 'hardhat';
import {
    DEPLOYER,
    FUNC_STORE,
    GOVERNANCE_TOKEN,
    GOVERNOR_CONTRACT,
    KEY,
    POSTING,
    POSTING_PROPOSAL_DESCRIPTION,
    VALUE,
    VOTING_DELAY,
} from '../utils/constants';
import { fromWei, moveBlocks, toWei } from '../utils/functions';

async function propose() {
    const [deployer, user1, user2, user3, user4] = await ethers.getSigners();
    const governanceToken = await ethers.getContractAt(
        'GovernanceToken',
        GOVERNANCE_TOKEN,
    );

    // Deployer token balance
    const balance = await governanceToken.balanceOf(deployer.address);
    const deployerBalance = fromWei(balance);
    console.log(`deployer address : ${deployer.address}`);
    console.log('deployerBalance', deployerBalance);

    await governanceToken.connect(deployer).transfer(user1.address, toWei(1));
    // User1 token balance
    const user1Balance = await governanceToken.balanceOf(user1.address);
    console.log('user1Balance', fromWei(user1Balance));

    // delegate
    await governanceToken.connect(user1).delegate(user1.address);

    // Posting Contract
    const posting = await ethers.getContractAt('Posting', POSTING);
    const encodedFunctionCall = posting.interface.encodeFunctionData(
        FUNC_STORE,
        [KEY, VALUE],
    );

    // Governor Contract
    const governor = await ethers.getContractAt(
        'GovernorContract',
        GOVERNOR_CONTRACT,
    );

    console.log(
        `Proposing ${FUNC_STORE} on ${posting.address} with ${[KEY, VALUE]}`,
    );
    console.log(`Proposal Description: \n ${POSTING_PROPOSAL_DESCRIPTION}`);
    const proposeTx = await governor
        .connect(user1)
        .propose(
            [posting.address],
            [0],
            [encodedFunctionCall],
            POSTING_PROPOSAL_DESCRIPTION,
        );
    const proposeReceipt = await proposeTx.wait(1); // CONFIRMATION

    // @ts-ignore
    const proposalId = proposeReceipt.events[0].args.proposalId;
    console.log(`Proposed with proposal ID: \n  ${proposalId}`);

    // moving blocks
    await moveBlocks(VOTING_DELAY + 1);
    const proposalState = await governor.state(proposalId);
    // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
    console.log(`Current Proposal State: ${proposalState}`);
}

propose();
