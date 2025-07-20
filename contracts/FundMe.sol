// SPDX-License-Identifier: MIT
// ========== Pragma ===============
pragma solidity ^0.8.20;

// ========== Imports ==============
import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';
import './PriceConverter.sol';

// ========== Error Codes ==========
error FundMe__SendMoreETH();
error FundMe__WindowClosed();
error FundMe__WindowNotClosed();
error FundMe__TargetNotReached();
error FundMe__TargetReached();
error FundMe__TransferFailed();
error FundMe__NotOwner();
error FundMe__NoFundForFunder();
error FundMe__UnauthorizedCaller();

// Interface, Libraries, Contracts

/**
 * @title A contract for crowd funding
 * @author ruochen
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
	// ========== Type Declarations ==========
	using PriceConverter for uint256;

	// ========== State Variables ============
	mapping(address => uint256) public funder2Amount;

	uint256 constant MINIMUM_VALUE = 100 * 10 ** 18; // USD
	uint256 constant TARGET = 1000 * 10 ** 18;

	AggregatorV3Interface public dataFeed;

	address public owner;
	uint256 deploymentTimestamp;
	uint256 lockTime;

	address erc20Addr;

	bool public getFundSuccess = false;

	// ========== Events ===============
	event FundWithDrawByOwner(uint256);
	event RefundByFunder(address, uint256);

	// ========== Modifiers =============
	modifier windowClosed() {
		if (block.timestamp < deploymentTimestamp + lockTime)
			revert FundMe__WindowNotClosed();
		_;
	}

	modifier onlyOwner() {
		if (msg.sender != owner) revert FundMe__NotOwner();
		_;
	}

	// ========== Functions ==========
	// order of functions
	// constructor
	// receive function (if exists)
	// fallback function (if exists)
	// external
	// public
	// internal
	// private

	// ========== Constructor ==========
	constructor(uint256 _lockTime, address dataFeedAddr) {
		dataFeed = AggregatorV3Interface(dataFeedAddr);
		owner = msg.sender;
		deploymentTimestamp = block.timestamp;
		lockTime = _lockTime;
	}

	receive() external payable {
		fund();
	}

	fallback() external payable {
		fund();
	}

	function getFund() external windowClosed onlyOwner {
		if (address(this).balance.getConversionRate(dataFeed) < TARGET)
			revert FundMe__TargetNotReached();

		bool success;
		uint256 balance = address(this).balance;
		(success, ) = payable(msg.sender).call{value: balance}('');
		if (!success) revert FundMe__TransferFailed();

		funder2Amount[msg.sender] = 0;
		getFundSuccess = true;

		emit FundWithDrawByOwner(balance);
	}

	function refund() external windowClosed {
		if (address(this).balance.getConversionRate(dataFeed) >= TARGET)
			revert FundMe__TargetReached();
		if (funder2Amount[msg.sender] == 0) revert FundMe__NoFundForFunder();

		bool success;
		uint256 balance = funder2Amount[msg.sender];
		(success, ) = payable(msg.sender).call{value: balance}('');
		if (!success) revert FundMe__TransferFailed();

		funder2Amount[msg.sender] = 0;
		emit RefundByFunder(msg.sender, balance);
	}

	function setFunder2Amount(address funder, uint256 amount2Update) external {
    // only allow FundTokenERC20 contract to call this function
		if (msg.sender != erc20Addr) revert FundMe__UnauthorizedCaller();
		funder2Amount[funder] = amount2Update;
	}

	function transferOwnership(address newOwner) public onlyOwner {
		owner = newOwner;
	}

	/**
	 * @notice This function funds this contract
	 */
	function fund() public payable {
		if (msg.value.getConversionRate(dataFeed) < MINIMUM_VALUE)
			revert FundMe__SendMoreETH();
		if (block.timestamp >= deploymentTimestamp + lockTime)
			revert FundMe__WindowClosed();

		funder2Amount[msg.sender] = msg.value;
	}

	function setErc20Addr(address _erc20Addr) public onlyOwner {
		erc20Addr = _erc20Addr;
	}
}
