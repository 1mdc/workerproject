import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {assetToken} from "./config";
import {getSigner, web3} from "./contract";
import {UseWalletProvider} from "use-wallet";


ReactDOM.render(
    <UseWalletProvider>
        <App />
    </UseWalletProvider>,
    document.getElementById('root')
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
