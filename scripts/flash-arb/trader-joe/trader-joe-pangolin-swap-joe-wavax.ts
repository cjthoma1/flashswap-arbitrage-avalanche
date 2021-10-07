import { ContractOptions } from '../../../shared/types';
import { getNamedAccounts, network } from 'hardhat';
import { isLocalEnv, expandTo18Decimals } from '../../../shared/utilities';
import setupPangolinTraderJoe from '../services/setup/setup-pangolin-trader-joe';
import swapMainToPartner from '../services/swap/swap-main-to-partner';

const runBot = async () => {
    try {
        const { joeToken, wavax } = await getNamedAccounts();

        const {
                pangolinTokenPair, traderJoeTokenPair, 
                pangolinLiquidityCompute, 
                traderJoeLiquidityCompute, flashSwapContact
            } = await setupPangolinTraderJoe(wavax, joeToken, ContractOptions.TRADER_JOE);
    
        const blockListener = ethers.provider.on("block", async (blockNumber) => {
            console.log('Block Number', blockNumber)
            await swapMainToPartner(expandTo18Decimals(75), traderJoeTokenPair, pangolinTokenPair, joeToken, wavax, traderJoeLiquidityCompute, pangolinLiquidityCompute, flashSwapContact);
    
            // If we running locally then kill the listener
            if (isLocalEnv(network.name)) {
                blockListener.removeAllListeners();
            }
        });
    }
    catch(err) {
        console.log('Bot Error', err);
    }
};

runBot();
