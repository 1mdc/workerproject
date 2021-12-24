import {BigNumber} from "ethers";

export function shortAddress(input: string): string {
    return `${input.substring(0, 5)}...${input.substring(input.length-4, input.length)}`
}

export function bigToNumber(input: BigNumber, displayDecimalPlaces: number, decimalPlaces: number): number {
    return input.div(BigNumber.from(10).pow(decimalPlaces - displayDecimalPlaces)).toNumber() / BigNumber.from(10).pow(displayDecimalPlaces).toNumber();
}