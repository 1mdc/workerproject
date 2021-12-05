import React, {useEffect, useState} from 'react';
import {BigNumber, ethers} from "ethers";
import {JsonRpcSigner} from "@ethersproject/providers/src.ts/json-rpc-provider";
import {pGoldAddress} from "./addresses";

function App(props: { web3: ethers.providers.Web3Provider, peonContract: ethers.Contract, pGoldContract: ethers.Contract }) {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [balance, setBalance] = useState<BigNumber>(BigNumber.from(0.0));
    const [goldBalance, setGoldBalance] = useState<BigNumber>(BigNumber.from(0.0));
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [sale, setSale] = useState(0);
    const [sold, setSold] = useState(0);
    const [cost, setCost] = useState<BigNumber>(BigNumber.from(0));
    const [maxPeon, setMaxPeon] = useState(0);
    const fee = ethers.utils.parseEther("0.042");

    const toFloat = (big: BigNumber) => big.div(100000000000).toNumber() / 10000000

    useEffect(() => {
        updateBalance();
    }, [userAddress])

    const updateBalance = () => {
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
                if (data) setCost(BigNumber.from(data.toBigInt().toString()))
            })
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

    const mint = () => {
        setError('');
        if (signer) {
            props.peonContract.estimateGas.mint(1, {value: fee}).then(estimate => {
                try {
                    const connected = props.peonContract.connect(signer);
                    connected.mint(1, {
                        value: fee,
                        gasLimit: estimate.toBigInt()
                    }).then(() => updateBalance()).catch((err: any) => setError(err));
                } catch (err: any) {
                    setError(err)
                }
            }).catch((err: any) => setError(err))
        } else {
            setError('Account not found');
        }
    }

    const connectedComponent = () => <div>
        <div>
            <button onClick={mint}>Mint new peon</button>
        </div>
        <div>Balance: {toFloat(balance)} ETH</div>
        <div>pGold: {toFloat(goldBalance)} pGold</div>
    </div>;

    const currentSaleOpen = () => <div>
        {sale - sold} peons left for sale. Cost is {toFloat(cost)}ETH per peon. {sold} peons have been sold so far.
        maximum {maxPeon} peons.
    </div>
    const userMintedPeons = () => <div></div>
    const allMintedPeons = () => <div></div>

    return (
        <div className="container">
            {error !== '' ? <div>{error}</div> : null}
            {connected ? <div>connected: {userAddress}</div> :
                <button onClick={onClickConnectWallet}>Connect wallet</button>}
            {connected ? connectedComponent() : <div>Connect wallet to mint peons</div>}
            {connected ? currentSaleOpen() : null}
            {connected ? userMintedPeons() : null}
            {connected ? allMintedPeons() : null}
        </div>
    );
}

export default App;
