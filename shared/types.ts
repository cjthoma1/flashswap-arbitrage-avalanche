import { Contract } from 'ethers';
export enum ContractOptions {
    PANGOLIN = 'PANGOLIN',
    SUSHI_SWAP = 'SUSHI_SWAP',
    TRADER_JOE = 'TRADER_JOE'
}

export interface IPangolinSushi {
    sushiTokenPair: Contract;
    pangolinTokenPair: Contract;
    sushiSwapLiquidityCompute: Contract;
    pangolinLiquidityCompute: Contract;
    flashSwapContact: Contract;
}

export interface IPangolinTraderJoe {
    traderJoeTokenPair: Contract;
    pangolinTokenPair: Contract;
    traderJoeLiquidityCompute: Contract;
    pangolinLiquidityCompute: Contract;
    flashSwapContact: Contract;
}