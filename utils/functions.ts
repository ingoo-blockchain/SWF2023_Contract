import { ethers, network } from 'hardhat';

// FORMATTER
// @ts-ignore
export const toWei = (amount, unit = 'ether') =>
    ethers.utils.parseUnits(amount.toString(), unit);

// @ts-ignore
export const fromWei = (amount, unit = 'ether') =>
    ethers.utils.formatUnits(amount.toString(), unit);

// MOVE BLOCK
export async function moveBlocks(amount: number) {
    console.log('Moving Blocks,,,');
    for (let i = 0; i < amount; i++) {
        await network.provider.request({
            method: 'evm_mine',
            params: [],
        });
    }
}

// MOVE TIME
export async function moveTime(amount: number) {
    console.log('Moving blocks,,,');
    await network.provider.send('evm_increaseTime', [amount]);

    console.log(`Moved forward in time ${amount} seconds`);
}
