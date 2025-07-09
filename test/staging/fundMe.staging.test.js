const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { expect } = require("chai")
const { DEVELOPMENT_CHAINS } = require("../../helper-hardhat-config")

DEVELOPMENT_CHAINS.includes(network.name)
    ? describe.skip
    : describe("test fundme contract", async () => {
        let fundMe,
            firstAccount
        beforeEach(async () => {
            await deployments.fixture(["all"])
            firstAccount = (await getNamedAccounts()).firstAccount
            const fundMeDeployment = await deployments.get('FundMe')
            fundMe = await ethers.getContractAt('FundMe', fundMeDeployment.address)
        })

        // test fund and getFund successfully
        it("fund and getFund successfully", async () => {
            // make sure target reached
            await fundMe.fund({ value: ethers.parseEther("0.5") })
            // make sure window closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000))
            // make sure we can get receipt
            const getFundTx = await fundMe.getFund()
            const getFundReceipt = await getFundTx.wait()
            expect(getFundReceipt)
                .to.be.emit(fundMe, "FundWithDrawByOwner")
                .withArgs(ethers.parseEther("0.5"))
        })

        // test fund and refund successfully
        it("fund and refund successfully", async () => {
            // make sure target not reached
            await fundMe.fund({ value: ethers.parseEther("0.1") })
            // make sure window closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000))
            // make sure we can get receipt
            const refundTx = await fundMe.refund()
            const refundReceipt = await refundTx.wait()
            expect(refundReceipt)
                .to.be.emit(fundMe, "RefundByFunder")
                .withArgs(firstAccount, ethers.parseEther("0.1"))
        })

    })