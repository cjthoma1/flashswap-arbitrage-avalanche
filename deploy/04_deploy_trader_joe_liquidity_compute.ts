import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
  
    const { deploy } = deployments;
  
    const {
      deployer,
      traderJoeFactory
    } = await getNamedAccounts();
  
    await deploy("TraderJoeComputeLiquidityValue", {
        from: deployer,
        log: true,
        args: [traderJoeFactory],
    });
  };

export default func;
