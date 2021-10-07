import { getNamedAccounts, network, artifacts } from 'hardhat';
import { ContractOptions, IPangolinSushi } from "../../../../shared/types";
import { isLocalEnv } from '../../../../shared/utilities';
import IUniswapV2FactoryAbi from '@sushiswap/core/build/abi/IUniswapV2Factory.json';
import IPangolinFactoryArtifact from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/interfaces/IPangolinFactory.sol/IPangolinFactory.json';

const setupPangolinSushi = async (firstTokenAddress: string, secondTokenAddress: string, swapFrom: ContractOptions ): Promise<IPangolinSushi> => {
    const { sushiSwapFactory, pangolinFactory, pangolinRouter, sushiSwapRouter, sushiswapV2ComputeLiquidityValueAddr, pangolinComputeLiquidityValueAddr, flashSwapSushiPangoAddr, flashSwapPangolinSushiAddr } = await getNamedAccounts();
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
            const FlashSwapSushiPango = await ethers.getContractFactory('FlashSwapSushiPango');
            const flashSwapSushiPangoDeployed = await FlashSwapSushiPango.deploy(pangolinRouter, sushiSwapFactory);
            flashSwapContact = new ethers.Contract(flashSwapSushiPangoDeployed.address, flashSwapSushiPangoDeployed.interface, flashSwapSushiPangoDeployed.signer);
        }
        else if (swapFrom === ContractOptions.PANGOLIN) {
            const FlashSwapPangolinSushi = await ethers.getContractFactory('FlashSwapPangolinSushi');
            const flashSwapPangolinSushiDeployed = await FlashSwapPangolinSushi.deploy(sushiSwapRouter, pangolinFactory);
            flashSwapContact = new ethers.Contract(flashSwapPangolinSushiDeployed.address, flashSwapPangolinSushiDeployed.interface, flashSwapPangolinSushiDeployed.signer);
        }
    }
    else {
        const SushiswapV2ComputeLiquidityValueArtifact = await artifacts.readArtifact('SushiswapV2ComputeLiquidityValue');
        const PangolinComputeLiquidityValueArtifact = await artifacts.readArtifact('PangolinComputeLiquidityValue');

        sushiSwapLiquidityCompute = new ethers.Contract(sushiswapV2ComputeLiquidityValueAddr, SushiswapV2ComputeLiquidityValueArtifact.abi, signers[0]);
        pangolinLiquidityCompute = new ethers.Contract(pangolinComputeLiquidityValueAddr, PangolinComputeLiquidityValueArtifact.abi, signers[0]);

        if (swapFrom === ContractOptions.SUSHI_SWAP) {
            const FlashSwapSushiPangoArtifact = await artifacts.readArtifact('FlashSwapSushiPango');
            flashSwapContact = new ethers.Contract(flashSwapSushiPangoAddr, FlashSwapSushiPangoArtifact.abi, signers[0]);
        }
        else if (swapFrom === ContractOptions.PANGOLIN) {
            const FlashSwapPangolinSushiArtifact = await artifacts.readArtifact('FlashSwapPangolinSushi');
            flashSwapContact = new ethers.Contract(flashSwapPangolinSushiAddr, FlashSwapPangolinSushiArtifact.abi, signers[0]);
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

    console.log('Sushiswap Pair', sushiTokenPair.address);
    const pangolinTokenPair = new ethers.Contract(
        await pangolinFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IPangolinPairArtifact.abi,
        signers[0]
    );

    console.log('Pangolin Pair', pangolinTokenPair.address);

    return {
        sushiTokenPair,
        pangolinTokenPair,
        sushiSwapLiquidityCompute,
        pangolinLiquidityCompute,
        flashSwapContact
    }
};

export default setupPangolinSushi;