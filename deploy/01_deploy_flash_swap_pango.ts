import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;

  const {
    deployer,
    sushiSwapRouter,
    pangolinFactory
  } = await getNamedAccounts();

  const flashSwappyPango = await deploy("FlashSwappyPango", {
    from: deployer,
    log: true,
    args: [sushiSwapRouter, pangolinFactory]
  });

  console.log(`FlashSwappyPango deployed to: ${flashSwappyPango.address}`);
};

export default func;
