import { ContractOptions } from '../../../shared/types';
import { getNamedAccounts, network } from 'hardhat';
import { isLocalEnv, expandTo18Decimals } from '../../../shared/utilities';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';
import setupPangolinTraderJoe from '../services/setup/setup-pangolin-trader-joe';

const runBot = async () => {
    try {
        const { joeToken, wavax } = await getNamedAccounts();

        const {
                pangolinTokenPair, traderJoeTokenPair, 
                pangolinLiquidityCompute, 
                traderJoeLiquidityCompute, flashSwapContact
            } = await setupPangolinTraderJoe(wavax, joeToken, ContractOptions.PANGOLIN);
    
        const blockListener = ethers.provider.on("block", async (blockNumber) => {
            console.log('Block Number', blockNumber);
            await swapPartnerToMain(expandTo18Decimals(1), pangolinTokenPair, traderJoeTokenPair, wavax, joeToken, pangolinLiquidityCompute, traderJoeLiquidityCompute, flashSwapContact);
    
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
