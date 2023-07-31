import { ethers } from 'hardhat';
import { toWei } from '../utils/functions';

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
    console.log(`deployer of Governance Token : ${deployer}}`);
}

deployGovernanceToken();
