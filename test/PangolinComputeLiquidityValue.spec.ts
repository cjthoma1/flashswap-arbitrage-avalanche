import { expect } from "chai";
import { Contract } from "ethers";
import { network, getNamedAccounts } from "hardhat";
import { isLocalEnv, expandTo18Decimals } from "../shared/utilities";
import setupTest from "./test-fixture";

describe("PangoComputeLiquidityValue", () => {
  let Wavax: Contract;
  let Usdt: Contract;
  let ComputeLiquidityValue: Contract;
  let WavaxUsdtPair: Contract;

  beforeEach(async () => {
    if (isLocalEnv(network.name)) {
      const { WAVAX, USDT, PANGO_COMPUTE_LQUIDITY, PANGO_WAVAX_USDT_PAIR } =
        await setupTest();
      Wavax = WAVAX;
      Usdt = USDT;
      ComputeLiquidityValue = PANGO_COMPUTE_LQUIDITY;
      WavaxUsdtPair = PANGO_WAVAX_USDT_PAIR;
    }
  });

  beforeEach(
    "mint some liquidity for the pair at 1:100 (100 shares minted)",
    async () => {
      const { deployer } = await getNamedAccounts();

      // add liquidity to Pango at a rate of 1 AVAX / 100 X
      const USDTPangoAmount = expandTo18Decimals(1000);
      const AvaxPangoAmount = expandTo18Decimals(10);
      await Usdt.mint(deployer, USDTPangoAmount);
      await Usdt.transfer(WavaxUsdtPair.address, USDTPangoAmount);

      await Wavax.mint(deployer, AvaxPangoAmount);
      await Wavax.transfer(WavaxUsdtPair.address, AvaxPangoAmount);
      await WavaxUsdtPair.mint(deployer);
      expect(await WavaxUsdtPair.totalSupply()).to.eq(expandTo18Decimals(100));
    }
  );

  describe("#getReservesAfterArbitrage", () => {
    it("1/400", async () => {
      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesAfterArbitrage(
          Wavax.address,
          Usdt.address,
          1,
          400
        );
      expect(reserveA).to.eq("5007516917298542016");
      expect(reserveB).to.eq("1999997739838173075192");
    });
    it("1/200", async () => {
      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesAfterArbitrage(
          Wavax.address,
          Usdt.address,
          1,
          200
        );
      expect(reserveA).to.eq("7081698338256310291");
      expect(reserveB).to.eq("1413330640570018326894");
    });
    it("1/100 (same price)", async () => {
      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesAfterArbitrage(
          Wavax.address,
          Usdt.address,
          1,
          100
        );
      expect(reserveA).to.eq("10000000000000000000");
      expect(reserveB).to.eq("1000000000000000000000");
    });
    it("1/50", async () => {
      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesAfterArbitrage(
          Wavax.address,
          Usdt.address,
          1,
          50
        );
      expect(reserveA).to.eq("14133306405700183269");
      expect(reserveB).to.eq("708169833825631029041");
    });
    it("1/25", async () => {
      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesAfterArbitrage(
          Wavax.address,
          Usdt.address,
          1,
          25
        );
      expect(reserveA).to.eq("19999977398381730752");
      expect(reserveB).to.eq("500751691729854201595");
    });
    it("25/1", async () => {
      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesAfterArbitrage(
          Wavax.address,
          Usdt.address,
          25,
          1
        );
      expect(reserveA).to.eq("500721601459041764285");
      expect(reserveB).to.eq("20030067669194168064");
    });
    it("works with large numbers for the price", async () => {
      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesAfterArbitrage(
          Wavax.address,
          Usdt.address,
          ethers.constants.MaxUint256.div(1000),
          ethers.constants.MaxUint256.div(1000)
        );
      // diff of 30 bips
      expect(reserveA).to.eq("100120248075158403008");
      expect(reserveB).to.eq("100150338345970840319");
    });
  });

  describe("#getReservesBeforeArbitrage", () => {
    it("1/0", async () => {
      const arbitrageAmount = expandTo18Decimals(1);

      // Figure out which token is which
      const PangoPairToken0 = await WavaxUsdtPair.token0();

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

      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesBeforeArbitrage(
          token0,
          token1,
          amount0,
          amount1
        );

      expect(reserveA).to.eq("111445447453471525689");
      expect(reserveB).to.eq("1000000000000000000");
    });
  });

  describe("#getReservesDuringArbitrage", () => {
    it("1/100", async () => {
      const arbitrageAmount = expandTo18Decimals(1);

      // Figure out which token is which
      const PangoPairToken0 = await WavaxUsdtPair.token0();

      let amount0, token0, amount1, token1;

      // If token0 is USDT then set amount0 to 0 else set its value to 1 since its WAVAX
      if (PangoPairToken0 === Usdt.address) {
        amount0 = 100;
        token0 = Usdt.address;
        amount1 = arbitrageAmount;
        token1 = Wavax.address;
      } else {
        amount0 = arbitrageAmount;
        token0 = Wavax.address;
        amount1 = 100;
        token1 = Usdt.address;
      }

      const [reserveA, reserveB] =
        await ComputeLiquidityValue.getReservesDuringArbitrage(
          token0,
          token1,
          amount0,
          amount1
        );

      expect(reserveA).to.eq("1000000000000000000");
      expect(reserveB).to.eq("90661089388014913158");
    });
  });
});
