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
        } = await setupPangolinTraderJoe(wavax, usdt, ContractOptions.TRADER_JOE);

        const wavaxPrice = await getChainlinkPrice(ChainlinkPriceOptions.AXAX);

        const interval = setInterval(async () => {
            await swapPartnerToMain(expandToXDecimals(100, 6), traderJoeTokenPair, pangolinTokenPair, usdt, wavax, wavaxPrice, traderJoeLiquidityCompute, pangolinLiquidityCompute, flashSwapContact);

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
