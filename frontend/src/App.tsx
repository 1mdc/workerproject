import React, {useEffect, useState} from 'react';
import {BigNumber, Transaction} from "ethers";
import {getBiddings, getLastMintedPeons, getOwnerPeons, getRandomPeons} from "./apis";
import PeonContract from "./peoncontract";
import "./assets/css/plugins/bootstrap.min.css";
import 'remixicon/fonts/remixicon.css'
import "./assets/scss/style.scss";
import AppRouter from "./Router/routes";
import {useWallet} from "use-wallet";
import {bigToNumber} from "./utils";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App(props: {contract: PeonContract, chainId: number, peonAddress: string, goldAddress: string, assetToken: string}) {
    const wallet = useWallet();
    const [goldBalance, setGoldBalance] = useState<BigNumber>(BigNumber.from(0.0));
    const [sale, setSale] = useState(0);
    const [sold, setSold] = useState(0);
    const [maxPeon, setMaxPeon] = useState(0);
    const [fee, setFee] = useState<BigNumber>(BigNumber.from(0));
    const [preSale, setPresale] = useState<boolean>(false);
    const [lastMintedPeons, setLastMintedPeons] = useState<number[]>([])
    const [userPeons, setUserPeons] = useState<number[]>([])
    const [userBiddings, setUserBiddings] = useState<number[]>([])
    const [marketPeons, setMarketPeons] = useState<number[]>([]);

    useEffect(() => {
        onLogin()
    }, [])

    function onLogin() {
        wallet.connect("injected").catch((err) => toast(err.message))
    }

    function onLogout() {
        wallet.reset();
    }

    const transactionCallback = (transaction: Transaction) => {
        if (transaction && transaction.hash) {
            toast(`Transaction is processing ${transaction.hash}`, {autoClose: 20_000})
            props.contract.waitTransaction(transaction.hash)
                .then(() => {
                    setTimeout(() => updateStats(), 20_000)
                })
                .catch((err) => toast(err.message))
        } else {
            toast(`Transaction was canceled`)
        }
    }

    const toFloat = (big: BigNumber) => big.div(100000000000).toNumber() / 10000000

    const mintPeon = () => {
        if (wallet.account)
            props.contract.mint(props.contract.getSigner(wallet.account), fee).then(transactionCallback).catch((err) => toast(err.message));
    }

    useEffect(() => {
        if (wallet.account && wallet.chainId === props.chainId) {
            updateStats();
        } else {
            if (wallet.account && wallet.chainId) {
                toast("Incorrect chain. Please connect to BSC Chain")
                wallet.reset()
            }
        }
    }, [wallet.account])

    const updateStats = () => {
        if (wallet.account) {
            props.contract.getTokenBalance(wallet.account).then((data: BigNumber) => setGoldBalance(data)).catch((err) => toast(err.message))
            props.contract.openSale().then((data: number) => setSale(data)).catch((err) => toast(err.message))
            props.contract.mintedPeon().then((data: number) => setSold(data)).catch((err) => toast(err.message))
            props.contract.getMaxPeon().then((data: number) => setMaxPeon(data)).catch((err) => toast(err.message))
            props.contract.mintFee().then((data: BigNumber) => setFee(data)).catch((err) => toast(err.message))
            props.contract.isPreSale().then((data:boolean) => setPresale(data)).catch((err) => toast(err.message))
            getLastMintedPeons()
                .then(peonIds => setLastMintedPeons(peonIds))
                .catch(err => toast(err.message))
            getOwnerPeons(wallet.account)
                .then(peonIds => setUserPeons(peonIds))
                .catch(err => toast(err.message))
            getBiddings(wallet.account)
                .then(peonIds => setUserBiddings(peonIds))
                .catch(err => toast(err.message))
            getRandomPeons()
                .then(peonIds => setMarketPeons(peonIds))
                .catch(err => toast(err.message))
        } else {
            setGoldBalance(BigNumber.from(0))
            setLastMintedPeons([])
            setUserBiddings([])
            setUserPeons([])
            setSale(0)
            setSold(0)
            setMaxPeon(0)
            setFee(BigNumber.from(0))
        }
    }

    return (
        <div className="App overflow-hidden">
            <ToastContainer />
            <AppRouter
                contract={props.contract}
                assetToken={props.assetToken}
                userAddress={wallet.account}
                onLogout={onLogout}
                onLogin={onLogin}
                balance={bigToNumber(BigNumber.from(wallet.balance), 5, 18)}
                tokenBalance={bigToNumber(BigNumber.from(goldBalance), 5, 18)}
                peonLeftToMin={sale - sold}
                costToMint={toFloat(fee)}
                mintedPeon={sold}
                totalCapPeon={maxPeon}
                userBids={userBiddings}
                marketPeons={marketPeons}
                userPeons={userPeons}
                recentMinted={lastMintedPeons}
                reload={transactionCallback}
                preSale={preSale}
                mintFee={fee}
                mint={mintPeon}
            />
        </div>
    )
}
