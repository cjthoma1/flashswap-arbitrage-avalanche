import { ContractOptions } from '../../../shared/types';
import setupPangolinSushi from '../services/setup/setup-pangolin-sushi';
import { getNamedAccounts, network } from 'hardhat';
import { isLocalEnv, expandToXDecimals } from '../../../shared/utilities';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';

const runBot = async () => {
    const { usdt, wavax } = await getNamedAccounts();

    const {
            pangolinTokenPair, sushiTokenPair, 
            pangolinLiquidityCompute, 
            sushiSwapLiquidityCompute, flashSwapContact
        } = await setupPangolinSushi(wavax, usdt, ContractOptions.PANGOLIN);

    const blockListener = ethers.provider.on("block", async (blockNumber) => {
        console.log('Block Number', blockNumber);
        await swapPartnerToMain(expandToXDecimals(5, 6), pangolinTokenPair, sushiTokenPair, usdt, wavax, pangolinLiquidityCompute, sushiSwapLiquidityCompute, flashSwapContact);

        // If we running locally then kill the listener
        if (isLocalEnv(network.name)) {
            blockListener.removeAllListeners();
        }
    });
};

runBot();
