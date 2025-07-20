const { run } = require('hardhat')

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

const verify = async (contractAddress, args, retries = 5) => {
	console.log('verifying contract...')
	for (let i = 0; i < retries; i++) {
		try {
			await run('verify:verify', {
				address: contractAddress,
				constructorArguments: args,
			})
			console.log('✅ verification complete')
			return
		} catch (e) {
			if (e.message.toLowerCase().includes('already verified')) {
				console.log('Already verified!')
			} else {
				console.log(
					`🔁 retry ${i + 1}: waiting before retrying verification...`,
				)
				await sleep(10000)
			}
		}
		console.error('❌ verification failed after retries.')
	}
}

module.exports = { verify }
