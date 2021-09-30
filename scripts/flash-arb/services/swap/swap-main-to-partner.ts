import { bigNumberToNumber, expandToXDecimals } from "../../../../shared/utilities";
import { Contract, BigNumber } from 'ethers';

const swapMainToPartner = async (
    arbitrageAmount: BigNumber, primaryTokenPair: Contract, secondaryTokenPair: Contract, mainTokenAddress: string, 
    partnerTokenAddress: string, primaryLiquidityCompute: Contract, secondaryLiquidityCompute: Contract, flashSwapContract: Contract) => {
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

        const profitPrediction = secondaryReserve1.sub(primaryReserve0);
        console.log('Profit prediction', bigNumberToNumber(profitPrediction));

        // Estimated gas in Avalanche network
        const estimatedGas = 1000000000;
        // The gas price (in wei)...
        const gasPrice = await ethers.provider.getGasPrice();
        let gasCost = gasPrice.mul(estimatedGas);

        // Increase gas cost by 30% to account for additional contract calls within contract
        gasCost = gasCost.add(gasCost.div(BigNumber.from('30')));
        const finalGasCost = ethers.utils.formatUnits(gasCost);

        console.log('Formated gas', ethers.utils.formatUnits(estimatedGas));

        // Converts gas price from wei to eth
        console.log('Formated gas price', ethers.utils.formatUnits(gasPrice));
        console.log('Formated gas cost', ethers.utils.formatUnits(gasCost));

        const price = bigNumberToNumber(expandToXDecimals(secondaryReserve1, 12)) / bigNumberToNumber(secondaryReserve0);

        console.log('Price', price);
        // If profit prediction is greater then gas then perform the swap
        if ((profitPrediction / price) > +finalGasCost) {
            console.log('This is where we would perform the flash swap');
            const tx = await primaryTokenPair.swap(
                primaryAmount0,
                primaryAmount1,
                flashSwapContract.address,
                ethers.utils.toUtf8Bytes('1')
            );
            console.log('Transaction', tx);
        }
    }
    catch (err) {
        console.error('Count not process transaction', err);
    }
};

export default swapMainToPartner;