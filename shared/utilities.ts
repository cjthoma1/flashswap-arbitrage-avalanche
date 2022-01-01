import { BigNumber } from 'ethers';
import { getNamedAccounts } from 'hardhat';

export const MINIMUM_LIQUIDITY = BigNumber.from(10).pow(3)
export const AggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }]
export enum ChainlinkPriceOptions {
  AXAX = 'AVAX',
  DAI = 'DAI',
  JOE = 'JOE',
  MIM = 'MIM',
  SPELL = 'SPELL',
  USDC = 'USDC',
  USDT = 'USDT',
}

export function expandTo18Decimals(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}

export function expandToXDecimals(n: number, expandAmount: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(expandAmount))
}

export function bigNumberToNumber(number: BigNumber): number {
    try {
      return number.toNumber();
    } catch(err) {
        return +ethers.utils.formatEther((number));
    }
}

export function isLocalEnv(envName: string) {
  return !!({
    hardhat: true,
    localhost: true,
  } as Record<string, true>)[envName];
}

export async function getChainlinkPrice(options: ChainlinkPriceOptions): Promise<BigNumber> {
  if (!options) return;

  try {
    let priceFeed;
    switch(options) {
      case ChainlinkPriceOptions.AXAX:
        const { avaxChainLink } = await getNamedAccounts();
        priceFeed = new ethers.Contract(avaxChainLink, AggregatorV3InterfaceABI, ethers.provider);
        break;
      case ChainlinkPriceOptions.DAI:
        const { daiChainLink } = await getNamedAccounts();
        priceFeed = new ethers.Contract(daiChainLink, AggregatorV3InterfaceABI, ethers.provider);
        break;
      case ChainlinkPriceOptions.JOE:
        const { joeChainLink } = await getNamedAccounts();
        priceFeed = new ethers.Contract(joeChainLink, AggregatorV3InterfaceABI, ethers.provider);
        break;
      case ChainlinkPriceOptions.MIM:
        const { mimChainLink } = await getNamedAccounts();
        priceFeed = new ethers.Contract(mimChainLink, AggregatorV3InterfaceABI, ethers.provider);
        break;   
      case ChainlinkPriceOptions.SPELL:
        const { spellChainLink } = await getNamedAccounts();
        priceFeed = new ethers.Contract(spellChainLink, AggregatorV3InterfaceABI, ethers.provider);
        break;   
      case ChainlinkPriceOptions.USDC:
        const { usdcChainLink } = await getNamedAccounts();
        priceFeed = new ethers.Contract(usdcChainLink, AggregatorV3InterfaceABI, ethers.provider);
        break;
      case ChainlinkPriceOptions.USDT:
        const { usdtChainLink } = await getNamedAccounts();
        priceFeed = new ethers.Contract(usdtChainLink, AggregatorV3InterfaceABI, ethers.provider);
        break;   
    }
  
    const roundData = await priceFeed.latestRoundData();
    return expandToXDecimals(bigNumberToNumber(roundData.answer), 10);
  } catch(err) {
    console.log('Error getting price feed from chain link', err);
  }

}

export async function calculateGasCost(): Promise<number> {
  try {
    // Get current AVAX price from Chainlink
    const avaxPrice = await getChainlinkPrice(ChainlinkPriceOptions.AXAX);

    // Use price to calculate gas cost
    // const gas = 21000;
    const gas = 260000;
    let gasPrice = await ethers.provider.getGasPrice() as BigNumber;
    const feeData = await ethers.provider.getFeeData() as { gasPrice: BigNumber, maxFeePerGas: BigNumber, maxPriorityFeePerGas: BigNumber };

    console.log('Fee Data Gas Price', feeData.gasPrice.toString());
    console.log('Fee Data Max Fee Per Gas', feeData.maxFeePerGas.toString());
    console.log('Fee Data Max Priority Fee Per Gas', feeData.maxPriorityFeePerGas.toString());


    if (gasPrice.toNumber() < 30000000000) {
      gasPrice = expandToXDecimals(30, 9); // Make sure gas price is no less then 28 gwei
    }

    const gasCost = gasPrice.mul(gas);
  
    console.log('Gas Price', gasPrice.toString());
    console.log('Gas Cost w/o price', gasCost.toString());

    // console.log('Gas Cost w/o price', gasCost);
    console.log('Gas cost with price', bigNumberToNumber(avaxPrice.mul(gasCost)));
  
    return bigNumberToNumber(avaxPrice.mul(gasCost));
  } catch(err) {
    console.log('Error while calculating gas cost', err);
  }
};