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

      beforeEach(async () => {
        snapshotId = await network.provider.send('evm_snapshot')
        await deployments.fixture(['all'])
        firstAccount = (await getNamedAccounts()).firstAccount
        secondAccount = (await getNamedAccounts()).secondAccount
        const fundMeDeployment = await deployments.get('FundMe')
        mockV3Aggregator = await deployments.get('MockV3Aggregator')
        fundMe = await ethers.getContractAt('FundMe', fundMeDeployment.address)
        fundMeSecondAccount = await ethers.getContract('FundMe', secondAccount)
      })

      afterEach(async () => {
        await network.provider.send('evm_revert', [snapshotId])
      })

      it('test if the owner is msg.sender', async () => {
        await fundMe.waitForDeployment()
        assert.equal(await fundMe.owner(), firstAccount)
      })

      it('test if the dataFeed is assigned corrently', async () => {
        await fundMe.waitForDeployment()
        assert.equal(await fundMe.dataFeed(), mockV3Aggregator.address)
      })

      it('window closed, value is greater than minimum value, fund failed', async () => {
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(
          fundMe.fund({ value: ethers.parseEther('0.1') }),
        ).to.be.revertedWithCustomError(fundMe, 'FundMe__WindowClosed')
      })

      it('window open, value is less than minimum, fund failed', async () => {
        await expect(
          fundMe.fund({ value: ethers.parseEther('0.01') }),
        ).to.be.revertedWithCustomError(fundMe, 'FundMe__SendMoreETH')
      })

      it('window open, value is greater than minimum, fund success', async () => {
        await fundMe.fund({ value: ethers.parseEther('0.1') })
        const balance = await fundMe.funder2Amount(firstAccount)
        expect(balance).to.equal(ethers.parseEther('0.1'))
      })

      it('not owner, window closed, target reached, getFund failed', async () => {
        await fundMe.fund({ value: ethers.parseEther('1') })
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMeSecondAccount.getFund()).to.be.revertedWithCustomError(
          fundMe,
          'FundMe__NotOwner',
        )
      })

      it('window open, target reached, getFund failed', async () => {
        await fundMe.fund({ value: ethers.parseEther('1') })
        await expect(fundMe.getFund()).to.be.revertedWithCustomError(
          fundMe,
          'FundMe__WindowNotClosed',
        )
      })

      it('window closed, target not reached, getFund failed', async () => {
        await fundMe.fund({ value: ethers.parseEther('0.1') })
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.getFund()).to.be.revertedWithCustomError(
          fundMe,
          'FundMe__TargetNotReached',
        )
      })

      it('window closed, target reached, getFund success', async () => {
        await fundMe.fund({ value: ethers.parseEther('1') })
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.getFund())
          .to.emit(fundMe, 'FundWithDrawByOwner')
          .withArgs(ethers.parseEther('1'))
      })

      it('window open, target not reached, funder has balance', async () => {
        await fundMe.fund({ value: ethers.parseEther('0.1') })
        await expect(fundMe.refund()).to.be.revertedWithCustomError(
          fundMe,
          'FundMe__WindowNotClosed',
        )
      })

      it('window closed, target reached, funder has balance', async () => {
        await fundMe.fund({ value: ethers.parseEther('1') })
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.refund()).to.be.revertedWithCustomError(
          fundMe,
          'FundMe__TargetReached',
        )
      })

      it('window closed, target not reached, funder does not have balance', async () => {
        await fundMe.fund({ value: ethers.parseEther('0.1') })
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMeSecondAccount.refund()).to.be.revertedWithCustomError(
          fundMe,
          'FundMe__NoFundForFunder',
        )
      })

      it('window closed, target not reached, funder has balance', async () => {
        await fundMe.fund({ value: ethers.parseEther('0.1') })
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.refund())
          .to.emit(fundMe, 'RefundByFunder')
          .withArgs(firstAccount, ethers.parseEther('0.1'))
      })
    })
