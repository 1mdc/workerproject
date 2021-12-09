import React, {useEffect, useState} from 'react';
import {BigNumber, ethers} from "ethers";
import {JsonRpcSigner} from "@ethersproject/providers/src.ts/json-rpc-provider";
import {adminAddress} from "./config";
import {useForm} from "react-hook-form";
import {getLastMintedPeons, getOwnerPeons, getPeonDetail, Peon} from "./apis";

interface SaleForm {
    numberOfPeons: number;
    feeIncrease: number;
}

function App(props: { web3: ethers.providers.Web3Provider, peonContract: ethers.Contract, pGoldContract: ethers.Contract, assetToken: string }) {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0.0));
    const [goldBalance, setGoldBalance] = useState<BigNumber>(BigNumber.from(0.0));
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [sale, setSale] = useState(0);
    const [sold, setSold] = useState(0);
    const [maxPeon, setMaxPeon] = useState(0);
    const [fee, setFee] = useState<BigNumber>(BigNumber.from(0));
    const [preSale, setPresale] = useState(false);
    const [lastMintedPeons, setLastMintedPeons] = useState<Peon[]>()
    const [userPeons, setUserPeons] = useState<Peon[]>()

    const saleForm = useForm<SaleForm>();

    const transactionCallback = (transaction: any) => {
        setError(`wait for transaction ${transaction.hash}`)
        props.web3
            .waitForTransaction(transaction.hash, 1, 50)
            .then(() => {
                updateStats()
                setError(``)
            })
            .catch(err => setError(`Transaction ${transaction.hash} timeout`))
    }

    const onSubmitMint = (e: React.FormEvent<HTMLFormElement>) => {
        setError('');
        if (signer) {
            props.peonContract.connect(signer).mint(1, {
                value: fee.mul(1),
                gasLimit: BigNumber.from(220_000).toBigInt()
            }).then(transactionCallback).catch((err: any) => setError(err));
        } else {
            setError('Account not found');
        }
        e.preventDefault();
    }

    const onSubmitPresale = (e: React.FormEvent<HTMLFormElement>) => {
        setError('');
        if (signer) {
            props.peonContract.connect(signer).preSale(10, {
                gasLimit: BigNumber.from(5_000_000).toBigInt()
            }).then(transactionCallback).catch((err: any) => setError(err));
        } else {
            setError('Account not found');
        }
        e.preventDefault();
    }

    const onSubmitCompletePresale = (e: React.FormEvent<HTMLFormElement>) => {
        setError('');
        if (signer) {
            props.peonContract.connect(signer).endPresale({
                gasLimit: BigNumber.from(50_000).toBigInt()
            }).then(transactionCallback).catch((err: any) => setError(err));
        } else {
            setError('Account not found');
        }
        e.preventDefault();
    }

    const onSubmitSale = (data: SaleForm) => {
        setError('');
        if (signer) {
            props.peonContract.connect(signer).startSale(data.numberOfPeons, ethers.utils.parseEther(data.feeIncrease.toString()), {
                gasLimit: BigNumber.from(120_000).toBigInt()
            }).then(transactionCallback).catch((err: any) => setError(err));
        } else {
            setError('Account not found');
        }
    }

    const toFloat = (big: BigNumber) => big.div(100000000000).toNumber() / 10000000

    useEffect(() => {
        updateStats();
    }, [userAddress])

    const updateStats = () => {
        if (userAddress !== '') {
            props.web3.getBalance(userAddress).then(data => {
                if (data) setBalance(BigNumber.from(data.toBigInt().toString()));
            })
            props.pGoldContract.balanceOf(userAddress).then((data: any) => {
                if (data) setGoldBalance(BigNumber.from(data.toBigInt().toString()))
            })
            props.peonContract.openSale().then((data: any) => {
                if (data) setSale(BigNumber.from(data.toBigInt().toString()).toNumber())
            })
            props.peonContract.mintedPeon().then((data: any) => {
                if (data) setSold(BigNumber.from(data.toBigInt().toString()).toNumber())
            })
            props.peonContract.maxPeon().then((data: any) => {
                if (data) setMaxPeon(BigNumber.from(data.toBigInt().toString()).toNumber())
            })
            props.peonContract.mintFee().then((data: any) => {
                if (data) setFee(BigNumber.from(data.toBigInt().toString()))
            })
            props.peonContract.isPreSale().then((data: any) => {
                if (data) setPresale(data)
            })
            getLastMintedPeons()
                .then(peonIds => Promise.all(peonIds.map(peonId => getPeonDetail(peonId))))
                .then(peons => setLastMintedPeons(peons))
                .catch(err => console.log(err))
            getOwnerPeons(userAddress)
                .then(peonIds => Promise.all(peonIds.map(peonId => getPeonDetail(peonId))))
                .then(peons => setUserPeons(peons))
                .catch(err => console.log(err))
        }
    }

    const onClickConnectWallet = () => {
        // @ts-ignore
        props.web3.provider
            .request({method: "eth_requestAccounts"})
            .then(data => {
                if (data && data.length > 0) {
                    setConnected(true);
                    setUserAddress(data[0]);
                    setSigner(props.web3.getSigner(0));
                }
            })
    }

    const connectedComponent = () => <div>
        <form onSubmit={onSubmitMint}>
            <input type="submit" value="Mint new peon"/>
        </form>
        <div>Balance: {toFloat(balance)}{props.assetToken}</div>
        <div>You have {toFloat(goldBalance)} pGold</div>
    </div>;

    const currentSaleOpen = () => <div>
        {sale - sold} peons left for sale. Cost is {toFloat(fee)}{props.assetToken} per peon. {sold} peons have been
        sold so far.
        maximum {maxPeon} peons.
    </div>
    const adminPanel = () => <div>
        {preSale ? <div>
            <form onSubmit={onSubmitPresale}>
                <div>
                    <input type="submit" value="Pre-sale"/>
                </div>
            </form>
            <form onSubmit={onSubmitCompletePresale}>
                <div>
                    <input type="submit" value="End Pre-sale"/>
                </div>
            </form></div>
            : <div>presale is completed</div>}
        <form onSubmit={saleForm.handleSubmit(onSubmitSale)}>
            <div>
                Number of sales: <input type="number" {...saleForm.register("numberOfPeons")} />
                Fee Increase: <input type="number" {...saleForm.register("feeIncrease")} step="any"/>
                <input type="submit" value="Start Sale"/>
            </div>
        </form>
    </div>
    const userMintedPeons = () => <div></div>
    const allMintedPeons = () => <div></div>

    return (
        <div className="container">
            {error !== '' ? <div>{error}</div> : null}
            {connected ? <div>connected: {userAddress}</div> :
                <button onClick={onClickConnectWallet}>Connect wallet</button>}
            {connected && fee.gt(0) ? connectedComponent() : <div>Connect wallet to mint peons</div>}
            {connected ? currentSaleOpen() : null}
            {connected && userAddress.toLowerCase() === adminAddress.toLowerCase() ? adminPanel() : null}
            {connected ? userMintedPeons() : null}
            {connected ? allMintedPeons() : null}
            <div>
                <h4>Your Peons</h4>
                {userPeons?.map(peon => <PeonCard peon={peon} userAddress={userAddress} />)}
            </div>
            <div>
                <h4>Last Minted Peons</h4>
                {lastMintedPeons?.map(peon => <PeonCard peon={peon} userAddress={userAddress} />)}
            </div>
        </div>
    );
}

function PeonCard(props: {peon: Peon, userAddress: string}) {
    return <div>
        <p>Peon #{props.peon.peon_id}</p>
        <p>Owner {props.peon.owner}</p>
        <p>Created at {props.peon.created_at}</p>
        {props.peon.owner !== props.userAddress ? <form>Offer: <input type="text" /> <input type="submit" value="Offer" /></form> : null}
        <p>Bids {props.peon.bids.map(bid => <form>bid: {bid.buyer} value: {bid.value} {props.peon.owner === props.userAddress ? <input type="submit" value="Accept Offer" /> : null}</form>)}</p>
        <p>Transfers {props.peon.transfers.map(transfer => <div>from {transfer.from} to {transfer.to}</div>)}</p>
        <p>Transfers {props.peon.purchases.map(purchase => <div>from {purchase.from} to {purchase.to} price {purchase.value}</div>)}</p>
    </div>
}

export default App;
