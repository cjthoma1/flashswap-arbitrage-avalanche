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

  const flashSwapJoePango = await deploy("FlashSwapJoePango", {
    from: deployer,
    log: true,
    args: [pangolinRouter, traderJoeFactory]
  });

  console.log(`FlashSwapJoePango deployed to: ${flashSwapJoePango.address}`);
};

export default func;
