// function deployFunction() {
//     console.log('this is a deploy function')
// }

// module.exports.default = deployFunction
// module.exports = async(hre) => {
//     const getNamedAccounts = hre.getNamedAccounts
//     const deployments = hre.deployments
//     console.log('this is a deploy function')
// }

const { network } = require('hardhat')
const {
	DEVELOPMENT_CHAINS,
	NETWORK_CONFIG,
	LOCK_TIME,
	CONFIRMATIONS,
} = require('../helper-hardhat-config')
const { verify } = require('../utils/verify')

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { firstAccount } = await getNamedAccounts()
	const { deploy } = deployments

	let dataFeedAddr, confirmations
	if (DEVELOPMENT_CHAINS.includes(network.name)) {
		const mockV3Aggregator = await deployments.get('MockV3Aggregator')
		dataFeedAddr = mockV3Aggregator.address
		confirmations = 0
	} else {
		dataFeedAddr = NETWORK_CONFIG[network.config.chainId].ETH_USD_DATA_FEED
		confirmations = CONFIRMATIONS || 1
	}

	const fundMe = await deploy('FundMe', {
		from: firstAccount,
		args: [LOCK_TIME, dataFeedAddr],
		log: true,
		// wait for block
		waitConfirmations: confirmations,
	})
	// remove deployment directory or add --reset flag if you redeploy contract

	// verify
	if (
		!DEVELOPMENT_CHAINS.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		const args = [LOCK_TIME, dataFeedAddr]
		await verify(fundMe.address, args)
	} else {
		console.log('verification skipped...')
	}
}

module.exports.tags = ['all', 'fundme']
