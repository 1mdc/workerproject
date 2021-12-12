import React from "react";


// All HOME PAGE ROUTES

//  Account inner pages

//  Blog inner pages

//  item inner pages

// NftPages
import Marketplace from "../views/pages/NftPages/Marketplace"

// other pages
import NotFound from "../views/NotFound"


// Route Specific
import {BrowserRouter, Route, Routes} from "react-router-dom";

const AppRoutes = (props: {
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
}) => {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Marketplace
                        userAddress={props.userAddress}
                        onLogout={props.onLogout}
                        onLogin={props.onLogin}
                        balance={props.balance}
                        tokenBalance={props.tokenBalance}
                        onMint={props.onMint}
                        peonLeftToMin={props.peonLeftToMin}
                        costToMint={props.costToMint}
                        mintedPeon={props.mintedPeon}
                        totalCapPeon={props.totalCapPeon}
                    />} />
                    <Route element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </>
    );
};

export default AppRoutes;
