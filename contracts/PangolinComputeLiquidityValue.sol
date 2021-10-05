// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import '@pangolindex/exchange-contracts/contracts/pangolin-lib/libraries/Babylonian.sol';
import "@pangolindex/exchange-contracts/contracts/pangolin-periphery/libraries/PangolinLibrary.sol";
import '@pangolindex/exchange-contracts/contracts/pangolin-periphery/libraries/SafeMath.sol';
import '@pangolindex/exchange-contracts/contracts/pangolin-lib/libraries/FullMath.sol';

// library containing some math for dealing with the liquidity shares of a pair, e.g. computing their exact value
// in terms of the underlying tokens
contract PangolinComputeLiquidityValue {
    using SafeMath for uint256;
    address public immutable factory;

    constructor(address factory_) public {
        factory = factory_;
    }
    // computes the direction and magnitude of the profit-maximizing trade
    function computeProfitMaximizingTrade(
        uint256 truePriceTokenA,
        uint256 truePriceTokenB,
        uint256 reserveA,
        uint256 reserveB
    ) pure internal returns (bool aToB, uint256 amountIn) {
        aToB = FullMath.mulDiv(reserveA, truePriceTokenB, reserveB) < truePriceTokenA;

        uint256 invariant = reserveA.mul(reserveB);

        uint256 leftSide = Babylonian.sqrt(
            FullMath.mulDiv(
                invariant.mul(1000),
                aToB ? truePriceTokenA : truePriceTokenB,
                (aToB ? truePriceTokenB : truePriceTokenA).mul(997)
            )
        );
        uint256 rightSide = (aToB ? reserveA.mul(1000) : reserveB.mul(1000)) / 997;

        if (leftSide < rightSide) return (false, 0);

        // compute the amount that must be sent to move the price to the profit-maximizing price
        amountIn = leftSide.sub(rightSide);
    }

    // gets the reserves after an arbitrage moves the price to the profit-maximizing ratio given an externally observed true price
    function getReservesAfterArbitrage(
        address tokenA,
        address tokenB,
        uint256 truePriceTokenA,
        uint256 truePriceTokenB
    ) external view returns (uint256 reserveA, uint256 reserveB) {
        // first get reserves before the swap
        (reserveA, reserveB) = PangolinLibrary.getReserves(factory, tokenA, tokenB);

        require(reserveA > 0 && reserveB > 0, 'PangoArbitrageLibrary: ZERO_PAIR_RESERVES');

        // then compute how much to swap to arb to the true price
        (bool aToB, uint256 amountIn) = computeProfitMaximizingTrade(truePriceTokenA, truePriceTokenB, reserveA, reserveB);

        if (amountIn == 0) {
            return (reserveA, reserveB);
        }

        // now affect the trade to the reserves
        if (aToB) {
            uint amountOut = PangolinLibrary.getAmountOut(amountIn, reserveA, reserveB);
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            uint amountOut = PangolinLibrary.getAmountOut(amountIn, reserveB, reserveA);
            reserveB += amountIn;
            reserveA -= amountOut;
        }
    }

    function getReservesBeforeArbitrage(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external view returns (uint256[] memory reserves) {
        address[] memory path = new address[](2);
        uint amountToken = amount0 == 0 ? amount1 :amount0;

        require(amount0 == 0 || amount1 == 0, 'PangoArbitrageLibrary: ONE_MANDATORY_ZERO_AMOUNT');

        path[0] = amount0 == 0 ? token0 : token1; 
        path[1] = amount0 == 0 ? token1 : token0;
    
        reserves = PangolinLibrary.getAmountsIn(factory, amountToken, path);
    }

    function getReservesDuringArbitrage(
        address token0,
        address token1,
        uint256 amountIn,
        uint256 amountOutMin
    ) external view returns (uint256[] memory amounts) {
        address[] memory path = new address[](2);

        require(amountIn > 0 && amountOutMin > 0, 'PangoArbitrageLibrary: ZERO_PAIR_RESERVES');

        path[0] = token0; 
        path[1] = token1;

        amounts = PangolinLibrary.getAmountsOut(factory, amountIn, path);
    }
}
