const DECIMAL = 8
const INITIAL_ANSWER = 3000 * 10 ** 8
const DEVELOPMENT_CHAINS = ['hardhat', 'local']
const LOCK_TIME = 180
const CONFIRMATIONS = 5

const NETWORK_CONFIG = {
    // sepolia
    11155111: {
        ETH_USD_DATA_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
    },
    // bnb smart chain testnet
    97: {
        ETH_USD_DATA_FEED: "0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7"
    }
}

module.exports = {
    DECIMAL,
    INITIAL_ANSWER,
    DEVELOPMENT_CHAINS,
    NETWORK_CONFIG,
    LOCK_TIME,
    CONFIRMATIONS
}