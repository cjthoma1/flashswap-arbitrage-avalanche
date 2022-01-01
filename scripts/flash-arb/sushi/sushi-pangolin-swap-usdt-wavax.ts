import { getNamedAccounts, network } from 'hardhat';

import { INTERVAL_TIME } from '../../../shared/constants';
import { ContractOptions } from '../../../shared/types';
import { ChainlinkPriceOptions, expandToXDecimals, getChainlinkPrice, isLocalEnv } from '../../../shared/utilities';
import setupPangolinSushi from '../services/setup/setup-pangolin-sushi';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';

const runBot = async () => {
    try {
        const { usdt, wavax } = await getNamedAccounts();

        const {
            pangolinTokenPair, sushiTokenPair,
            pangolinLiquidityCompute,
            sushiSwapLiquidityCompute, flashSwapContact
        } = await setupPangolinSushi(wavax, usdt, ContractOptions.SUSHI_SWAP);

        const wavaxPrice = await getChainlinkPrice(ChainlinkPriceOptions.AXAX);

        const interval = setInterval(async () => {
            await swapPartnerToMain(expandToXDecimals(10, 6), sushiTokenPair, pangolinTokenPair, usdt, wavax, wavaxPrice, sushiSwapLiquidityCompute, pangolinLiquidityCompute, flashSwapContact);

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
