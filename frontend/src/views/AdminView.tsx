import React from 'react';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import {callPresale, endPresale, getSigner, startSale} from "../contract";
import {Transaction} from "ethers";
import {useForm} from "react-hook-form";

interface SaleForm {
    numberOfPeons: number;
    feeIncrease: number;
}

export default function AdminView(props:{
    userAddress: string | null,
    onLogout: () => void,
    onLogin: () => void,
    balance: number,
    tokenBalance: number,
    reload: (tx: Transaction) => void,
    preSale: boolean,
}) {
    const saleForm = useForm<SaleForm>();

    const onSubmitPresale = (e: React.FormEvent<HTMLFormElement>) => {
        if (props.userAddress) callPresale(getSigner(props.userAddress), "").then(props.reload);
        e.preventDefault();
    }

    const onSubmitCompletePresale = (e: React.FormEvent<HTMLFormElement>) => {
        if (props.userAddress) endPresale(getSigner(props.userAddress)).then(props.reload);
        e.preventDefault();
    }

    const onSubmitSale = (data: SaleForm) => {
        if (props.userAddress) startSale(getSigner(props.userAddress), data.numberOfPeons, data.feeIncrease).then(props.reload);
    }

    return (<div>
        <Header userAddress={props.userAddress} onLogout={props.onLogout} onLogin={props.onLogin} balance={props.balance} tokenBalance={props.tokenBalance} />
        <div className="d-flex justify-content-center">
            <div className="box is__big">
                <h1>Admin Panel</h1>
                {props.preSale ? <div>
                        <form onSubmit={onSubmitPresale}>
                            <div>
                                <input className="btn btn-primary" type="submit" value="Pre-sale"/>
                            </div>
                        </form>
                        <form onSubmit={onSubmitCompletePresale}>
                            <div>
                                <input className="btn btn-primary" type="submit" value="End Pre-sale"/>
                            </div>
                        </form>
                    </div>
                    : <div>presale is completed</div>}
                <form onSubmit={saleForm.handleSubmit(onSubmitSale)}>
                    <div>
                        Number of sales: <input type="number" {...saleForm.register("numberOfPeons")} />
                        Fee Increase: <input type="number" {...saleForm.register("feeIncrease")} step="any"/>
                        <input className="btn btn-primary" type="submit" value="Start Sale"/>
                    </div>
                </form>
            </div>

        </div>
        <Footer/>
    </div>)
}