import { getNamedAccounts, network } from 'hardhat';

import { INTERVAL_TIME } from '../../../shared/constants';
import { ContractOptions } from '../../../shared/types';
import { expandTo18Decimals, isLocalEnv } from '../../../shared/utilities';
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

        const interval = setInterval(async () => {
            await swapMainToPartner(expandTo18Decimals(50), traderJoeTokenPair, pangolinTokenPair, joeToken, wavax, traderJoeLiquidityCompute, pangolinLiquidityCompute, flashSwapContact);

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
