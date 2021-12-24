import React, {useEffect, useState} from 'react';
import {BigNumber, Transaction} from "ethers";
import {getBids, getLastMintedPeons, getOwnerPeons, getRandomPeons} from "./apis";
import PeonContract from "./peoncontract";
import "./assets/css/plugins/bootstrap.min.css";
import 'remixicon/fonts/remixicon.css'
import "./assets/scss/style.scss";
import AppRouter from "./Router/routes";
import {useWallet} from "use-wallet";
import {bigToNumber} from "./utils";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App(props: { contract: PeonContract, chainId: number, peonAddress: string, goldAddress: string, assetToken: string, rpcEndpoint: string }) {
    const wallet = useWallet();
    const [goldBalance, setGoldBalance] = useState<BigNumber>(BigNumber.from(0.0));
    const [sale, setSale] = useState(0);
    const [sold, setSold] = useState(0);
    const [maxPeon, setMaxPeon] = useState(0);
    const [fee, setFee] = useState<BigNumber>(BigNumber.from(0));
    const [preSale, setPresale] = useState<boolean>(false);
    const [lastMintedPeons, setLastMintedPeons] = useState<number[]>([])
    const [userPeons, setUserPeons] = useState<number[]>([])
    const [userBids, setUserBids] = useState<number[]>([])
    const [marketPeons, setMarketPeons] = useState<number[]>([]);
    const [adminAddress, setAdminAddress] = useState("");

    useEffect(() => {
        // Check if MetaMask is installed
        // MetaMask injects the global API into window.ethereum
        if (window.ethereum) {
            window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{chainId: "0x" + props.chainId.toString(16)}], // chainId must be in hexadecimal numbers
            }).catch((error: any) => {
                // This error code indicates that the chain has not been added to MetaMask
                // if it is not, then install it into the user MetaMask
                // @ts-ignore
                if (error.code === 4902) {
                    window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: "0x" + props.chainId.toString(16),
                                rpcUrl: props.rpcEndpoint,
                            },
                        ],
                    }).catch((addError: any) => {
                        console.error(addError);
                    })
                }
                console.error(error);
            })
        }
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
            setTimeout(() => updateStats(), 20_000)
        } else {
            toast(`Transaction was canceled`)
        }
    }

    const mintPeon = () => {
        if (wallet.account)
            props.contract.mint(props.contract.getSigner(wallet.account), fee).then(transactionCallback).catch((err) => toast(err.message));
    }

    useEffect(() => {
        if (wallet && wallet.account && wallet.chainId === props.chainId) {
            updateStats();
        } else {
            if (wallet && wallet.account && wallet.chainId) {
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
            props.contract.isPreSale().then((data: boolean) => setPresale(data)).catch((err) => toast(err.message))
            props.contract.getAdminAddress().then((data: string) => setAdminAddress(data)).catch((err) => toast(err.message))
            getLastMintedPeons()
                .then(peonIds => setLastMintedPeons(peonIds))
                .catch(err => toast(err.message))
            getOwnerPeons(wallet.account)
                .then(peonIds => setUserPeons(peonIds))
                .catch(err => toast(err.message))
            getBids(wallet.account)
                .then(peonIds => setUserBids(peonIds))
                .catch(err => toast(err.message))
            getRandomPeons()
                .then(peonIds => setMarketPeons(peonIds))
                .catch(err => toast(err.message))
        } else {
            setGoldBalance(BigNumber.from(0))
            setLastMintedPeons([])
            setUserBids([])
            setUserPeons([])
            setSale(0)
            setSold(0)
            setMaxPeon(0)
            setFee(BigNumber.from(0))
            setAdminAddress("")
        }
    }

    return (
        <div className="App overflow-hidden">
            <ToastContainer/>
            <AppRouter
                contract={props.contract}
                assetToken={props.assetToken}
                userAddress={wallet.account}
                onLogout={onLogout}
                onLogin={onLogin}
                balance={bigToNumber(BigNumber.from(wallet.balance), 5, 18)}
                tokenBalance={bigToNumber(BigNumber.from(goldBalance), 5, 18)}
                peonLeftToMin={sale - sold}
                costToMint={bigToNumber(fee, 7, 18)}
                mintedPeon={sold}
                totalCapPeon={maxPeon}
                userBids={userBids}
                marketPeons={marketPeons}
                userPeons={userPeons}
                recentMinted={lastMintedPeons}
                reload={transactionCallback}
                preSale={preSale}
                mintFee={fee}
                mint={mintPeon}
                peonAddress={props.peonAddress}
                goldAddress={props.goldAddress}
                isAdmin={wallet.account ? adminAddress.toLowerCase() === wallet.account.toLowerCase() : false}
            />
        </div>
    )
}
