import { deployments } from "hardhat";
import PangolinFactory from "@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/PangolinFactory.sol/PangolinFactory.json";
import PangolinRouter from "@pangolindex/exchange-contracts/artifacts/contracts/pangolin-periphery/PangolinRouter.sol/PangolinRouter.json";
import UniswapV2Factory from "./test-artifacts/sushiswap/UniswapV2Factory.json";
import UniswapV2Router02 from "./test-artifacts/sushiswap/UniswapV2Router02.json";
import { expandTo18Decimals } from "../shared/utilities";
import { Contract } from "ethers";

export interface V2Fixture {
  WAVAX: Contract;
  USDT: Contract;
  PANGO_FACTORY: Contract;
  UNISWAP_V2_FACTORY: Contract;
  PANGO_WAVAX_USDT_PAIR: Contract;
  UNISWAP_WAVAX_USDT_PAIR: Contract;
  SUSHI_SWAP_ROUTER: Contract;
  FLASH_SWAP_PANGO: Contract;
  FLASH_SWAP_SUSHI: Contract;
  PANGO_COMPUTE_LQUIDITY: Contract;
  UNISWAP_COMPUTE_LQUIDITY: Contract;
}

const setupTest = deployments.createFixture(
  async (
    { deployments, getNamedAccounts, ethers },
    options
  ): Promise<V2Fixture> => {
    // await deployments.fixture(); // ensure you start from a fresh deployments
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const signers = await ethers.getSigners();

    // Deploy tokens
    const wavax = await deploy("WAVAX", {
      from: deployer,
      log: true,
      contract: "ExampleERC20",
      args: ["WAVAX", "WAVAX", expandTo18Decimals(10000)],
    });
    const WAVAX = new Contract(wavax.address, wavax.abi, signers[0]);

    const usdt = await deploy("USDT", {
      from: deployer,
      log: true,
      contract: "ExampleERC20",
      args: ["Tether", "USDT", expandTo18Decimals(10000)],
    });
    const USDT = new Contract(usdt.address, usdt.abi, signers[0]);

    // deploy PangoFactory
    const pangolinFactory = await deploy("PangolinFactory", {
      from: deployer,
      log: true,
      contract: PangolinFactory,
      args: [deployer],
    });
    const PANGO_FACTORY = new Contract(
      pangolinFactory.address,
      pangolinFactory.abi,
      signers[0]
    );

    // deploy Uniswap Factory
    const uniswapFactory = await deploy("UniswapV2Factory", {
      from: deployer,
      log: true,
      contract: UniswapV2Factory,
      args: [deployer],
    });
    const UNISWAP_V2_FACTORY = new Contract(
      uniswapFactory.address,
      uniswapFactory.abi,
      signers[0]
    );

    const sushiSwapRouter = await deploy("UniswapV2Router02", {
      from: deployer,
      log: true,
      contract: UniswapV2Router02,
      args: [UNISWAP_V2_FACTORY.address, WAVAX.address],
    });

    const SUSHI_SWAP_ROUTER = new Contract(
      sushiSwapRouter.address,
      sushiSwapRouter.abi,
      signers[0]
    );

    const pangolinRouter = await deploy("PangolinRouter", {
      from: deployer,
      log: true,
      contract: PangolinRouter,
      args: [PANGO_FACTORY.address, WAVAX.address],
    });

    const PANGOLIN_ROUTER = new Contract(
      pangolinRouter.address,
      pangolinRouter.abi,
      signers[0]
    );

    await PANGO_FACTORY.createPair(WAVAX.address, USDT.address);
    const PANGO_WAVAX_USDT_PAIR_ADDRESS = await PANGO_FACTORY.getPair(
      WAVAX.address,
      USDT.address
    );
    const PangoPair = await deployments.getArtifact("IPangolinPair");
    const PANGO_WAVAX_USDT_PAIR = new Contract(
      PANGO_WAVAX_USDT_PAIR_ADDRESS,
      PangoPair.abi,
      signers[1]
    );

    await UNISWAP_V2_FACTORY.createPair(WAVAX.address, USDT.address);
    const UNISWAP_WAVAX_USDT_PAIR_ADDRESS = await UNISWAP_V2_FACTORY.getPair(
      WAVAX.address,
      USDT.address
    );
    const IUniswapV2Pair = await deployments.getArtifact("IUniswapV2Pair");
    const UNISWAP_WAVAX_USDT_PAIR = new Contract(
      UNISWAP_WAVAX_USDT_PAIR_ADDRESS,
      IUniswapV2Pair.abi,
      signers[1]
    );

    const flashSwapPangolinSushi = await deploy("FlashSwapPangolinSushi", {
      from: deployer,
      log: true,
      args: [SUSHI_SWAP_ROUTER.address, PANGO_FACTORY.address],
    });

    const flashSwapSushiPango = await deploy("FlashSwapSushiPango", {
      from: deployer,
      log: true,
      args: [PANGOLIN_ROUTER.address, UNISWAP_V2_FACTORY.address],
    });

    const pangolinCompute = await deploy("PangolinComputeLiquidityValue", {
      from: deployer,
      log: true,
      args: [PANGO_FACTORY.address],
    });

    const sushiswapCompute = await deploy("SushiswapV2ComputeLiquidityValue", {
      from: deployer,
      log: true,
      args: [UNISWAP_V2_FACTORY.address],
    });

    const FLASH_SWAP_PANGO = new Contract(
      flashSwapPangolinSushi.address,
      flashSwapPangolinSushi.abi,
      signers[0]
    );
    const FLASH_SWAP_SUSHI = new Contract(
      flashSwapSushiPango.address,
      flashSwapSushiPango.abi,
      signers[0]
    );
    const PANGO_COMPUTE_LQUIDITY = new Contract(
      pangolinCompute.address,
      pangolinCompute.abi,
      signers[0]
    );
    const UNISWAP_COMPUTE_LQUIDITY = new Contract(
      sushiswapCompute.address,
      sushiswapCompute.abi,
      signers[0]
    );

    return {
      WAVAX,
      USDT,
      PANGO_FACTORY,
      UNISWAP_V2_FACTORY,
      PANGO_WAVAX_USDT_PAIR,
      UNISWAP_WAVAX_USDT_PAIR,
      SUSHI_SWAP_ROUTER,
      FLASH_SWAP_PANGO,
      FLASH_SWAP_SUSHI,
      PANGO_COMPUTE_LQUIDITY,
      UNISWAP_COMPUTE_LQUIDITY,
    };
  }
);

export default setupTest;
