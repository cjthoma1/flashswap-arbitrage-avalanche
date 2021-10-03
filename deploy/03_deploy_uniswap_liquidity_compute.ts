import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
  
    const { deploy } = deployments;
  
    const {
      deployer,
      sushiSwapFactory
    } = await getNamedAccounts();
  
    await deploy("SushiswapV2ComputeLiquidityValue", {
        from: deployer,
        log: true,
        args: [sushiSwapFactory],
    });
  };

export default func;
