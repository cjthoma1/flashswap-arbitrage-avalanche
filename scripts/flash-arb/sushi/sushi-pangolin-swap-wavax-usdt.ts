import { getNamedAccounts, network } from 'hardhat';

import { INTERVAL_TIME } from '../../../shared/constants';
import { ContractOptions } from '../../../shared/types';
import { expandTo18Decimals, isLocalEnv } from '../../../shared/utilities';
import setupPangolinSushi from '../services/setup/setup-pangolin-sushi';
import swapMainToPartner from '../services/swap/swap-main-to-partner';

const runBot = async () => {
    try {
        const { usdt, wavax } = await getNamedAccounts();

        const {
            pangolinTokenPair, sushiTokenPair,
            pangolinLiquidityCompute,
            sushiSwapLiquidityCompute, flashSwapContact
        } = await setupPangolinSushi(wavax, usdt, ContractOptions.SUSHI_SWAP);

        const interval = setInterval(async () => {
            await swapMainToPartner(expandTo18Decimals(1), sushiTokenPair, pangolinTokenPair, wavax, usdt, sushiSwapLiquidityCompute, pangolinLiquidityCompute, flashSwapContact);

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
