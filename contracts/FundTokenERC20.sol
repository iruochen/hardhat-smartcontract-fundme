// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

error FundTokenERC20__FundMeNotCompleted();

interface IFundMe {
	function getAddressToFunded(address funder) external view returns (uint256);
	function getWithdrawSuccess() external view returns (bool);
	function setAddressToFunded(address funder, uint256 amount2Update) external;
}

contract FundTokenERC20 is ERC20 {
	IFundMe public fundMe;

	modifier fundMeSuccess() {
		if (!fundMe.getWithdrawSuccess()) {
			revert FundTokenERC20__FundMeNotCompleted();
		}
		_;
	}

	constructor(address fundMeAddr) ERC20('FundTokenERC20', 'FT') {
		fundMe = IFundMe(payable(fundMeAddr));
	}

	function mint(uint256 amount2Mint) external fundMeSuccess {
		uint256 available = fundMe.getAddressToFunded(msg.sender);
		require(available >= amount2Mint, 'You can not mint this many tokens');

		_mint(msg.sender, amount2Mint);
		fundMe.setAddressToFunded(msg.sender, available - amount2Mint);
	}

	function claim(uint256 amount2Claim) external fundMeSuccess {
		require(
			balanceOf(msg.sender) >= amount2Claim,
			'You do not have enough ERC20 tokens'
		);
		_burn(msg.sender, amount2Claim);
	}
}
