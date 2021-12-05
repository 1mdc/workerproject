import React, {useState} from 'react';
import {ethers} from "ethers";

function App(props: { web3: ethers.providers.Web3Provider }) {
    const [connected, setConnected] = useState(false);
    const [userAddress, setUserAddress] = useState("");

    const onClickConnectWallet = () => {
        // @ts-ignore
        props.web3.provider
            .request({method: "eth_requestAccounts"})
            .then(data => {
                if (data && data.length > 0) {
                    setConnected(true);
                    setUserAddress(data[0]);
                }
            })
    }

    const mint = () => {

    }

    return (
        <div className="container">
            <div>
                {connected ? `connected: ${userAddress}` :
                    <button onClick={onClickConnectWallet}>Connect wallet</button>}
            </div>
            <div>
                {connected ? <button onClick={mint}>Mint new peon</button> : <div>Connect wallet to mint peons</div>}
            </div>
        </div>
    );
}

export default App;
