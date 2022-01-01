import { getNamedAccounts, network } from 'hardhat';

import { INTERVAL_TIME } from '../../../shared/constants';
import { ContractOptions } from '../../../shared/types';
import { ChainlinkPriceOptions, expandTo18Decimals, getChainlinkPrice, isLocalEnv } from '../../../shared/utilities';
import setupPangolinTraderJoe from '../services/setup/setup-pangolin-trader-joe';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';

const runBot = async () => {
    try {
        const { joeToken, wavax } = await getNamedAccounts();

        const {
            pangolinTokenPair, traderJoeTokenPair,
            pangolinLiquidityCompute,
            traderJoeLiquidityCompute, flashSwapContact
        } = await setupPangolinTraderJoe(wavax, joeToken, ContractOptions.PANGOLIN);

        const joePrice = await getChainlinkPrice(ChainlinkPriceOptions.JOE);

        const interval = setInterval(async () => {
            await swapPartnerToMain(expandTo18Decimals(1), pangolinTokenPair, traderJoeTokenPair, wavax, joeToken, joePrice, pangolinLiquidityCompute, traderJoeLiquidityCompute, flashSwapContact);

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
