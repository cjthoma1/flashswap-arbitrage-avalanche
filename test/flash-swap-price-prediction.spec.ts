import { expect } from "chai";
import { Contract } from "ethers";
import { network, getNamedAccounts } from "hardhat";
import { isLocalEnv, expandTo18Decimals } from "../shared/utilities";
import setupTest from "./test-fixture";

describe("FlashSwapProfitPrediction", () => {
  let Wavax: Contract;
  let Usdt: Contract;
  let PangoComputeLiquidityValue: Contract;
  let UniswapComputeLiquidityValue: Contract;
  let PangoWavaxUsdtPair: Contract;
  let UniswapWavaxUsdtPair: Contract;

  beforeEach(async () => {
    if (isLocalEnv(network.name)) {
      const {
        WAVAX,
        USDT,
        PANGO_COMPUTE_LQUIDITY,
        PANGO_WAVAX_USDT_PAIR,
        UNISWAP_COMPUTE_LQUIDITY,
        UNISWAP_WAVAX_USDT_PAIR,
      } = await setupTest();
      Wavax = WAVAX;
      Usdt = USDT;
      PangoComputeLiquidityValue = PANGO_COMPUTE_LQUIDITY;
      UniswapComputeLiquidityValue = UNISWAP_COMPUTE_LQUIDITY;
      PangoWavaxUsdtPair = PANGO_WAVAX_USDT_PAIR;
      UniswapWavaxUsdtPair = UNISWAP_WAVAX_USDT_PAIR;
    }
  });

  beforeEach(
    "mint some liquidity for Pango and Uniswap/Sushiswap",
    async () => {
      const { deployer } = await getNamedAccounts();

      // add liquidity to Pango at a rate of 1 AVAX / 100 X
      let USTDAmount = expandTo18Decimals(1000);
      let WavaxAmount = expandTo18Decimals(10);
      await Usdt.mint(deployer, USTDAmount);
      await Usdt.transfer(PangoWavaxUsdtPair.address, USTDAmount);

      await Wavax.mint(deployer, WavaxAmount);
      await Wavax.transfer(PangoWavaxUsdtPair.address, WavaxAmount);
      await PangoWavaxUsdtPair.mint(deployer);

      // add liquidity to Sushi at a rate of 1 AVAX / 200 X
      USTDAmount = expandTo18Decimals(2000);
      WavaxAmount = expandTo18Decimals(10);
      await Usdt.mint(deployer, USTDAmount);
      await Usdt.transfer(UniswapWavaxUsdtPair.address, USTDAmount);

      await Wavax.mint(deployer, WavaxAmount);
      await Wavax.transfer(UniswapWavaxUsdtPair.address, WavaxAmount);
      await UniswapWavaxUsdtPair.mint(deployer);
    }
  );

  describe("Profit Predicter", () => {
    it("should predict arbitrage swap for for 1 AVAX / 100 X on Pango and 1 AVAX / 200 X on Sushiswap", async () => {
      const arbitrageAmount = expandTo18Decimals(1);

      // Figure out which token is which
      const PangoPairToken0 = await PangoWavaxUsdtPair.token0();

      let amount0, token0, amount1, token1;

      // If token0 is USDT then set amount0 to 0 else set its value to 1 since its WAVAX
      if (PangoPairToken0 === Usdt.address) {
        amount0 = 0;
        token0 = Usdt.address;
        amount1 = arbitrageAmount;
        token1 = Wavax.address;
      } else {
        amount0 = arbitrageAmount;
        token0 = Wavax.address;
        amount1 = 0;
        token1 = Usdt.address;
      }

      const [pangoReserveA, pangoReserveB] =
        await PangoComputeLiquidityValue.getReservesBeforeArbitrage(
          token0,
          token1,
          amount0,
          amount1
        );

      expect(pangoReserveA).to.eq("111445447453471525689");
      expect(pangoReserveB).to.eq("1000000000000000000");

      // Figure out which token is which
      const UniswapToken0 = await UniswapWavaxUsdtPair.token0();
      // If token0 is USDT then set amount0 to pango reserve amount else set its value to 0 since its WAVAX
      if (UniswapToken0 === Usdt.address) {
        amount0 = pangoReserveA;
        token0 = Usdt.address;
        amount1 = pangoReserveB;
        token1 = Wavax.address;
      } else {
        amount0 = pangoReserveB;
        token0 = Wavax.address;
        amount1 = pangoReserveA;
        token1 = Usdt.address;
      }

      const [uniswapReserveA, uniswapReserveB] =
        await UniswapComputeLiquidityValue.getReservesDuringArbitrage(
          token0,
          token1,
          amount0,
          amount1
        );

      expect(uniswapReserveA).to.eq("1000000000000000000");
      expect(uniswapReserveB).to.eq("181322178776029826316");

      const pricePrediction = uniswapReserveB.sub(pangoReserveA);
      expect(pricePrediction).to.eq("69876731322558300627");
    });
  });
});
