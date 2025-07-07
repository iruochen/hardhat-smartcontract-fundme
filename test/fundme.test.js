const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { assert } = require("chai")

describe("test fundme contract", async () => {
    let fundMe, firstAccount
    beforeEach(async () => {
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        const fundMeDeployment = await deployments.get('FundMe')
        fundMe = await ethers.getContractAt('FundMe', fundMeDeployment.address)
    })

    it("test if the owner is msg.sender", async () => {
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.owner()), firstAccount)
    })

    it("test if the dataFeed is assigned corrently", async () => {
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.dataFeed()), "0x694AA1769357215DE4FAC081bf1f309aDC325306")
    })
})