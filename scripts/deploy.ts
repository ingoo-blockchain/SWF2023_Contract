import { ethers } from 'hardhat';
import { toWei } from '../utils/functions';
import { Contract } from '@ethersproject/contracts';
import {
    ADDRESS_ZERO,
    MIN_DELAY,
    VOTING_DELAY,
    VOTING_PERIOD,
} from '../utils/constants';

async function deployGovernanceToken() {
    const [deployer] = await ethers.getSigners();

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
    console.log(`deployer of Governance Token : ${deployer.address}}`);

    return { governanceToken };
}

async function deployTimeLock() {
    const [deployer] = await ethers.getSigners();
    const timeLockFactory = await ethers.getContractFactory(
        'TimeLock',
        deployer,
    );
    const timeLock = await timeLockFactory.deploy(MIN_DELAY, [], []);
    await timeLock.deployed();

    console.log(`TimeLock Deployed : ${timeLock.address}`);
    console.log(`deployer of TimeLock : ${deployer.address} `);

    return { timeLock };
}

async function deployGovernor(governanceToken: Contract, timeLock: Contract) {
    const [deployer] = await ethers.getSigners();
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

    console.log(`Governor Deployed : ${governor.address}`);
    console.log(`deployer of Governor : ${deployer.address} `);

    return { governor };
}

async function deployPosting() {
    const [deployer] = await ethers.getSigners();
    const postingFactory = await ethers.getContractFactory('Posting', deployer);
    const posting = await postingFactory.deploy();
    await posting.deployed();

    console.log(`Posting Deployed : ${posting.address}`);
    console.log(`deployer of Posting : ${deployer.address} `);

    return { posting };
}

async function setup(
    timeLock: Contract,
    governor: Contract,
    posting: Contract,
) {
    const [deployer] = await ethers.getSigners();
    const proposerRole = await timeLock.PROPOSER_ROLE();
    const executorRole = await timeLock.EXECUTOR_ROLE();
    const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();

    const deployerOwnTimeLock = await timeLock.hasRole(
        adminRole,
        timeLock.address,
    );
    console.log('deployerOwnTimeLock', deployerOwnTimeLock);

    const proposerTx = await timeLock.grantRole(proposerRole, governor.address); // Only Governor Contract can be a proposer
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
    const transferOwnerTx = await posting.transferOwnership(timeLock.address);
    await transferOwnerTx.wait(1);

    const ownerOfPosting = await posting.owner();
    console.log('ownerOfPosting', ownerOfPosting);
}

async function deploy() {
    const { governanceToken } = await deployGovernanceToken();
    const { timeLock } = await deployTimeLock();
    const { governor } = await deployGovernor(governanceToken, timeLock);
    const { posting } = await deployPosting();

    await setup(timeLock, governor, posting);
}

deploy();
