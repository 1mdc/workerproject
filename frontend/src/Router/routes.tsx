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
import {BigNumber, Transaction} from "ethers";
import AdminView from "../views/AdminView";

export default function AppRoutes(props: {
    userAddress: string | null,
    onLogout: () => void,
    onLogin: () => void,
    balance: number,
    tokenBalance: number,
    peonLeftToMin: number,
    costToMint: number,
    mintedPeon: number,
    totalCapPeon: number,
    marketPeons: number[],
    userPeons: number[],
    userBids: number[],
    recentMinted: number[],
    reload: (tx: Transaction) => void,
    preSale: boolean,
    mintFee: BigNumber,
    mint: () => void
}) {
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
                        peonLeftToMin={props.peonLeftToMin}
                        costToMint={props.costToMint}
                        mintedPeon={props.mintedPeon}
                        totalCapPeon={props.totalCapPeon}
                        userBids={props.userBids}
                        marketPeons={props.marketPeons}
                        userPeons={props.userPeons}
                        recentMinted={props.recentMinted}
                        reload={props.reload}
                        mintFee={props.mintFee}
                        mint={props.mint}
                    />} />
                    <Route path="/admin" element={<AdminView userAddress={props.userAddress}
                                                             onLogout={props.onLogout}
                                                             onLogin={props.onLogin}
                                                             balance={props.balance}
                                                             tokenBalance={props.tokenBalance}
                                                             reload={props.reload}
                                                             preSale={props.preSale}
                                                            />} />
                    <Route element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </>
    );
};

