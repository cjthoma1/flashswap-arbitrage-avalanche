import { ContractOptions } from '../../../shared/types';
import { getNamedAccounts, network } from 'hardhat';
import { expandTo18Decimals, isLocalEnv } from '../../../shared/utilities';
import swapMainToPartner from '../services/swap/swap-main-to-partner';
import setupPangolinTraderJoe from '../services/setup/setup-pangolin-trader-joe';

const runBot = async () => {
    const { joeToken, wavax } = await getNamedAccounts();

    const {
            pangolinTokenPair, traderJoeTokenPair, 
            pangolinLiquidityCompute, 
            traderJoeLiquidityCompute, flashSwapContact
        } = await setupPangolinTraderJoe(wavax, joeToken, ContractOptions.PANGOLIN);

    const blockListener = ethers.provider.on("block", async (blockNumber) => {
        console.log('Block Number', blockNumber);
        await swapMainToPartner(expandTo18Decimals(300), pangolinTokenPair, traderJoeTokenPair, joeToken, wavax, pangolinLiquidityCompute, traderJoeLiquidityCompute, flashSwapContact);

        // If we running locally then kill the listener
        if (isLocalEnv(network.name)) {
            blockListener.removeAllListeners();
        }
    });
};

runBot();
