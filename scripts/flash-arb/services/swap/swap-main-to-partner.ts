import { bigNumberToNumber, expandToXDecimals, isLocalEnv } from '../../../../shared/utilities';
import { Contract, BigNumber } from 'ethers';
import { getNamedAccounts, network } from 'hardhat';

const swapMainToPartner = async (
    arbitrageAmount: BigNumber, primaryTokenPair: Contract, secondaryTokenPair: Contract, mainTokenAddress: string, 
    partnerTokenAddress: string, primaryLiquidityCompute: Contract, secondaryLiquidityCompute: Contract, flashSwapContract: Contract) => {
    try {
        // TODO: Delete after testing
        // let primaryReserves = await primaryTokenPair.getReserves();
        // let secondaryReserves = await secondaryTokenPair.getReserves();
        // console.log('Primary Reserves', bigNumberToNumber(primaryReserves[0]), bigNumberToNumber(expandToXDecimals(primaryReserves[1], 12)));
        // console.log('Secondary Reserves', bigNumberToNumber(secondaryReserves[0]), bigNumberToNumber(expandToXDecimals(secondaryReserves[1], 12)));

        // Figure out which token is which
        let primaryAmount0, primaryToken0, primaryAmount1, primaryToken1;
        let secondaryAmount0, secondaryToken0, secondaryAmount1, secondaryToken1;

        const primaryTokenPar0 = await primaryTokenPair.token0();
        // If token0 is partnerTokenAddress then set amount0 to 0 else set its value to aribitrage amount since its mainTokenAddress
        if (primaryTokenPar0 === partnerTokenAddress) {
            primaryAmount0 = 0;
            primaryToken0 = partnerTokenAddress;
            primaryAmount1 = arbitrageAmount;
            primaryToken1 = mainTokenAddress;
        } else {
            primaryAmount0 = arbitrageAmount;
            primaryToken0 = mainTokenAddress;
            primaryAmount1 = 0;
            primaryToken1 = partnerTokenAddress;
        }

        const [primaryReserve0, primaryReserve1] = await primaryLiquidityCompute.getReservesBeforeArbitrage(
            primaryToken0,
            primaryToken1,
            primaryAmount0,
            primaryAmount1
        );

        const secondaryPairToken0 = await secondaryTokenPair.token0()
        if (secondaryPairToken0 === partnerTokenAddress) {
            secondaryAmount0 = primaryReserve0,
            secondaryToken0 = partnerTokenAddress;
            secondaryAmount1 = primaryReserve1;
            secondaryToken1 = mainTokenAddress;
        } else {
            secondaryAmount0 = primaryReserve1;
            secondaryToken0 = mainTokenAddress;
            secondaryAmount1 = primaryReserve0
            secondaryToken1 = partnerTokenAddress;
        }

        const [secondaryReserve0, secondaryReserve1] = await secondaryLiquidityCompute.getReservesDuringArbitrage(
            secondaryToken0,
            secondaryToken1,
            secondaryAmount0,
            secondaryAmount1
        );

         if (isLocalEnv(network.name)) {
            console.log('Secondary Reserve', secondaryReserve1);
            console.log('Primary Reserve', primaryReserve0);
        }

        if (primaryReserve0 > secondaryReserve1) {
            throw Error('Primary reserve larger than secondary reserve');
        }

        let profitPrediction: BigNumber = secondaryReserve1.sub(primaryReserve0);

        const { usdt } = await getNamedAccounts()

        // Estimated gas in Avalanche network        
        // Gas Price in AVAX 
        // const gasPrice = 0.000000225;
        // const gasLimit = 21000;
        // let gasPrice = 0.0000012;

        const gas = 206229;
        const gasPrice = 1200000000000;
        const gasCost = gasPrice * gas;

        if (partnerTokenAddress === usdt) {
            profitPrediction = expandToXDecimals(+profitPrediction.toString(), 12);
            const price = bigNumberToNumber(expandToXDecimals(secondaryReserve1, 12)) / bigNumberToNumber(secondaryReserve0);
            profitPrediction = profitPrediction.div(price);
            console.log('Price', price);
        }    

        console.log('Estimated Gas Cost', gasCost);
        console.log('Profit Prediction', profitPrediction.toString());

        // If profit prediction is greater then gas then perform the swap
        if (+profitPrediction.toString()  > gasCost) {
            const tx = await primaryTokenPair.swap(
                primaryAmount0,
                primaryAmount1,
                flashSwapContract.address,
                ethers.utils.toUtf8Bytes('1')
            );

            const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
            const logTable = {};
    
            logTable[tx.hash] = {
              "Gas Limit": bigNumberToNumber(tx.gasLimit),
              "Gas Used": bigNumberToNumber(receipt.gasUsed),
              "Gas Price": bigNumberToNumber(tx.gasPrice),
              "Gas Fee": receipt.gasUsed.mul(tx.gasPrice).toString(),
              "Profit": bigNumberToNumber(profitPrediction),
              Timestamp: new Date(Date.now()),
            };
            console.table(logTable);
        }
    }
    catch (err) {
        console.error('Count not process transaction', err);
    }
};

export default swapMainToPartner;