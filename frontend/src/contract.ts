import {BigNumber, ethers, Transaction} from "ethers";
import {peonAddress, pGoldAddress} from "./config";
import {peonAbi, pGoldAbi} from "./abis";
import {TransactionReceipt} from "@ethersproject/abstract-provider";
import {JsonRpcSigner} from "@ethersproject/providers/src.ts/json-rpc-provider";


const web3 = new ethers.providers.Web3Provider(window.ethereum);
const peonContract = new ethers.Contract(peonAddress, peonAbi, web3);
const pGoldContract = new ethers.Contract(pGoldAddress, pGoldAbi, web3);

export function getSigner(): JsonRpcSigner {
    return web3.getSigner(0);
}

export function waitTransaction(tx: string): Promise<TransactionReceipt> {
    return web3.waitForTransaction(tx, 1, 50);
}

export function mint(signer: JsonRpcSigner, fee: BigNumber): Promise<Transaction> {
    const numberOfPeon = 1;
    return peonContract.connect(signer).mint(numberOfPeon, {
        value: fee.mul(numberOfPeon),
        gasLimit: BigNumber.from(220_000).toBigInt()
    })
}

export function callPresale(signer: JsonRpcSigner): Promise<Transaction> {
    return peonContract.connect(signer).preSale(10, {
        gasLimit: BigNumber.from(5_000_000).toBigInt()
    })
}

export function startSale(signer: JsonRpcSigner, numberOfPeons: number, feeIncrease: number): Promise<Transaction> {
    return peonContract.connect(signer).startSale(numberOfPeons, ethers.utils.parseEther(feeIncrease.toString()), {
        gasLimit: BigNumber.from(120_000).toBigInt()
    })
}

export function endPresale(signer: JsonRpcSigner): Promise<Transaction> {
    return peonContract.connect(signer).endPresale({
        gasLimit: BigNumber.from(50_000).toBigInt()
    })
}

export function getEthBalance(userAddress: string): Promise<BigNumber> {
    return web3.getBalance(userAddress).then(data => BigNumber.from(data.toBigInt().toString()))
}

export function getTokenBalance(userAddress: string): Promise<BigNumber> {
    return pGoldContract.balanceOf(userAddress).then((data: any) => BigNumber.from(data.toBigInt().toString()))
}

export function openSale(): Promise<number> {
    return peonContract.openSale().then((data: any) => BigNumber.from(data.toBigInt().toString()).toNumber())
}

export function mintedPeon(): Promise<number> {
    return peonContract.mintedPeon().then((data: any) => BigNumber.from(data.toBigInt().toString()).toNumber());
}

export function getMaxPeon(): Promise<number> {
    return peonContract.maxPeon().then((data: any) => BigNumber.from(data.toBigInt().toString()).toNumber());
}

export function mintFee(): Promise<BigNumber> {
    return peonContract.mintFee().then((data: any) => BigNumber.from(data.toBigInt().toString()));
}

export function isPreSale(): Promise<Boolean> {
    return peonContract.isPreSale();
}

export function connectWallet(): Promise<string[]> {
    // @ts-ignore
    return web3.provider
        .request({method: "eth_requestAccounts"});
}

export function makeBid(signer: JsonRpcSigner, peonId: number, amount: number): Promise<Transaction> {
    return peonContract.connect(signer).bid(peonId, {
        value: ethers.utils.parseEther(amount.toString()),
        gasLimit: BigNumber.from(120_000).toBigInt()
    });
}

export function cancelBid(signer: JsonRpcSigner, peonId: number): Promise<Transaction> {
    return peonContract.connect(signer).cancel(peonId, {
        gasLimit: BigNumber.from(120_000).toBigInt()
    });
}

export function acceptBid(signer: JsonRpcSigner, peonId: number, buyer: string): Promise<Transaction> {
    return peonContract.connect(signer).accept(peonId, buyer, {
        gasLimit: BigNumber.from(220_000).toBigInt()
    });
}