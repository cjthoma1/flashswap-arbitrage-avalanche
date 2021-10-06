// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import "@pangolindex/exchange-contracts/contracts/pangolin-core/interfaces/IERC20.sol";
import "@pangolindex/exchange-contracts/contracts/pangolin-core/interfaces/IPangolinCallee.sol";
import "@pangolindex/exchange-contracts/contracts/pangolin-periphery/libraries/PangolinLibrary.sol";
import "@pangolindex/exchange-contracts/contracts/pangolin-core/interfaces/IPangolinPair.sol";
import "@pangolindex/exchange-contracts/contracts/pangolin-lib/libraries/TransferHelper.sol";

import "@traderjoe-xyz/core/contracts/traderjoe/interfaces/IJoeRouter02.sol";

contract FlashSwapPangoJoe is IPangolinCallee {
  address immutable pangolinFactory;

  uint constant deadline = 30000 days;
  IJoeRouter02 immutable joeRouter;

  constructor(address _joeRouter, address _pangolinFactory) public {
    pangolinFactory = _pangolinFactory;
    joeRouter = IJoeRouter02(_joeRouter);
  }
    // gets tokens/WAVAX via Pangolin flash swap, swaps for the WAVAX/tokens on Joe, repays Pangolin, and keeps the rest!
  function pangolinCall(address _sender, uint _amount0, uint _amount1, bytes calldata _data) external override {
      address[] memory path = new address[](2);
    
      uint amountToken = _amount0 == 0 ? _amount1 : _amount0;
      
      address token0 = IPangolinPair(msg.sender).token0(); // fetch the address of token0 AVAX
      address token1 = IPangolinPair(msg.sender).token1(); // fetch the address of token1 USDT

      require(msg.sender == PangolinLibrary.pairFor(pangolinFactory, token0, token1), "Unauthorized"); 
      require(_amount0 == 0 || _amount1 == 0, 'FlashSwapPangoJoe: ONE_MANDATORY_ZERO_AMOUNT');

      path[0] = _amount0 == 0 ? token0 : token1;
      path[1] = _amount0 == 0 ? token1 : token0;

      IERC20 token = IERC20(_amount0 == 0 ? token1 : token0);
      
      token.approve(address(joeRouter), amountToken);

      // no need for require() check, if amount required is not sent pangolinRouter will revert
      uint amountRequired = PangolinLibrary.getAmountsIn(pangolinFactory, amountToken, path)[0];

      // Need to alternate paths for swapExactTokensForTokens
      path[0] = _amount0 == 0 ? token1 : token0;
      path[1] = _amount0 == 0 ? token0 : token1;

      uint amountReceived = joeRouter.swapExactTokensForTokens(amountToken, amountRequired, path, address(this), deadline)[1];
      assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan

      // Swap token to partner token
      token = IERC20(_amount0 == 0 ? token0 : token1);
      TransferHelper.safeTransfer(address(token), msg.sender, amountRequired); // return tokens to Pangolin pair
      TransferHelper.safeTransfer(address(token), _sender, amountReceived - amountRequired); // PROFIT!!!
  }
}