import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {UseWalletProvider} from "use-wallet";
import PeonContract from "./peoncontract";

const assetToken = "BNB";
const chainId = parseInt(process.env.REACT_APP_CHAINID || "0");
const peonAddress = process.env.REACT_APP_PEON_ADDRESS || "0xerror";
const pGoldAddress = process.env.REACT_APP_GOLD_ADDRESS || "0xerror";
const contract = new PeonContract(peonAddress, pGoldAddress)
ReactDOM.render(
    <UseWalletProvider>
        <App contract={contract} chainId={chainId} assetToken={assetToken} goldAddress={pGoldAddress} peonAddress={peonAddress} />
    </UseWalletProvider>,
    document.getElementById('root')
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
