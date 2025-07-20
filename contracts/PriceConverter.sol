// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';

library PriceConverter {
	function getPrice(
		AggregatorV3Interface priceFeed
	) internal view returns (uint256) {
		(, int256 answer, , , ) = priceFeed.latestRoundData();
		// answer in 8 digit
		// ETH/USD rate in 18 digit
		return uint256(answer * (10 ** 10));
	}

	function getConversionRate(
		uint256 ethAmount,
		AggregatorV3Interface priceFeed
	) internal view returns (uint256) {
		uint256 ethPrice = getPrice(priceFeed);
		uint256 ethAmountInUsd = (ethPrice * ethAmount) / (10 ** 18);
		// USD * 1e18
		return ethAmountInUsd;
	}
}
