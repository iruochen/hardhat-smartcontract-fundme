const { ethers, deployments, getNamedAccounts, network } = require('hardhat')
const { assert, expect } = require('chai')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const { DEVELOPMENT_CHAINS } = require('../../helper-hardhat-config')

!DEVELOPMENT_CHAINS.includes(network.name)
	? describe.skip
	: describe('test fundme contract', async () => {
			let fundMe,
				firstAccount,
				mockV3Aggregator,
				fundMeSecondAccount,
				snapshotId

			const ONE_ETH = ethers.parseEther('1')
			const POINT_ONE_ETH = ethers.parseEther('0.1')
			const POINT_ZERO_ONE_ETH = ethers.parseEther('0.01')
			const TIME_INCREMENT = 200

			before(async () => {
				await deployments.fixture(['all'])

				const accounts = await getNamedAccounts()
				firstAccount = accounts.firstAccount
				secondAccount = accounts.secondAccount

				const fundMeDeployment = await deployments.get('FundMe')
				mockV3Aggregator = await deployments.get('MockV3Aggregator')

				fundMe = await ethers.getContractAt('FundMe', fundMeDeployment.address)
				const secondSinger = await ethers.getSigner(secondAccount)
				fundMeSecondAccount = fundMe.connect(secondSinger)
				// fundMeSecondAccount = await ethers.getContract('FundMe', secondSinger)
			})

			beforeEach(async () => {
				snapshotId = await network.provider.send('evm_snapshot')
			})

			afterEach(async () => {
				await network.provider.send('evm_revert', [snapshotId])
			})

			describe('constructor', async () => {
				it('test if the owner is msg.sender', async () => {
					assert.equal(await fundMe.getOwner(), firstAccount)
				})

				it('test if the dataFeed is assigned currently', async () => {
					assert.equal(await fundMe.getDataFeed(), mockV3Aggregator.address)
				})
			})

			describe('fund', async () => {
				it('window closed, value is greater than minimum value, fund failed', async () => {
					await helpers.time.increase(200)
					await helpers.mine()
					await expect(
						fundMe.fund({ value: POINT_ONE_ETH }),
					).to.be.revertedWith('Window is closed')
				})

				it('window open, value is less than minimum, fund failed', async () => {
					await expect(
						fundMe.fund({ value: POINT_ZERO_ONE_ETH }),
					).to.be.revertedWith('Send more ETH')
				})

				it('window open, value is greater than minimum, fund success', async () => {
					await fundMe.fund({ value: POINT_ONE_ETH })
					const balance = await fundMe.getAddressToFunded(firstAccount)
					expect(balance).to.equal(POINT_ONE_ETH)
				})
			})

			describe('withdraw', async () => {
				it('not owner, window closed, target reached, withdraw failed', async () => {
					await fundMe.fund({ value: ONE_ETH })
					await helpers.time.increase(TIME_INCREMENT)
					await helpers.mine()
					await expect(
						fundMeSecondAccount.withdraw(),
					).to.be.revertedWithCustomError(fundMe, 'FundMe__NotOwner')
				})

				it('window open, target reached, withdraw failed', async () => {
					await fundMe.fund({ value: ONE_ETH })
					await expect(fundMe.withdraw()).to.be.revertedWithCustomError(
						fundMe,
						'FundMe__WindowNotClosed',
					)
				})

				it('window closed, target not reached, withdraw failed', async () => {
					await fundMe.fund({ value: POINT_ONE_ETH })
					await helpers.time.increase(TIME_INCREMENT)
					await helpers.mine()
					await expect(fundMe.withdraw()).to.be.revertedWith(
						'Target is not reached',
					)
				})

				it('window closed, target reached, withdraw success', async () => {
					await fundMe.fund({ value: ONE_ETH })
					const startingFundMeBalance = await ethers.provider.getBalance(
						fundMe.target,
					)
					const startingDeployerBalance =
						await ethers.provider.getBalance(firstAccount)

					await helpers.time.increase(TIME_INCREMENT)
					await helpers.mine()
					const txResponse = await fundMe.withdraw()
					const txReceipt = await txResponse.wait()

					const { gasUsed, gasPrice } = txReceipt
					const gasCost = gasUsed * gasPrice

					const endingFundMeBalance = await ethers.provider.getBalance(
						fundMe.target,
					)
					const endingDeployerBalance =
						await ethers.provider.getBalance(firstAccount)

					expect(txResponse)
						.to.emit(fundMe, 'FundWithDrawByOwner')
						.withArgs(ONE_ETH)
					expect(await fundMe.getWithdrawSuccess()).to.be.true
					assert.equal(endingFundMeBalance, 0)
					assert.equal(
						startingFundMeBalance + startingDeployerBalance,
						endingDeployerBalance + gasCost,
					)
				})
			})

			describe('refund', async () => {
				it('window open, target not reached, funder has balance', async () => {
					await fundMe.fund({ value: POINT_ONE_ETH })
					await expect(fundMe.refund()).to.be.revertedWithCustomError(
						fundMe,
						'FundMe__WindowNotClosed',
					)
				})

				it('window closed, target reached, funder has balance', async () => {
					await fundMe.fund({ value: ONE_ETH })
					await helpers.time.increase(TIME_INCREMENT)
					await helpers.mine()
					await expect(fundMe.refund()).to.be.revertedWith('Target is reached')
				})

				it('window closed, target not reached, funder does not have balance', async () => {
					await fundMe.fund({ value: POINT_ONE_ETH })
					await helpers.time.increase(TIME_INCREMENT)
					await helpers.mine()
					await expect(fundMeSecondAccount.refund()).to.be.revertedWith(
						'There is no fund for you',
					)
				})

				it('window closed, target not reached, funder has balance', async () => {
					await fundMe.fund({ value: POINT_ONE_ETH })
					await helpers.time.increase(TIME_INCREMENT)
					await helpers.mine()
					await expect(fundMe.refund())
						.to.emit(fundMe, 'RefundByFunder')
						.withArgs(firstAccount, POINT_ONE_ETH)
				})
			})
		})
