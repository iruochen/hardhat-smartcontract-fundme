// SPDX-License-Identifier: MIT
// ========== Pragma ===============
pragma solidity ^0.8.20;

// ========== Imports ==============
import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';
import './PriceConverter.sol';

// ========== Error Codes ==========
error FundMe__WindowNotClosed();
error FundMe__TransferFailed();
error FundMe__NotOwner();
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
	mapping(address => uint256) public addressToFunded;
	uint256 constant MINIMUM_VALUE = 100 * 10 ** 18; // USD
	uint256 constant TARGET = 1000 * 10 ** 18;
	AggregatorV3Interface public dataFeed;
	address public owner;
	uint256 deploymentTimestamp;
	uint256 lockTime;
	address erc20Addr;
	bool public withdrawSuccess = false;

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
	/**
	 * constructor
	 * @param _lockTime fund contract lock time, unit is s
	 * @param dataFeedAddr chainlink data feed addr
	 */
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

	function withdraw() external windowClosed onlyOwner {
		require(
			address(this).balance.getConversionRate(dataFeed) >= TARGET,
			'Target is not reached'
		);

		bool success;
		uint256 balance = address(this).balance;
		(success, ) = payable(owner).call{value: balance}('');
		if (!success) revert FundMe__TransferFailed();

		addressToFunded[msg.sender] = 0;
		withdrawSuccess = true;

		emit FundWithDrawByOwner(balance);
	}

	function refund() external windowClosed {
		require(
			address(this).balance.getConversionRate(dataFeed) < TARGET,
			'Target is reached'
		);
		require(addressToFunded[msg.sender] != 0, 'There is no fund for you');

		bool success;
		uint256 balance = addressToFunded[msg.sender];
		(success, ) = payable(msg.sender).call{value: balance}('');
		if (!success) revert FundMe__TransferFailed();

		addressToFunded[msg.sender] = 0;
		emit RefundByFunder(msg.sender, balance);
	}

	function setAddressToFunded(address funder, uint256 amount2Update) external {
		// only allow FundTokenERC20 contract to call this function
		if (msg.sender != erc20Addr) revert FundMe__UnauthorizedCaller();
		addressToFunded[funder] = amount2Update;
	}

	function transferOwnership(address newOwner) public onlyOwner {
		owner = newOwner;
	}

	/**
	 * @notice This function funds this contract, based on the ETH/USD price
	 */
	function fund() public payable {
		// set minimum usd
		require(
			msg.value.getConversionRate(dataFeed) >= MINIMUM_VALUE,
			'Send more ETH'
		);
		// window limit
		require(
			block.timestamp < deploymentTimestamp + lockTime,
			'Window is closed'
		);
		addressToFunded[msg.sender] += msg.value;
	}

	function setErc20Addr(address _erc20Addr) public onlyOwner {
		erc20Addr = _erc20Addr;
	}
}
