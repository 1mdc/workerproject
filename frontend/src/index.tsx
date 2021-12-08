import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {ethers} from "ethers";
import {assetToken, peonAddress, pGoldAddress} from "./config";
import {peonAbi, pGoldAbi} from "./abis";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const peonContract = new ethers.Contract(peonAddress, peonAbi, provider);
const pGoldContract = new ethers.Contract(pGoldAddress, pGoldAbi, provider);

ReactDOM.render(
  <React.StrictMode>
    <App web3={provider} peonContract={peonContract} pGoldContract={pGoldContract} assetToken={assetToken} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
