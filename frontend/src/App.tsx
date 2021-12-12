import React, {useEffect, useState} from 'react';
import {BigNumber, Transaction} from "ethers";
import {getBiddings, getLastMintedPeons, getOwnerPeons, getRandomPeons} from "./apis";
import {getMaxPeon, getTokenBalance, isPreSale, mintedPeon, mintFee, openSale, waitTransaction} from "./contract";
import "./assets/css/plugins/bootstrap.min.css";
import 'remixicon/fonts/remixicon.css'
import "./assets/scss/style.scss";
import AppRouter from "./Router/routes";
import {useWallet} from "use-wallet";
import {bigToNumber} from "./utils";

export default function App() {
    const wallet = useWallet();
    const [error, setError] = useState("");
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
        wallet.connect("injected").then(() => console.log("login..."))
    }

    function onLogout() {
        wallet.reset();
    }

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

    const toFloat = (big: BigNumber) => big.div(100000000000).toNumber() / 10000000

    useEffect(() => {
        updateStats();
    }, [wallet.account])

    const updateStats = () => {
        if (wallet.account) {
            getTokenBalance(wallet.account).then((data: BigNumber) => setGoldBalance(data))
            openSale().then((data: number) => setSale(data))
            mintedPeon().then((data: number) => setSold(data))
            getMaxPeon().then((data: number) => setMaxPeon(data))
            mintFee().then((data: BigNumber) => setFee(data))
            isPreSale().then((data:boolean) => setPresale(data))
            getLastMintedPeons()
                .then(peonIds => setLastMintedPeons(peonIds))
                .catch(err => console.log(err))
            getOwnerPeons(wallet.account)
                .then(peonIds => setUserPeons(peonIds))
                .catch(err => console.log(err))
            getBiddings(wallet.account)
                .then(peonIds => setUserBiddings(peonIds))
                .catch(err => console.log(err))
            getRandomPeons()
                .then(peonIds => setMarketPeons(peonIds))
                .catch(err => console.log(err))
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
            <AppRouter
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
            />
        </div>
    )
}
