import {BigNumber} from "ethers";

export function shortAddress(input: string): string {
    return `${input.substring(0, 5)}...${input.substring(input.length-4, input.length)}`
}

export function bigToNumber(input: BigNumber, d: number, b: number) {
    return input.div(BigNumber.from(10).pow(b - d)).toNumber() / BigNumber.from(10).pow(d).toNumber();
}