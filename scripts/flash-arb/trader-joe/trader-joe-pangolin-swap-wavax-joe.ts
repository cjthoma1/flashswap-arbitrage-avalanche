import { ContractOptions } from '../../../shared/types';
import { getNamedAccounts, network } from 'hardhat';
import { expandTo18Decimals, isLocalEnv } from '../../../shared/utilities';
import setupPangolinTraderJoe from '../services/setup/setup-pangolin-trader-joe';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';

const runBot = async () => {
    const { joeToken, wavax } = await getNamedAccounts();

    const {
            pangolinTokenPair, traderJoeTokenPair, 
            pangolinLiquidityCompute, 
            traderJoeLiquidityCompute, flashSwapContact
        } = await setupPangolinTraderJoe(wavax, joeToken, ContractOptions.TRADER_JOE);

    const blockListener = ethers.provider.on("block", async (blockNumber) => {
        console.log('Block Number', blockNumber)
        await swapPartnerToMain(expandTo18Decimals(1), traderJoeTokenPair, pangolinTokenPair, wavax, joeToken, traderJoeLiquidityCompute, pangolinLiquidityCompute, flashSwapContact);

        // If we running locally then kill the listener
        if (isLocalEnv(network.name)) {
            blockListener.removeAllListeners();
        }
    });
};

runBot();
