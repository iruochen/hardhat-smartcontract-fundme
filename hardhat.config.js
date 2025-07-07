require("@nomicfoundation/hardhat-toolbox")
require("@chainlink/env-enc").config()

const SEPOLIA_URL = process.env.SEPOLIA_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // in-process, default configuration
  // defaultNetwork: "hardhat",
  solidity: "0.8.24",
  networks: {
    sepolia: {
      // alchemy app url
      url: SEPOLIA_URL,
      // metamask private key
      accounts: [PRIVATE_KEY, PRIVATE_KEY_1],
      // chainlist.org
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: {
      // for verify
      sepolia: ETHERSCAN_API_KEY
    }
  }
};
