// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import '@sushiswap/core/contracts/interfaces/IERC20.sol';
import '@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Callee.sol';
import "@sushiswap/core/contracts/uniswapv2/interfaces/IUniswapV2Pair.sol";
import '@sushiswap/core/contracts/uniswapv2/libraries/UniswapV2Library.sol';
import '@sushiswap/core/contracts/uniswapv2/libraries/TransferHelper.sol';

import '@pangolindex/exchange-contracts/contracts/pangolin-periphery/interfaces/IPangolinRouter.sol';

contract FlashSwapSushiPango is IUniswapV2Callee {
  address immutable sushiFactory;

  uint constant deadline = 30000 days;
  IPangolinRouter immutable pangolinRouter;

  constructor(address _pangolinRouter, address _sushiFactory) public {
    sushiFactory = _sushiFactory;  
    pangolinRouter = IPangolinRouter(_pangolinRouter);
  }
    // gets tokens/WAVAX via Uniswap V2 flash swap, swaps for the WAVAX/tokens on Pangolin, repays Uniswap V2, and keeps the rest!
  function uniswapV2Call(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external override {
      address[] memory path = new address[](2);

      uint amountToken = _amount0 == 0 ? _amount1 : _amount0;
      
      address token0 = IUniswapV2Pair(msg.sender).token0(); // fetch the address of token0 AVAX
      address token1 = IUniswapV2Pair(msg.sender).token1(); // fetch the address of token1 USDT

      require(msg.sender == UniswapV2Library.pairFor(sushiFactory, token0, token1), "Unauthorized"); 
      require(_amount0 == 0 || _amount1 == 0, 'FlashSwapSushiPango: ONE_MANDATORY_ZERO_AMOUNT');

      path[0] = _amount0 == 0 ? token0 : token1;
      path[1] = _amount0 == 0 ? token1 : token0;

      IERC20 token = IERC20(_amount0 == 0 ? token1 : token0);
      
      token.approve(address(pangolinRouter), amountToken);

      // no need for require() check, if amount required is not sent sushiRouter will revert
      uint amountRequired = UniswapV2Library.getAmountsIn(sushiFactory, amountToken, path)[0];

      // Need to alternate paths for swapExactTokensForTokens
      path[0] = _amount0 == 0 ? token1 : token0;
      path[1] = _amount0 == 0 ? token0 : token1;

      uint amountReceived = pangolinRouter.swapExactTokensForTokens(amountToken, amountRequired, path, address(this), deadline)[1];
      assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan

      // Swap token to partner token
      token = IERC20(_amount0 == 0 ? token0 : token1);
      TransferHelper.safeTransfer(address(token), msg.sender, amountRequired); // return tokens to Sushiswap pair
      TransferHelper.safeTransfer(address(token), _sender, amountReceived - amountRequired); // PROFIT!!!
  }
}