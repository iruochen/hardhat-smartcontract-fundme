require("@nomicfoundation/hardhat-toolbox")
require("@chainlink/env-enc").config()

const SEPOLIA_URL = process.env.SEPOLIA_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // in-process, default configuration
  // defaultNetwork: "hardhat",
  solidity: "0.8.24",
  networks: {
    sepolia: {
      // alchemy
      url: SEPOLIA_URL,
      // metamask private key
      accounts: [PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY
    }
  }
};
