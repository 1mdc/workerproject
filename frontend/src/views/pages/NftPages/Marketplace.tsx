import React, {useEffect} from 'react';

import Footer from '../../../components/footer/Footer';
import Header from '../../../components/header/Header';

import useDocumentTitle from '../../../components/useDocumentTitle';
import MenuCategoriesMarket from '../elements/MenuCategoriesMarket';
import Hero1 from "../../../components/hero/Hero1";

export default function Marketplace(props: {
    userAddress: string | null,
    onLogout: () => void,
    onLogin: () => void,
    balance: number,
    tokenBalance: number,
    onMint: () => void,
    peonLeftToMin: number,
    costToMint: number,
    mintedPeon: number,
    totalCapPeon: number
}) {
    useDocumentTitle(' Marketplace');
    return (
        <div>
            <Header userAddress={props.userAddress} onLogout={props.onLogout} onLogin={props.onLogin} balance={props.balance} tokenBalance={props.tokenBalance} />
            <Hero1
                onMint={props.onMint}
                peonLeftToMin={props.peonLeftToMin}
                costToMint={props.costToMint}
                mintedPeon={props.mintedPeon}
                totalCapPeon={props.totalCapPeon}
            />
            <div className="d-flex justify-content-center">
                <MenuCategoriesMarket/>
            </div>
            <Footer/>
        </div>
    );
};
