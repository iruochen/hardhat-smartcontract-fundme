// import ethers
// create main function
// execute main function

const { ethers } = require("hardhat")

async function main() {
    // create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
        
    console.log('contract deploying...')
    // deploy contract from factory
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()
    console.log(`contract has been deployed successfully, contract address is ${fundMe.target}`)

    // verify fundme
    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("waiting for 5 confirmations...")
        await fundMe.deploymentTransaction().wait(5)
        await verifyFundMe(fundMe.target, [300])
    } else {
        console.log("verification skipped...")
    }

    // init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners()
    // fund contract with first account
    const fundTx = await fundMe.fund({value: ethers.parseEther("0.5")})
    // wait for complete
    await fundTx.wait()

    // check balance of contract
    const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContract}`)

    // fund contract with second account
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.5")})
    await fundTxWithSecondAccount.wait()

    // check balance of contract
    const balanceOfContractAfterSecond = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContractAfterSecond}`)

    // check mapping funder2Amount
    const firstAccountBalanceInFundMe = await fundMe.funder2Amount(firstAccount.address)
    const secondAccountBalanceInFundMe = await fundMe.funder2Amount(secondAccount.address)
    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`)
    console.log(`Balance of first account ${secondAccount.address} is ${secondAccountBalanceInFundMe}`)
}

async function verifyFundMe(fundMeAddr, args) {
    console.log('verifying contract...')
    // contract auto verify
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
    });
    console.log("✅ verification complete")
}


main().then().catch((error) => {
    console.error("❌ Deployment or verification failed:", error)
    process.exit(1)
})