import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.9',
        settings: {
            optimizer: {
                enabled: true,
                runs: 10000,
            },
        },
    },
    networks: {
        hardhat: {
            forking: {
                url: 'https://ethereum.blockpi.network/v1/rpc/public',
            },
            accounts: {
                mnemonic:
                    'test test test test test test test test test test test junk',
                accountsBalance: '100000000000000000000', // 100 ETH
            },
            blockGasLimit: 30000000,
        },
        // ganache: {},
        // sepolia: {},
    },
};

export default config;
