import { ContractOptions } from '../../../shared/types';
import { getNamedAccounts, network } from 'hardhat';
import { isLocalEnv, expandToXDecimals } from '../../../shared/utilities';
import swapPartnerToMain from '../services/swap/swap-partner-to-main';
import setupPangolinTraderJoe from '../services/setup/setup-pangolin-trader-joe';
import { INTERVAL_TIME } from '../../../shared/constants';

const runBot = async () => {
    try {
        const { usdt, wavax } = await getNamedAccounts();

        const {
            pangolinTokenPair, traderJoeTokenPair,
            pangolinLiquidityCompute,
            traderJoeLiquidityCompute, flashSwapContact
        } = await setupPangolinTraderJoe(wavax, usdt, ContractOptions.TRADER_JOE);

        const interval = setInterval(async () => {
            console.log('Block Number', await ethers.provider.getBlockNumber());
            await swapPartnerToMain(expandToXDecimals(25, 6), traderJoeTokenPair, pangolinTokenPair, usdt, wavax, traderJoeLiquidityCompute, pangolinLiquidityCompute, flashSwapContact);

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
