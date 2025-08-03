require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "irys-testnet": {
      url: process.env.IRYS_TESTNET_RPC || "https://testnet-rpc.irys.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1338, // Irys testnet chain ID
      gasPrice: 1000000000, // 1 gwei
    },
    "irys-mainnet": {
      url: process.env.IRYS_MAINNET_RPC || "https://rpc.irys.xyz",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1339, // Irys mainnet chain ID
      gasPrice: 2000000000, // 2 gwei
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      "irys-testnet": process.env.IRYS_API_KEY || "dummy",
      "irys-mainnet": process.env.IRYS_API_KEY || "dummy",
    },
    customChains: [
      {
        network: "irys-testnet",
        chainId: 1338,
        urls: {
          apiURL: "https://testnet-explorer.irys.xyz/api",
          browserURL: "https://testnet-explorer.irys.xyz"
        }
      },
      {
        network: "irys-mainnet",
        chainId: 1339,
        urls: {
          apiURL: "https://explorer.irys.xyz/api",
          browserURL: "https://explorer.irys.xyz"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};