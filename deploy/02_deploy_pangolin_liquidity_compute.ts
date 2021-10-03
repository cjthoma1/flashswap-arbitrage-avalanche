import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
  
    const { deploy } = deployments;
  
    const {
      deployer,
      pangolinFactory
    } = await getNamedAccounts();
  
    await deploy("PangolinComputeLiquidityValue", {
        from: deployer,
        log: true,
        args: [pangolinFactory],
    });
  };

export default func;
