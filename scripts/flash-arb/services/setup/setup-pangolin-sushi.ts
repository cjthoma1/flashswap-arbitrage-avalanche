import { getNamedAccounts, network, artifacts } from 'hardhat';
import { ContractOptions, IPangolinSushi } from "../../../../shared/types";
import { isLocalEnv } from '../../../../shared/utilities';
import IUniswapV2FactoryAbi from '@sushiswap/core/build/abi/IUniswapV2Factory.json';
import IPangolinFactoryArtifact from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/interfaces/IPangolinFactory.sol/IPangolinFactory.json';

const setupPangolinSushi = async (firstTokenAddress: string, secondTokenAddress: string, swapFrom: ContractOptions ): Promise<IPangolinSushi> => {
    const { sushiSwapFactory, pangolinFactory, pangolinRouter, sushiSwapRouter } = await getNamedAccounts();
    const signers = await ethers.getSigners();
    let sushiSwapLiquidityCompute, pangolinLiquidityCompute, flashSwapContact;

    if (isLocalEnv(network.name)) {
        const SushiSwapCompute = await ethers.getContractFactory('SushiswapV2ComputeLiquidityValue');
        const PangolinSwapCompute = await ethers.getContractFactory('PangolinComputeLiquidityValue');

        const sushiSwapComputeDeployed = await SushiSwapCompute.deploy(sushiSwapFactory);
        const pangolinSwapComputeDeployed = await PangolinSwapCompute.deploy(pangolinFactory);

        sushiSwapLiquidityCompute = new ethers.Contract(sushiSwapComputeDeployed.address, sushiSwapComputeDeployed.interface, sushiSwapComputeDeployed.signer);
        pangolinLiquidityCompute = new ethers.Contract(pangolinSwapComputeDeployed.address, pangolinSwapComputeDeployed.interface, pangolinSwapComputeDeployed.signer);

        if (swapFrom === ContractOptions.SUSHI_SWAP) {
            const FlashSwappySushi = await ethers.getContractFactory('FlashSwappySushi');
            const flashSwappySushiDeployed = await FlashSwappySushi.deploy(pangolinRouter, sushiSwapFactory);
            flashSwapContact = new ethers.Contract(flashSwappySushiDeployed.address, flashSwappySushiDeployed.interface, flashSwappySushiDeployed.signer);
        }
        else if (swapFrom === ContractOptions.PANGOLIN) {
            const FlashSwappyPango = await ethers.getContractFactory('FlashSwappyPango');
            const flashSwappyPangoDeployed = await FlashSwappyPango.deploy(sushiSwapRouter, pangolinFactory);
            flashSwapContact = new ethers.Contract(flashSwappyPangoDeployed.address, flashSwappyPangoDeployed.interface, flashSwappyPangoDeployed.signer);
        }
    }
    else {
        const SushiswapV2ComputeLiquidityValueArtifact = await artifacts.readArtifact('SushiswapV2ComputeLiquidityValue');
        const PangolinComputeLiquidityValueArtifact = await artifacts.readArtifact('PangolinComputeLiquidityValue');

        sushiSwapLiquidityCompute = new ethers.Contract('SushiswapV2ComputeLiquidityValue', SushiswapV2ComputeLiquidityValueArtifact.abi, signers[0]);
        pangolinLiquidityCompute = new ethers.Contract('PangolinComputeLiquidityValue', PangolinComputeLiquidityValueArtifact.abi, signers[0]);

        if (swapFrom === ContractOptions.SUSHI_SWAP) {
            const FlashSwappySushiArtifact = await artifacts.readArtifact('FlashSwappySushi');
            flashSwapContact = new ethers.Contract('FlashSwappySushi', FlashSwappySushiArtifact.abi, signers[0]);
        }
        else if (swapFrom === ContractOptions.PANGOLIN) {
            const FlashSwappyPangoArtifact = await artifacts.readArtifact('FlashSwappyPango');
            flashSwapContact = new ethers.Contract('FlashSwappyPango', FlashSwappyPangoArtifact.abi, signers[0]);
        }
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

    const sushiTokenPair = new ethers.Contract(
        await sushiFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IUniswapV2PairArtifact.abi,
        signers[0]
    );

    const pangolinTokenPair = new ethers.Contract(
        await pangolinFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IPangolinPairArtifact.abi,
        signers[0]
    );

    return {
        sushiTokenPair,
        pangolinTokenPair,
        sushiSwapLiquidityCompute,
        pangolinLiquidityCompute,
        flashSwapContact
    }
};

export default setupPangolinSushi;