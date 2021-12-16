import React from 'react';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import {Transaction} from "ethers";
import {useForm} from "react-hook-form";
import PeonContract from "../peoncontract";

interface SaleForm {
    numberOfPeons: number;
    feeIncrease: number;
}

interface PreSaleForm {
    receiver: string;
}

export default function AdminView(props:{
    contract: PeonContract,
    userAddress: string | null,
    onLogout: () => void,
    onLogin: () => void,
    balance: number,
    tokenBalance: number,
    reload: (tx: Transaction) => void,
    preSale: boolean,
}) {
    const saleForm = useForm<SaleForm>();
    const presaleForm = useForm<PreSaleForm>();

    const onSubmitPresale = (data: PreSaleForm) => {
        if (props.userAddress) props.contract.callPresale(props.contract.getSigner(props.userAddress), data.receiver).then(props.reload);
    }

    const onSubmitCompletePresale = (e: React.FormEvent<HTMLFormElement>) => {
        if (props.userAddress) props.contract.endPresale(props.contract.getSigner(props.userAddress)).then(props.reload);
        e.preventDefault();
    }

    const onSubmitSale = (data: SaleForm) => {
        if (props.userAddress) props.contract.startSale(props.contract.getSigner(props.userAddress), data.numberOfPeons, data.feeIncrease).then(props.reload);
    }

    return (<div>
        <Header userAddress={props.userAddress} onLogout={props.onLogout} onLogin={props.onLogin} balance={props.balance} tokenBalance={props.tokenBalance} />
        <div className="d-flex justify-content-center">
            <div className="box is__big">
                <h1>Admin Panel</h1>
                {props.preSale ? <div>
                        <form onSubmit={presaleForm.handleSubmit(onSubmitPresale)}>
                            <div>
                                Receiver: <input type="text" {...presaleForm.register("receiver")} />
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