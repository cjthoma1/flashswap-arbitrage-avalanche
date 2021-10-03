import { ContractOptions } from '../../../shared/types';
import { getNamedAccounts, network } from 'hardhat';
import { isLocalEnv, expandToXDecimals } from '../../../shared/utilities';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';
import setupPangolinTraderJoe from '../services/setup/setup-pangolin-trader-joe';

const runBot = async () => {
    const { usdt, wavax } = await getNamedAccounts();

    const {
            pangolinTokenPair, traderJoeTokenPair, 
            pangolinLiquidityCompute, 
            traderJoeLiquidityCompute, flashSwapContact
        } = await setupPangolinTraderJoe(wavax, usdt, ContractOptions.TRADER_JOE);

    const blockListener = ethers.provider.on("block", async (blockNumber) => {
        console.log('Block Number', blockNumber)
        await swapPartnerToMain(expandToXDecimals(5, 6), traderJoeTokenPair, pangolinTokenPair, usdt, wavax, traderJoeLiquidityCompute, pangolinLiquidityCompute, flashSwapContact);

        // If we running locally then kill the listener
        if (isLocalEnv(network.name)) {
            blockListener.removeAllListeners();
        }
    });
};

runBot();
