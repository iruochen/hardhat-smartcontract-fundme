// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract FundMe {
    // 记录投资人
    mapping(address => uint256) public funder2Amount;

    uint256 constant MINIMUM_VALUE = 100 * 10 ** 18; // USD

    AggregatorV3Interface internal dataFeed;

    // 投资目标值
    uint256 constant TARGET = 1000 * 10 ** 18;

    // 合约拥有者
    address public owner;

    // 部署时间戳
    uint256 deploymentTimestamp;
    // 锁定时长
    uint256 lockTime;

    // erc20 地址
    address erc20Addr;

    bool public getFundSuccess = false;

    constructor(uint256 _lockTime) {
        // sepolia testnet
        dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    // 收款函数
    function fund() external payable {
        // 设置最小交易量
        require(convertEth2Usd(msg.value) >= MINIMUM_VALUE, "Send more ETH");
        // 窗口期限制
        require(block.timestamp < deploymentTimestamp + lockTime, "Window is closed");
        funder2Amount[msg.sender] = msg.value;
    }

    /**
     * Returns the latest answer.
     */
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertEth2Usd(uint256 ethAmount) internal view returns(uint256) {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return ethAmount * ethPrice / (10 ** 8);
    }

    /**
    * 提取投资金额
    */
    function getFund() external windowClosed onlyOwner {
        require(convertEth2Usd(address(this).balance) >= TARGET, "Target is not reached");
        // transfer: transfer ETH and revert if tx failed
        // payable(msg.sender).transfer(address(this).balance);

        // send: transfer ETH and return false if failed
        // bool success = payable(msg.sender).send(address(this).balance);
        // require(success, "tx failed");

        // call: transfer ETH with data return value of function and bool
        bool success;
        (success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "transfer tx failed");
        funder2Amount[msg.sender] = 0;
        getFundSuccess = true; // flag
    }

    /**
    * 修改投资拥有者
    */
    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    /**
    * 退回投资金额
    */
    function refund() external windowClosed {
        require(convertEth2Usd(address(this).balance) < TARGET, "Target is reached");
        require(funder2Amount[msg.sender] != 0, "There is no fund for you");
        bool success;
        (success, ) = payable(msg.sender).call{value: funder2Amount[msg.sender]}("");
        require(success, "transfer tx failed");
        funder2Amount[msg.sender] = 0;
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }

    function setFunder2Amount(address funder, uint256 amount2Update) external {
        require(msg.sender == erc20Addr, "You do not have permission to call this function");
        funder2Amount[funder] = amount2Update;
    }

    modifier windowClosed() {
        require(block.timestamp >= deploymentTimestamp + lockTime, "Window is not closed");
        // 先执行上面语句，再执行函数后续操作
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "This function can only be called by owner");
        _;
    }

}