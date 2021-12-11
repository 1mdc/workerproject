import React, {useEffect, useRef, useState} from 'react';
import {BigNumber, Transaction} from "ethers";
import {JsonRpcSigner} from "@ethersproject/providers/src.ts/json-rpc-provider";
import {adminAddress} from "./config";
import {useForm} from "react-hook-form";
import {getBiddings, getLastMintedPeons, getOwnerPeons, getPeonDetail, Peon} from "./apis";
import {
    acceptBid,
    callPresale, cancelBid, connectWallet, endPresale,
    getEthBalance,
    getMaxPeon, getPeonMinedGold, getSigner,
    getTokenBalance, harvest,
    isPreSale, makeBid, mint,
    mintedPeon,
    mintFee,
    openSale, startSale, waitTransaction
} from "./contract";

interface SaleForm {
    numberOfPeons: number;
    feeIncrease: number;
}

interface BidForm {
    amount: number;
}

function App(props: { assetToken: string, signer: JsonRpcSigner }) {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0.0));
    const [goldBalance, setGoldBalance] = useState<BigNumber>(BigNumber.from(0.0));
    const [sale, setSale] = useState(0);
    const [sold, setSold] = useState(0);
    const [maxPeon, setMaxPeon] = useState(0);
    const [fee, setFee] = useState<BigNumber>(BigNumber.from(0));
    const [preSale, setPresale] = useState<Boolean>(false);
    const [lastMintedPeons, setLastMintedPeons] = useState<number[]>()
    const [userPeons, setUserPeons] = useState<number[]>()
    const [userBiddings, setUserBiddings] = useState<number[]>()

    const saleForm = useForm<SaleForm>();

    const transactionCallback = (transaction: Transaction) => {
        setError(`wait for transaction ${transaction.hash}`)
        if (transaction.hash) {
            waitTransaction(transaction.hash)
                .then(() => {
                    setTimeout(() => updateStats(), 4_000)
                    setError(``)
                })
                .catch(() => setError(`Transaction ${transaction.hash} timeout`))
        }
    }

    const onSubmitMint = (e: React.FormEvent<HTMLFormElement>) => {
        setError('');
        mint(props.signer, fee).then(transactionCallback).catch((err: any) => setError(err));
        e.preventDefault();
    }

    const onSubmitPresale = (e: React.FormEvent<HTMLFormElement>) => {
        setError('');
        callPresale(props.signer).then(transactionCallback).catch((err: any) => setError(err));
        e.preventDefault();
    }

    const onSubmitCompletePresale = (e: React.FormEvent<HTMLFormElement>) => {
        setError('');
        endPresale(props.signer).then(transactionCallback).catch((err: any) => setError(err));
        e.preventDefault();
    }

    const onSubmitSale = (data: SaleForm) => {
        setError('');
        startSale(props.signer, data.numberOfPeons, data.feeIncrease).then(transactionCallback).catch((err: any) => setError(err));
    }

    const toFloat = (big: BigNumber) => big.div(100000000000).toNumber() / 10000000

    useEffect(() => {
        updateStats();
    }, [userAddress])
