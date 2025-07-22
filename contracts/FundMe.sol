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
	mapping(address => uint256) private s_addressToFunded;
	address private immutable i_owner;
	uint256 constant MINIMUM_VALUE = 100 * 10 ** 18; // USD
	uint256 constant TARGET = 1000 * 10 ** 18;
	uint256 private immutable i_deploymentTimestamp;
	uint256 private immutable i_lockTime;
	address private s_erc20Addr;
	bool private s_withdrawSuccess = false;
	AggregatorV3Interface private s_dataFeed;

	// ========== Events ===============
	event FundWithDrawByOwner(uint256);
	event RefundByFunder(address, uint256);

	// ========== Modifiers =============
	modifier windowClosed() {
		if (block.timestamp < i_deploymentTimestamp + i_lockTime)
			revert FundMe__WindowNotClosed();
		_;
	}

	modifier onlyOwner() {
		if (msg.sender != i_owner) revert FundMe__NotOwner();
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
		s_dataFeed = AggregatorV3Interface(dataFeedAddr);
		i_owner = msg.sender;
		i_deploymentTimestamp = block.timestamp;
		i_lockTime = _lockTime;
	}

	receive() external payable {
		fund();
	}

	fallback() external payable {
		fund();
	}

	function withdraw() external windowClosed onlyOwner {
		require(
			address(this).balance.getConversionRate(s_dataFeed) >= TARGET,
			'Target is not reached'
		);

		bool success;
		uint256 balance = address(this).balance;
		(success, ) = payable(i_owner).call{value: balance}('');
		if (!success) revert FundMe__TransferFailed();

		s_addressToFunded[msg.sender] = 0;
		s_withdrawSuccess = true;

		emit FundWithDrawByOwner(balance);
	}

	function refund() external windowClosed {
		require(
			address(this).balance.getConversionRate(s_dataFeed) < TARGET,
			'Target is reached'
		);
		require(s_addressToFunded[msg.sender] != 0, 'There is no fund for you');

		bool success;
		uint256 balance = s_addressToFunded[msg.sender];
		(success, ) = payable(msg.sender).call{value: balance}('');
		if (!success) revert FundMe__TransferFailed();

		s_addressToFunded[msg.sender] = 0;
		emit RefundByFunder(msg.sender, balance);
	}

	function etAddressToFunded(address funder, uint256 amount2Update) external {
		// only allow FundTokenERC20 contract to call this function
		if (msg.sender != s_erc20Addr) revert FundMe__UnauthorizedCaller();
		s_addressToFunded[funder] = amount2Update;
	}

	/**
	 * @notice This function funds this contract, based on the ETH/USD price
	 */
	function fund() public payable {
		// set minimum usd
		require(
			msg.value.getConversionRate(s_dataFeed) >= MINIMUM_VALUE,
			'Send more ETH'
		);
		// window limit
		require(
			block.timestamp < i_deploymentTimestamp + i_lockTime,
			'Window is closed'
		);
		s_addressToFunded[msg.sender] += msg.value;
	}

	function setErc20Addr(address _erc20Addr) public onlyOwner {
		s_erc20Addr = _erc20Addr;
	}

	function getOwner() public view returns (address) {
		return i_owner;
	}

	function getAddressToFunded(address funder) public view returns (uint256) {
		return s_addressToFunded[funder];
	}

	function getDataFeed() public view returns (AggregatorV3Interface) {
		return s_dataFeed;
	}

	function getDeploymentTimestamp() public view returns (uint256) {
		return i_deploymentTimestamp;
	}

	function getLockTime() public view returns (uint256) {
		return i_lockTime;
	}

	function getErc20Addr() public view returns (address) {
		return s_erc20Addr;
	}

	function getWithdrawSuccess() public view returns (bool) {
		return s_withdrawSuccess;
	}
}
