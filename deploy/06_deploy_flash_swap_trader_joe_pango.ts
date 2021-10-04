import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;

  const { deploy } = deployments;

  const {
    deployer,
    traderJoeFactory,
    pangolinRouter
  } = await getNamedAccounts();

  await deploy("FlashSwapJoePango", {
    from: deployer,
    log: true,
    args: [pangolinRouter, traderJoeFactory]
  })
};

export default func;
