import {BigNumber, ethers, Transaction} from "ethers";
import {peonAbi, pGoldAbi} from "./abis";
import {TransactionReceipt} from "@ethersproject/abstract-provider";
import {JsonRpcSigner} from "@ethersproject/providers/src.ts/json-rpc-provider";

export default class PeonContract {
    private readonly web3: ethers.providers.Web3Provider;
    private peonContract: ethers.Contract;
    private pGoldContract: ethers.Contract;

    constructor(peonAddress: string, pGoldAddress: string) {
        this.web3 = new ethers.providers.Web3Provider(window.ethereum);
        this.peonContract = new ethers.Contract(peonAddress, peonAbi, this.web3);
        this.pGoldContract = new ethers.Contract(pGoldAddress, pGoldAbi, this.web3);
    }


    getSigner(userAddress: string): JsonRpcSigner {
        return this.web3.getSigner(userAddress);
    }

    waitTransaction(tx: string): Promise<TransactionReceipt> {
        return this.web3.waitForTransaction(tx, 1, 15_000);
    }

    mint(signer: JsonRpcSigner, fee: BigNumber): Promise<Transaction> {
        const numberOfPeon = 1;
        return this.peonContract.connect(signer).mint(numberOfPeon, {
            value: fee.mul(numberOfPeon),
            gasLimit: 300_000
        })
    }

    callPresale(signer: JsonRpcSigner, receiver: string): Promise<Transaction> {
        return this.peonContract.connect(signer).preSale(10, receiver, {
            gasLimit: 300_000
        })
    }

    startSale(signer: JsonRpcSigner, numberOfPeons: number, feeIncrease: number): Promise<Transaction> {
        return this.peonContract.connect(signer).startSale(numberOfPeons, ethers.utils.parseEther(feeIncrease.toString()), {
            gasLimit: 300_000
        })
    }

    endPresale(signer: JsonRpcSigner): Promise<Transaction> {
        return this.peonContract.connect(signer).endPresale({
            gasLimit: 300_000
        })
    }

    getEthBalance(userAddress: string): Promise<BigNumber> {
        return this.web3.getBalance(userAddress).then(data => BigNumber.from(data.toBigInt().toString()))
    }

    getTokenBalance(userAddress: string): Promise<BigNumber> {
        return this.pGoldContract.balanceOf(userAddress).then((data: any) => BigNumber.from(data.toBigInt().toString()))
    }

    openSale(): Promise<number> {
        return this.peonContract.openSale().then((data: any) => BigNumber.from(data.toBigInt().toString()).toNumber())
    }

    mintedPeon(): Promise<number> {
        return this.peonContract.mintedPeon().then((data: any) => BigNumber.from(data.toBigInt().toString()).toNumber());
    }

    getMaxPeon(): Promise<number> {
        return this.peonContract.maxPeon().then((data: any) => BigNumber.from(data.toBigInt().toString()).toNumber());
    }

    mintFee(): Promise<BigNumber> {
        return this.peonContract.mintFee().then((data: any) => BigNumber.from(data.toBigInt().toString()));
    }

    isPreSale(): Promise<boolean> {
        return this.peonContract.isPreSale();
    }

    connectWallet(): Promise<string[]> {
        return this.web3.listAccounts();
    }

    makeBid(signer: JsonRpcSigner, peonId: number, amount: number): Promise<Transaction> {
        return this.peonContract.connect(signer).bid(peonId, {
            value: ethers.utils.parseEther(amount.toString()),
            gasLimit: 300_000
        })
    }

    cancelBid(signer: JsonRpcSigner, peonId: number): Promise<Transaction> {
        return this.peonContract.connect(signer).cancel(peonId, {
            gasLimit: 300_000
        })
    }

    acceptBid(signer: JsonRpcSigner, peonId: number, buyer: string): Promise<Transaction> {
        return this.peonContract.connect(signer).accept(peonId, buyer, {
            gasLimit: 300_000
        })
    }

    getPeonMinedGold(peonId: number): Promise<BigNumber> {
        return this.peonContract.harvestableAmount(peonId).then((data: any) => BigNumber.from(data.toBigInt().toString()));
    }

    harvest(signer: JsonRpcSigner, peonId: number): Promise<Transaction> {
        return this.peonContract.connect(signer).harvest(peonId);
    }

    transfer(signer: JsonRpcSigner, peonId: number, sender: string, receiver: string): Promise<Transaction> {
        return this.peonContract.connect(signer)["safeTransferFrom(address,address,uint256)"](sender, receiver, peonId);
    }

    getAdminAddress(): Promise<string> {
        return this.peonContract.treasuryKeeperAddress();
    }
}

