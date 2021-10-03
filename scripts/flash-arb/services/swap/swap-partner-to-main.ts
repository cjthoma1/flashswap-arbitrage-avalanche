import { bigNumberToNumber, expandToXDecimals, expandTo18Decimals } from '../../../../shared/utilities';
import { Contract, BigNumber } from 'ethers';

const swapPartnerToMain = async (
    arbitrageAmount: BigNumber, primaryTokenPair: Contract, secondaryTokenPair: Contract, partnerTokenAddress: string, 
    mainTokenAddress: string, primaryLiquidityCompute: Contract, secondaryLiquidityCompute: Contract, flashSwapContract: Contract) => {
    try {
        // TODO: Delete after testing
        let primaryReserves = await primaryTokenPair.getReserves();
        let secondaryReserves = await secondaryTokenPair.getReserves();
        console.log('Primary Reserves', bigNumberToNumber(primaryReserves[0]), bigNumberToNumber(expandToXDecimals(primaryReserves[1], 12)));
        console.log('Secondary Reserves', bigNumberToNumber(secondaryReserves[0]), bigNumberToNumber(expandToXDecimals(secondaryReserves[1], 12)));

        // Figure out which token is which
        let primaryAmount0, primaryToken0, primaryAmount1, primaryToken1;
        let secondaryAmount0, secondaryToken0, secondaryAmount1, secondaryToken1;

        const primaryTokenPar0 = await primaryTokenPair.token0();
        // If token0 is partnerTokenAddress then set amount0 to aribitrage amount else set its value to 0 since its mainTokenAddress
        if (primaryTokenPar0 === partnerTokenAddress) {
            primaryAmount0 = arbitrageAmount;
            primaryToken0 = partnerTokenAddress;
            primaryAmount1 = 0;
            primaryToken1 = mainTokenAddress;
        } else {
            primaryAmount0 = 0;
            primaryToken0 = mainTokenAddress;
            primaryAmount1 = arbitrageAmount;
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
            secondaryToken0 = mainTokenAddress;
            secondaryAmount1 = primaryReserve1;
            secondaryToken1 = partnerTokenAddress;
        } else {
            secondaryAmount0 = primaryReserve1;
            secondaryToken0 = partnerTokenAddress;
            secondaryAmount1 = primaryReserve0
            secondaryToken1 = mainTokenAddress;
        }

        const [secondaryReserve0, secondaryReserve1] = await secondaryLiquidityCompute.getReservesDuringArbitrage(
            secondaryToken0,
            secondaryToken1,
            secondaryAmount0,
            secondaryAmount1
        );

        const profitPrediction = secondaryReserve1.sub(primaryReserve0);
        console.log('Profit prediction', bigNumberToNumber(profitPrediction));

        // Estimated gas in Avalanche network        
        // Gas Price in AVAX 
        const gasPrice = 0.000000225;
        // const gasLimit = 21000;
        const gasLimit = 220000;
        let gasCost = gasPrice * gasLimit * 1000000000000000000;
    
        console.log('Gas cost', gasCost);

        // If profit prediction is greater then gas then perform the swap
        if (bigNumberToNumber(profitPrediction) > gasCost) {
            console.log('This is where we would perform the flash swap');
            const tx = await primaryTokenPair.swap(
                primaryAmount0,
                primaryAmount1,
                flashSwapContract.address,
                ethers.utils.toUtf8Bytes('1')
            );
            const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
            // console.log('Transaction', tx);
            // console.log('Receipt',receipt);
            console.log('Receipt gas used', bigNumberToNumber(receipt.gasUsed));
            console.log('Transcation gasPrice', bigNumberToNumber(tx.gasPrice));
            console.log('Transcation gas gasLimit', bigNumberToNumber(tx.gasLimit));
            console.log('Gas fee', bigNumberToNumber(receipt.gasUsed.mul(tx.gasLimit)));
        }
    }
    catch (err) {
        console.error('Count not process transaction', err);
    }
};

export default swapPartnerToMain;