//0xaba11c5dfdb797eb6f7328f5f70a9b390c19e34a3927e10f1925839d442c4293
    const updateStats = () => {
        if (userAddress !== '') {
            getEthBalance(userAddress).then((data: BigNumber) => setBalance(data))
            getTokenBalance(userAddress).then((data: BigNumber) => setGoldBalance(data))
            openSale().then((data: number) => setSale(data))
            mintedPeon().then((data: number) => setSold(data))
            getMaxPeon().then((data: number) => setMaxPeon(data))
            mintFee().then((data: BigNumber) => setFee(data))
            isPreSale().then((data:Boolean) => setPresale(data))
            getLastMintedPeons()
                .then(peonIds => setLastMintedPeons(peonIds))
                .catch(err => console.log(err))
            getOwnerPeons(userAddress)
                .then(peonIds => setUserPeons(peonIds))
                .catch(err => console.log(err))
            getBiddings(userAddress)
                .then(peonIds => setUserBiddings(peonIds))
                .catch(err => console.log(err))
        }
    }

    const onClickConnectWallet = () => {
        connectWallet().then((data:string[]) => {
            if (data && data.length > 0) {
                setConnected(true);
                setUserAddress(data[0]);
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
                </form>
            </div>
            : <div>presale is completed</div>}
        <form onSubmit={saleForm.handleSubmit(onSubmitSale)}>
            <div>
                Number of sales: <input type="number" {...saleForm.register("numberOfPeons")} />
                Fee Increase: <input type="number" {...saleForm.register("feeIncrease")} step="any"/>
                <input type="submit" value="Start Sale"/>
            </div>
        </form>
    </div>

    return (
        <div className="container">
            {error !== '' ? <div>{error}</div> : null}
            {connected ? <div>connected: {userAddress}</div> :
                <button onClick={onClickConnectWallet}>Connect wallet</button>}
            {connected && fee.gt(0) ? connectedComponent() : <div>Connect wallet to mint peons</div>}
            {connected ? currentSaleOpen() : null}
            {connected && userAddress.toLowerCase() === adminAddress.toLowerCase() ? adminPanel() : null}
            <div>
                <h4>My Biddings</h4>
                {userBiddings?.map(peonId => <PeonCard key={`userpeon-${peonId}`} peonId={peonId} signer={props.signer} reload={transactionCallback}
                                                       userAddress={userAddress}/>)}
            </div>
            <div>
                <h4>Your Peons</h4>
                {userPeons?.map(peonId => <PeonCard key={`userpeon-${peonId}`} peonId={peonId} signer={props.signer} reload={transactionCallback}
                                                    userAddress={userAddress}/>)}
            </div>
            <div>
                <h4>Last Minted Peons</h4>
                {lastMintedPeons?.map(peonId => <PeonCard key={`mintedpeon-${peonId}`} peonId={peonId} reload={transactionCallback}
                                                          signer={props.signer} userAddress={userAddress}/>)}
            </div>
        </div>
    );
}

function PeonCard(props: { peonId: number, userAddress: string, signer: JsonRpcSigner, reload: (tx: Transaction) => void }) {
    const [peon, setPeon] = useState<Peon>();
    const [loading, setLoading] = useState(true);
    const [minedAmount, setMinedAmount] = useState<BigNumber>(BigNumber.from(0.0))
    const bidForm = useForm<BidForm>();
    useEffect(() => {
        setLoading(true);
        setPeon(undefined)
        getPeonDetail(props.peonId).then(data => {
            setPeon(data);
            setLoading(false);
        }).catch(err => {
            setLoading(false)
        })
    }, [])
    useEffect(() => {
        if (peon) {
            if (peon.owner.toLowerCase() === props.userAddress.toLowerCase()) {
                getPeonMinedGold(props.peonId).then((data: BigNumber) => setMinedAmount(data));
            }
        }
    }, [peon])
    const bid = (data: BidForm) => {
        makeBid(props.signer, props.peonId, data.amount).then((tx:Transaction) => {
            setPeon(undefined)
            props.reload(tx);
        })
    }
    const cancel = (e: React.FormEvent<HTMLFormElement>) => {
        cancelBid(props.signer, props.peonId).then((tx:Transaction) => {
            setPeon(undefined)
            props.reload(tx)
        })
        e.preventDefault()
    }
    const accept = (e: React.FormEvent<HTMLFormElement>, buyer: string) => {
        acceptBid(props.signer, props.peonId, buyer).then((tx:Transaction) => {
            setPeon(undefined)
            props.reload(tx)
        })
        e.preventDefault()
    }
    const onClaimGold = (e: React.FormEvent<HTMLFormElement>) => {
        harvest(props.signer, props.peonId).then((tx:Transaction) => {
            setMinedAmount(BigNumber.from(0))
        })
        e.preventDefault()
    }

    const peonComponent = (peon: Peon) => <div>
        <div>Peon #{peon.peon_id}</div>
        <div>Owner {peon.owner}</div>
        <div>Created at {peon.created_at}</div>
        <div>Eff {peon.efficiency}</div>
        {minedAmount && minedAmount.gt(0) ? <div>pGold: {minedAmount.div(BigNumber.from(10).pow(13)).toNumber() / 100000}</div> : null}
        {minedAmount && minedAmount.gt(0) ? <form onSubmit={onClaimGold}><input type="submit" value="Claim pGold" /></form> : null}
        {peon.bids.map(b => b.buyer.toLowerCase()).includes(props.userAddress.toLowerCase()) ?
            <form onSubmit={cancel}><input type="submit" value="Cancel bid"/>
            </form> : (peon.owner.toLowerCase() !== props.userAddress.toLowerCase() ?
                <form onSubmit={bidForm.handleSubmit(bid)}>Offer: <input {...bidForm.register("amount")}
                                                                         type="text"/> <input type="submit"
                                                                                              value="Offer"/>
                </form> : null)}
        <div>Bids {peon.bids.map(bid => <form onSubmit={(e) => accept(e, bid.buyer)}
                                              key={`bid-${bid.buyer}`}>bid: {bid.buyer} value: {bid.value} {peon.owner.toLowerCase() === props.userAddress.toLowerCase() ?
            <input type="submit" value="Accept Offer"/> : null}</form>)}</div>
        <div>Transfers {peon.transfers.map(transfer => <div
            key={`transfer-${transfer.to}`}>from {transfer.from} to {transfer.to}</div>)}</div>
        <div>Purchases {peon.purchases.map(purchase => <div
            key={`purchase-${purchase.to}`}>from {purchase.from} to {purchase.to} price {purchase.value}</div>)}</div>
        <hr/>
    </div>
    return <div>
        {!loading ? (peon ? peonComponent(peon) : null) : <div>Loading...</div>}
    </div>
}

export default App;
