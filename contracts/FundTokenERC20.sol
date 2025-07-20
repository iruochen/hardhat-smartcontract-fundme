// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

error FundTokenERC20__InsufficientMintAllowance(
	uint256 requested,
	uint256 available
);
error FundTokenERC20__InsufficientTokenBalance(
	uint256 requested,
	uint256 available
);
error FundTokenERC20__FundMeNotCompleted();

interface IFundMe {
	function funder2Amount(address funder) external view returns (uint256);
	function getFundSuccess() external view returns (bool);
	function setFunder2Amount(address funder, uint256 amount2Update) external;
}

contract FundTokenERC20 is ERC20 {
	IFundMe public fundMe;

	modifier fundMeSuccess() {
		if (!fundMe.getFundSuccess()) {
			revert FundTokenERC20__FundMeNotCompleted();
		}
		_;
	}

	constructor(address fundMeAddr) ERC20('FundTokenERC20', 'FT') {
		fundMe = IFundMe(payable(fundMeAddr));
	}

	function mint(uint256 amount2Mint) external fundMeSuccess {
		uint256 available = fundMe.funder2Amount(msg.sender);
		if (available < amount2Mint) {
			revert FundTokenERC20__InsufficientMintAllowance(amount2Mint, available);
		}

		_mint(msg.sender, amount2Mint);
		fundMe.setFunder2Amount(msg.sender, available - amount2Mint);
	}

	function claim(uint256 amount2Claim) external fundMeSuccess {
		uint256 balance = balanceOf(msg.sender);
		if (balance < amount2Claim) {
			revert FundTokenERC20__InsufficientTokenBalance(amount2Claim, balance);
		}
		_burn(msg.sender, amount2Claim);
	}
}
