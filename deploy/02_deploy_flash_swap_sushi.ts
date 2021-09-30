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

  const flashSwappySushi = await deploy("FlashSwappySushi", {
    from: deployer,
    log: true,
    args: [sushiSwapFactory, pangolinRouter]
  });

  console.log(`FlashSwappySushi deployed to: ${flashSwappySushi.address}`);
};

export default func;
