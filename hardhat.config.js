require('@nomicfoundation/hardhat-toolbox')
require('@chainlink/env-enc').config()
require('hardhat-deploy')
require('@nomicfoundation/hardhat-ethers')
require('hardhat-deploy-ethers')
require('./tasks')

const SEPOLIA_URL = process.env.SEPOLIA_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	// in-process, default configuration
	// defaultNetwork: "hardhat",
	solidity: '0.8.24',
	mocha: {
		// 200s
		timeout: 300000,
	},
	networks: {
		sepolia: {
			// alchemy app url
			url: SEPOLIA_URL,
			// metamask private key
			accounts: [PRIVATE_KEY, PRIVATE_KEY_1],
			// chainlist.org
			chainId: 11155111,
		},
		localhost: {
			url: 'http://127.0.0.1:8545/',
		},
	},
	etherscan: {
		apiKey: {
			// for verify
			sepolia: ETHERSCAN_API_KEY,
		},
	},
	namedAccounts: {
		firstAccount: {
			default: 0,
		},
		secondAccount: {
			default: 1,
		},
	},
	gasReporter: {
		// whether to display gas reporter
		enabled: false,
	},
}
