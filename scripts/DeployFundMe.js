// import ethers
// create main function
    // init 2 accounts
    // fund contract with first account
    // check balance of contract
    // fund contract with second account
    // check balance of contract
    // check mapping funders2Amount
// execute main function

const { ethers } = require("hardhat");

async function main() {
    // create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
        
    console.log('contract deploying...')
    // deploy contract from factory
    const fundMe = await fundMeFactory.deploy(10)
    await fundMe.waitForDeployment()
    console.log(`contract has been deployed successfully, contract address is ${fundMe.target}`)

    // verify fundme
    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("waiting for 5 confirmations...")
        await fundMe.deploymentTransaction().wait(5)
        await verifyFundMe(fundMe.target, [10])
    } else {
        console.log("verification skipped...")
    }
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