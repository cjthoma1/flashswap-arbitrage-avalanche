import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;

  const {
    deployer,
    sushiSwapFactory,
    pangolinRouter
  } = await getNamedAccounts();

  await deploy("FlashSwapSushiPango", {
    from: deployer,
    log: true,
    args: [pangolinRouter, sushiSwapFactory]
  });
};

export default func;
