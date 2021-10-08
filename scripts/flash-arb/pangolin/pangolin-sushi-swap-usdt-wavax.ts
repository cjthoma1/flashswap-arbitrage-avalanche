import { ContractOptions } from '../../../shared/types';
import setupPangolinSushi from '../services/setup/setup-pangolin-sushi';
import { getNamedAccounts, network } from 'hardhat';
import { isLocalEnv, expandToXDecimals } from '../../../shared/utilities';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';
import { INTERVAL_TIME } from '../../../shared/constants';

const runBot = async () => {
    try {
        const { usdt, wavax } = await getNamedAccounts();

        const {
            pangolinTokenPair, sushiTokenPair,
            pangolinLiquidityCompute,
            sushiSwapLiquidityCompute, flashSwapContact
        } = await setupPangolinSushi(wavax, usdt, ContractOptions.PANGOLIN);

        const interval = setInterval(async () => {
            console.log('Block Number', await ethers.provider.getBlockNumber());
            await swapPartnerToMain(expandToXDecimals(10, 6), pangolinTokenPair, sushiTokenPair, usdt, wavax, pangolinLiquidityCompute, sushiSwapLiquidityCompute, flashSwapContact);

            // If we running locally then kill the listener
            if (isLocalEnv(network.name)) {
                clearInterval(interval);
            }
        }, INTERVAL_TIME);
    }
    catch (err) {
        console.log('Bot Error', err);
    }
};

runBot();
