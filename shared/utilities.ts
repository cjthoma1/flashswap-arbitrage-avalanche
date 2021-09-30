import { BigNumber } from 'ethers'
import { ethers } from 'hardhat';

export const MINIMUM_LIQUIDITY = BigNumber.from(10).pow(3)


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

