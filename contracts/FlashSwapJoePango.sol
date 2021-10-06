// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import "@traderjoe-xyz/core/contracts/interfaces/IERC20.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoeCallee.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/libraries/JoeLibrary.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoePair.sol";
import "@traderjoe-xyz/core/contracts/traderjoe/libraries/TransferHelper.sol";

import '@pangolindex/exchange-contracts/contracts/pangolin-periphery/interfaces/IPangolinRouter.sol';

contract FlashSwapJoePango is IJoeCallee {
  address immutable joeFactory;

  uint constant deadline = 30000 days;
  IPangolinRouter immutable pangolinRouter;

  constructor(address _pangolinRouter, address _joeFactory) public {
    joeFactory = _joeFactory;
    pangolinRouter = IPangolinRouter(_pangolinRouter);
  }
    // gets tokens/WAVAX via Pangolin flash swap, swaps for the WAVAX/tokens on Pangolin, repays Joe, and keeps the rest!
  function joeCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external override {
      address[] memory path = new address[](2);

      uint amountToken = _amount0 == 0 ? _amount1 : _amount0;
      
      address token0 = IJoePair(msg.sender).token0(); // fetch the address of token0 AVAX
      address token1 = IJoePair(msg.sender).token1(); // fetch the address of token1 USDT

      require(msg.sender == JoeLibrary.pairFor(joeFactory, token0, token1), "Unauthorized"); 
      require(_amount0 == 0 || _amount1 == 0, 'FlashSwapJoePango: ONE_MANDATORY_ZERO_AMOUNT');

      path[0] = _amount0 == 0 ? token0 : token1;
      path[1] = _amount0 == 0 ? token1 : token0;

      IERC20 token = IERC20(_amount0 == 0 ? token1 : token0);
      
      token.approve(address(pangolinRouter), amountToken);

      // no need for require() check, if amount required is not sent pangolinRouter will revert
      uint amountRequired = JoeLibrary.getAmountsIn(joeFactory, amountToken, path)[0];

      // Need to alternate paths for swapExactTokensForTokens
      path[0] = _amount0 == 0 ? token1 : token0;
      path[1] = _amount0 == 0 ? token0 : token1;
  
      uint amountReceived = pangolinRouter.swapExactTokensForTokens(amountToken, amountRequired, path, address(this), deadline)[1];
      assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan

      // Swap token to partner token
      token = IERC20(_amount0 == 0 ? token0 : token1);
      TransferHelper.safeTransfer(address(token), msg.sender, amountRequired); // return tokens to Pangolin pair
      TransferHelper.safeTransfer(address(token), _sender, amountReceived - amountRequired); // PROFIT!!!
  }
}