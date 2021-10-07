import { ContractOptions } from '../../../shared/types';
import setupPangolinSushi from '../services/setup/setup-pangolin-sushi';
import { getNamedAccounts, network } from 'hardhat';
import { expandTo18Decimals, isLocalEnv } from '../../../shared/utilities';
import swapMainToPartner from '../services/swap/swap-main-to-partner';

const runBot = async () => {
    try {
        const { usdt, wavax } = await getNamedAccounts();

        const {
                pangolinTokenPair, sushiTokenPair, 
                pangolinLiquidityCompute, 
                sushiSwapLiquidityCompute, flashSwapContact
            } = await setupPangolinSushi(wavax, usdt, ContractOptions.PANGOLIN);
    
        const blockListener = ethers.provider.on("block", async (blockNumber) => {
            console.log('Block Number', blockNumber);
            await swapMainToPartner(expandTo18Decimals(1), pangolinTokenPair, sushiTokenPair, wavax, usdt, pangolinLiquidityCompute, sushiSwapLiquidityCompute, flashSwapContact);
    
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
