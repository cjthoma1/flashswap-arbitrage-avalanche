import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;

    const { deploy } = deployments;
  
    const { deployer } = await getNamedAccounts();
  
    await deploy('ExampleERC20', {
      from: deployer,
      log: true,
      args: ['Cray', 'CRAY', 10000000]
    });
};

export default func;