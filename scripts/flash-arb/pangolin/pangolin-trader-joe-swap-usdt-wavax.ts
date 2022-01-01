import { getNamedAccounts, network } from 'hardhat';

import { INTERVAL_TIME } from '../../../shared/constants';
import { ContractOptions } from '../../../shared/types';
import { ChainlinkPriceOptions, expandToXDecimals, getChainlinkPrice, isLocalEnv } from '../../../shared/utilities';
import setupPangolinTraderJoe from '../services/setup/setup-pangolin-trader-joe';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';

const runBot = async () => {
    try {
        const { usdt, wavax } = await getNamedAccounts();

        const {
            pangolinTokenPair, traderJoeTokenPair,
            pangolinLiquidityCompute,
            traderJoeLiquidityCompute, flashSwapContact
        } = await setupPangolinTraderJoe(wavax, usdt, ContractOptions.PANGOLIN);

        const wavaxPrice = await getChainlinkPrice(ChainlinkPriceOptions.AXAX);

        const interval = setInterval(async () => {
            await swapPartnerToMain(expandToXDecimals(100, 6), pangolinTokenPair, traderJoeTokenPair, usdt, wavax, wavaxPrice, pangolinLiquidityCompute, traderJoeLiquidityCompute, flashSwapContact);

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
