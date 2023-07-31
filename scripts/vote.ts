import { ethers } from 'hardhat';
import {
    GOVERNOR_CONTRACT,
    PROPOSAL_ID,
    VOTING_PERIOD,
} from '../utils/constants';
import { fromWei, moveBlocks } from '../utils/functions';

async function vote() {
    const [deployer, user1, user2, user3, user4] = await ethers.getSigners();
    const governor = await ethers.getContractAt(
        'GovernorContract',
        GOVERNOR_CONTRACT,
    );

    // VOTING
    const voteTx = await governor.connect(user1).castVote(PROPOSAL_ID, 1);
    await voteTx.wait(1);

    const proposalStateAfterVotes = await governor.state(PROPOSAL_ID);
    console.log('proposalStateAfterVotes', proposalStateAfterVotes);
    console.log('');

    console.log('----- Proposal Votes State -----');
    const proposalVotes = await governor.proposalVotes(PROPOSAL_ID);
    console.log('proposalVotes Against : ', fromWei(proposalVotes[0]));
    console.log('proposalVotes For : ', fromWei(proposalVotes[1]));
    console.log('proposalVotes Abstain : ', fromWei(proposalVotes[2]));

    // MOVING BLOCKS
    await moveBlocks(VOTING_PERIOD + 1);

    const proposalStateAfterPeriod = await governor.state(PROPOSAL_ID);
    // 0:Pending, 1:Active, 2:Canceled, 3:Defeated, 4:Succeeded, 5:Queued, 6:Expired, 7:Executed
    console.log('proposalStateAfterPeriod', proposalStateAfterPeriod);
}

vote();
