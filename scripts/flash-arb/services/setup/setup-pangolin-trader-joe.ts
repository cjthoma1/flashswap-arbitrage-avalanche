import { artifacts, getNamedAccounts, network } from 'hardhat';
import { ContractOptions, IPangolinTraderJoe } from '../../../../shared/types';
import { isLocalEnv } from '../../../../shared/utilities';
import IJoeFacotryArtifact from '@traderjoe-xyz/core/artifacts/contracts/traderjoe/interfaces/IJoeFactory.sol/IJoeFactory.json';
import IPangolinFactoryArtifact from '@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/interfaces/IPangolinFactory.sol/IPangolinFactory.json';

const setupPangolinTraderJoe = async (firstTokenAddress: string, secondTokenAddress: string, swapFrom: ContractOptions ): Promise<IPangolinTraderJoe> => {
    const { traderJoeFactory, pangolinFactory, pangolinRouter, traderJoeRouter, pangolinComputeLiquidityValueAddr, traderJoeComputeLiquidityValueAddr, flashSwapJoePangoAddr, flashSwapPangoJoeAddr } = await getNamedAccounts();
    const signers = await ethers.getSigners();
    let traderJoeLiquidityCompute, pangolinLiquidityCompute, flashSwapContact;

    if (isLocalEnv(network.name)) {
        const TraderJoeCompute = await ethers.getContractFactory('TraderJoeComputeLiquidityValue');
        const PangolinSwapCompute = await ethers.getContractFactory('PangolinComputeLiquidityValue');

        const traderJoeComputeDeployed = await TraderJoeCompute.deploy(traderJoeFactory);
        const pangolinSwapComputeDeployed = await PangolinSwapCompute.deploy(pangolinFactory);

        traderJoeLiquidityCompute = new ethers.Contract(traderJoeComputeDeployed.address, traderJoeComputeDeployed.interface, traderJoeComputeDeployed.signer);
        pangolinLiquidityCompute = new ethers.Contract(pangolinSwapComputeDeployed.address, pangolinSwapComputeDeployed.interface, pangolinSwapComputeDeployed.signer);

        if (swapFrom === ContractOptions.TRADER_JOE) {
            const FlashSwapJoePango = await ethers.getContractFactory('FlashSwapJoePango');
            const flashSwapJoePangoDeployed = await FlashSwapJoePango.deploy(pangolinRouter, traderJoeFactory);
            flashSwapContact = new ethers.Contract(flashSwapJoePangoDeployed.address, flashSwapJoePangoDeployed.interface, flashSwapJoePangoDeployed.signer);
        }
        else if (swapFrom === ContractOptions.PANGOLIN) {
            const FlashSwapPangoJoe = await ethers.getContractFactory('FlashSwapPangoJoe');
            const flashSwappyPangoJoeDeployed = await FlashSwapPangoJoe.deploy(traderJoeRouter, pangolinFactory);
            flashSwapContact = new ethers.Contract(flashSwappyPangoJoeDeployed.address, flashSwappyPangoJoeDeployed.interface, flashSwappyPangoJoeDeployed.signer);
        }
    }
    else {
        const TraderJoeComputeLiquidityValueArtifact = await artifacts.readArtifact('TraderJoeComputeLiquidityValue');
        const PangolinComputeLiquidityValueArtifact = await artifacts.readArtifact('PangolinComputeLiquidityValue');

        traderJoeLiquidityCompute = new ethers.Contract(traderJoeComputeLiquidityValueAddr, TraderJoeComputeLiquidityValueArtifact.abi, signers[0]);
        pangolinLiquidityCompute = new ethers.Contract(pangolinComputeLiquidityValueAddr, PangolinComputeLiquidityValueArtifact.abi, signers[0]);

        if (swapFrom === ContractOptions.TRADER_JOE) {
            const FlashSwapJoePango = await artifacts.readArtifact('FlashSwapJoePango');
            flashSwapContact = new ethers.Contract(flashSwapJoePangoAddr, FlashSwapJoePango.abi, signers[0]);
        }
        else if (swapFrom === ContractOptions.PANGOLIN) {
            const FlashSwapPangoJoeArtifact = await artifacts.readArtifact('FlashSwapPangoJoe');
            flashSwapContact = new ethers.Contract(flashSwapPangoJoeAddr, FlashSwapPangoJoeArtifact.abi, signers[0]);
        }
    }

    const IJoePairArtifact = await artifacts.readArtifact('IJoePair');
    const IPangolinPairArtifact = await artifacts.readArtifact('IPangolinPair');

    const traderJoeContract = new ethers.Contract(
        traderJoeFactory, // Factory Address
        IJoeFacotryArtifact.abi,
        signers[0]
    );

    const pangolinFactoryContract = new ethers.Contract(
        pangolinFactory, // Factory Address
        IPangolinFactoryArtifact.abi,
        signers[0]
    );

    const traderJoeTokenPair = new ethers.Contract(
        await traderJoeContract.getPair(firstTokenAddress, secondTokenAddress),
        IJoePairArtifact.abi,
        signers[0]
    );

    console.log('Trader Joe Pair', traderJoeTokenPair.address);

    const pangolinTokenPair = new ethers.Contract(
        await pangolinFactoryContract.getPair(firstTokenAddress, secondTokenAddress),
        IPangolinPairArtifact.abi,
        signers[0]
    );

    console.log('Pangolin Pair', pangolinTokenPair.address);

    return {
        traderJoeTokenPair,
        pangolinTokenPair,
        traderJoeLiquidityCompute,
        pangolinLiquidityCompute,
        flashSwapContact
    }
};

export default setupPangolinTraderJoe;