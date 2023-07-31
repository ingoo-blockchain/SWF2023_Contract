import { ethers } from 'hardhat';
import {
    FUNC_STORE,
    GOVERNOR_CONTRACT,
    KEY,
    MIN_DELAY,
    POSTING,
    POSTING_PROPOSAL_DESCRIPTION,
    PROPOSAL_ID,
    VALUE,
} from '../utils/constants';
import { moveTime } from '../utils/functions';

async function queuedAndExecute() {
    const [deployer, user1, user2, user3, user4] = await ethers.getSigners();

    // GOVERNOR CONTRACT
    const governor = await ethers.getContractAt(
        'GovernorContract',
        GOVERNOR_CONTRACT,
    );
    // POSTING CONTRACT
    const posting = await ethers.getContractAt('Posting', POSTING);

    const encodedFunctionCall = posting.interface.encodeFunctionData(
        FUNC_STORE,
        [KEY, VALUE],
    );
    const descriptionHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(POSTING_PROPOSAL_DESCRIPTION),
    );

    console.log('Queueing,,,');
    const queueTx = await governor.queue(
        [posting.address],
        [0],
        [encodedFunctionCall],
        descriptionHash,
    );
    await queueTx.wait(1);

    const proposalStateAfterQueued = await governor.state(PROPOSAL_ID);
    console.log('proposalStateAfterQueued', proposalStateAfterQueued);

    console.log('Queued Delay,,,,');

    await moveTime(MIN_DELAY + 1);
    // await moveBlocks(1);

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

    const proposalStateAfterExecute = await governor.state(PROPOSAL_ID);
    console.log('proposalStateAfterExecute', proposalStateAfterExecute);
    console.log(`Posting value after execute : ${await posting.retrieve(KEY)}`);
}

queuedAndExecute();
