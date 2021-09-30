import { artifacts, ethers, getNamedAccounts, network } from 'hardhat';
import { bigNumberToNumber, isLocalEnv, expandTo18Decimals, expandToXDecimals } from '../../../shared/utilities';
import IUniswapV2FactoryAbi from '@sushiswap/core/build/abi/IUniswapV2Factory.json';
import IPangolinFactoryArtifact from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/interfaces/IPangolinFactory.sol/IPangolinFactory.json';

const runBot = async () => {
    const { usdt, wavax, sushiSwapFactory, pangolinFactory, pangolinRouter } = await getNamedAccounts();
    const signers = await ethers.getSigners();
    let sushiSwapCompute, pangolinSwapCompute, flashSwappySushi;

    if (isLocalEnv(network.name)) {
        const SushiSwapCompute = await ethers.getContractFactory('SushiswapV2ComputeLiquidityValue');
        const PangolinSwapCompute = await ethers.getContractFactory('PangolinComputeLiquidityValue');
        const FlashSwappySushi = await ethers.getContractFactory('FlashSwappySushi');

        const sushiSwapComputeDeployed = await SushiSwapCompute.deploy(sushiSwapFactory);
        const pangolinSwapComputeDeployed = await PangolinSwapCompute.deploy(pangolinFactory);

        const flashSwappySushiDeployed = await FlashSwappySushi.deploy(pangolinRouter, sushiSwapFactory);

        sushiSwapCompute = new ethers.Contract(sushiSwapComputeDeployed.address, sushiSwapComputeDeployed.interface, sushiSwapComputeDeployed.signer);
        pangolinSwapCompute = new ethers.Contract(pangolinSwapComputeDeployed.address, pangolinSwapComputeDeployed.interface, pangolinSwapComputeDeployed.signer);
        flashSwappySushi = new ethers.Contract(flashSwappySushiDeployed.address, flashSwappySushiDeployed.interface, flashSwappySushiDeployed.signer);
    }
    else {
        const SushiswapV2ComputeLiquidityValueArtifact = await artifacts.readArtifact('SushiswapV2ComputeLiquidityValue');
        const PangolinComputeLiquidityValueArtifact = await artifacts.readArtifact('PangolinComputeLiquidityValue');
        const FlashSwappySushiArtifact = await artifacts.readArtifact('FlashSwappySushi');

        sushiSwapCompute = new ethers.Contract('SushiswapV2ComputeLiquidityValue', SushiswapV2ComputeLiquidityValueArtifact.abi, signers[0]);
        pangolinSwapCompute = new ethers.Contract('PangolinComputeLiquidityValue', PangolinComputeLiquidityValueArtifact.abi, signers[0]);
        flashSwappySushi = new ethers.Contract('FlashSwappySushi', FlashSwappySushiArtifact.abi, signers[0]);
    }

    const IUniswapV2PairArtifact = await artifacts.readArtifact('IUniswapV2Pair');
    const IPangolinPairArtifact = await artifacts.readArtifact('IPangolinPair');

    const sushiFactoryContract = new ethers.Contract(
        sushiSwapFactory, // Factory Address
        IUniswapV2FactoryAbi,
        signers[0]
    );

    const pangolinFactoryContract = new ethers.Contract(
        pangolinFactory, // Factory Address
        IPangolinFactoryArtifact.abi,
        signers[0]
    );

    const sushiWavaxTether = new ethers.Contract(
        await sushiFactoryContract.getPair(wavax, usdt),
        IUniswapV2PairArtifact.abi,
        signers[0]
    );

    const pangolinWavaxTether = new ethers.Contract(
        await pangolinFactoryContract.getPair(wavax, usdt),
        IPangolinPairArtifact.abi,
        signers[0]
    );

    // console.log('Sushi Pair address', sushiWavaxTether.address);
    // console.log('Pangolin Pair address', pangolinWavaxTether.address);
    const blockListener = ethers.provider.on("block", async (blockNumber) => {
        console.log('Block Number', blockNumber);
        try {
            const arbitrageAmount = expandTo18Decimals(5);

            // Figure out which token is which
            const sushiSwapToken0 = await sushiWavaxTether.token0();

            let sushiAmount0, sushiToken0, sushiAmount1, sushiToken1;
            let pangoAmount0, pangoToken0, pangoAmount1, pangoToken1;

            let sushiReserves = await sushiWavaxTether.getReserves();
            let pangoReserves = await pangolinWavaxTether.getReserves();

            console.log('Sushi Reserves', bigNumberToNumber(sushiReserves[0]), bigNumberToNumber(expandToXDecimals(sushiReserves[1], 12)));
            console.log('Pango Reserves', bigNumberToNumber(pangoReserves[0]), bigNumberToNumber(expandToXDecimals(pangoReserves[1], 12)));

            // If token0 is USDT then set amount0 to 0else set its value to aribitrage amount since its WAVAX
            if (sushiSwapToken0 === usdt) {
                sushiAmount0 = 0;
                sushiToken0 = usdt;
                sushiAmount1 = arbitrageAmount;
                sushiToken1 = wavax;
            } else {
                sushiAmount0 = arbitrageAmount;
                sushiToken0 = wavax;
                sushiAmount1 = 0;
                sushiToken1 = usdt;
            }

            const [sushiswapReserve0, sushiswapReserve1] = await sushiSwapCompute.getReservesBeforeArbitrage(
                sushiToken0,
                sushiToken1,
                sushiAmount0,
                sushiAmount1
            );

            console.log('Sushi Reserve 0', bigNumberToNumber(expandToXDecimals(sushiswapReserve0, 12)));
            console.log('Sushi Reserve 1', bigNumberToNumber(sushiswapReserve1));

            const pangoPairToken0 = await pangolinWavaxTether.token0()

            if (pangoPairToken0 === usdt) {
                pangoAmount0 = sushiswapReserve0,
                    pangoToken0 = usdt;
                pangoAmount1 = sushiswapReserve1;
                pangoToken1 = wavax;
            } else {
                pangoAmount0 = sushiswapReserve1;
                pangoToken0 = wavax;
                pangoAmount1 = sushiswapReserve0
                pangoToken1 = usdt;
            }

            const [pangoReserve0, pangoReserve1] = await pangolinSwapCompute.getReservesDuringArbitrage(
                pangoToken0,
                pangoToken1,
                pangoAmount0,
                pangoAmount1
            );

            console.log('Pangolin Reserve 0', bigNumberToNumber(pangoReserve0));
            console.log('Pangolin Reserve 1', bigNumberToNumber(expandToXDecimals(pangoReserve1, 12)));

            const profitPrediction = pangoReserve1.sub(sushiswapReserve0);
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

            const price = bigNumberToNumber(expandToXDecimals(pangoReserve1, 12)) / bigNumberToNumber(pangoReserve0);

            console.log('Pangolin Price', price);
            // If profit prediction is greater then gas then perform the swap
            if ((profitPrediction / price) > +finalGasCost) {
                console.log('This is where we would perform the flash swap');
                const tx = await sushiWavaxTether.swap(
                    sushiAmount0,
                    sushiAmount1,
                    flashSwappySushi.address,
                    ethers.utils.toUtf8Bytes('1')
                );
                console.log('Transaction', tx);
            }
        }
        catch (err) {
            console.error('Count not process transaction', err);
        }
         // If we running locally then kill the listener
         if (isLocalEnv(network.name)) {
            blockListener.removeAllListeners();
        }
    });

};

runBot()
    // .then(() => process.exit(0))
    // .catch(error => {
    //     console.error(error)
    //     process.exit(1)
    // })