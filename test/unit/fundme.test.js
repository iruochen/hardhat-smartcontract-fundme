const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")

describe("test fundme contract", async () => {
    let fundMe,
        firstAccount,
        mockV3Aggregator,
        fundMeSecondAccount
    beforeEach(async () => {
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        secondAccount = (await getNamedAccounts()).secondAccount
        const fundMeDeployment = await deployments.get('FundMe')
        mockV3Aggregator = await deployments.get('MockV3Aggregator')
        fundMe = await ethers.getContractAt('FundMe', fundMeDeployment.address)
        fundMeSecondAccount = await ethers.getContract('FundMe', secondAccount)
    })

    it("test if the owner is msg.sender", async () => {
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.owner()), firstAccount)
    })

    it("test if the dataFeed is assigned corrently", async () => {
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.dataFeed()), mockV3Aggregator.address)
    })

    // fund, getFund, reFund
    // unit test for fund
    // window open, value greater than minimum value, funder balance
    it("window closed, value is greater than minimum value, fund failed", async () => {
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        // value is greater than minimum value
        expect(fundMe.fund({ value: ethers.parseEther("0.1") }))
            .to.be.revertedWith("Window is closed")
    })

    it("window open, value is lesst than minimum, fund failed", async () => {
        expect(fundMe.fund({ value: ethers.parseEther("0.01") }))
            .to.be.revertedWith("Send more ETH")
    })

    it("window open, value is greater than minimum, fund success", async () => {
        // greater than minimum
        await fundMe.fund({ value: ethers.parseEther("0.1") })
        const balance = await fundMe.funder2Amount(firstAccount)
        expect(balance).to.equal(ethers.parseEther("0.1"))
    })

    // unit for getFund
    // onlyOwner, windowClose, target reached
    it("not onwer, window closed, target reached, getFund failed", async () => {
        // make sure the target is reached
        await fundMe.fund({ value: ethers.parseEther("1") })
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMeSecondAccount.getFund())
            .to.be.revertedWith("This function can only be called by owner")
    })

    it("window open, target reached, getFund failed", async() => {
        // make sure the target is reached
        await fundMe.fund({ value: ethers.parseEther("1") })
        await expect(fundMe.getFund())
            .to.be.revertedWith("Window is not closed")
    })

    it("window closed, target not reached, getFund failed", async() => {
        await fundMe.fund({ value: ethers.parseEther("0.1") })
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.getFund())
            .to.be.revertedWith("Target is not reached")
    })

    it("window closed, target reached, getFund success", async () => {
        await fundMe.fund({ value: ethers.parseEther("1") })
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.getFund())
            .to.emit(fundMe, "FundWithDrawByOwner")
            .withArgs(ethers.parseEther("1"))
    })


    // unit for refund
    // window closed, target not reached, funder has balance
    it("window open, target not reached, funder has balance", async () => {
        await fundMe.fund({ value: ethers.parseEther("0.1") })
        await expect(fundMe.refund())
            .to.be.revertedWith("Window is not closed")
    })

    it("window closed, target reached, funder has balance", async() => {
        await fundMe.fund({ value: ethers.parseEther("1") })
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.refund())
            .to.be.revertedWith("Target is reached")
    })

    it("window closed, target not reached, funder dose not has balance", async() => {
        await fundMe.fund({ value: ethers.parseEther("0.1") })
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMeSecondAccount.refund())
            .to.be.revertedWith("There is no fund for you")
    })

    it("window closed, target not reached, funder has balance", async() => {
        await fundMe.fund({ value: ethers.parseEther("0.1") })
        // make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.refund())
            .to.emit(fundMe, "RefundByFunder")
            .withArgs(firstAccount, ethers.parseEther("0.1"))
    })
})