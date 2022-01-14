import React from 'react';
import {BigNumber, Transaction} from "ethers";
import Banana from "../Banana";
import {Link} from "react-router-dom";

export default function Hero1(props: {
    peonLeftToMin: number,
    costToMint: number,
    mintedPeon: number,
    totalCapPeon: number,
    reload: (tx: Transaction) => void,
    userAddress: string | null,
    mintFee: BigNumber,
    mint: () => void,
    assetToken: string
}) {

    return (
        <div className="hero__1">
            <div className="container">
                <div className="row align-items-center">
                    <div className="col-lg-12">
                        <div className="hero__left space-y-20">
                            <h1 className="hero__title">
                                Peon NFT & pBANANA
                            </h1>
                            <p className="hero__text txt">
                                Most of NFT games are not so attractive to play.
                            </p>
                            <p className="hero__text txt">
                                Introducing Peon NFT. an <s>Play</s> Hodl-to-earn NFT. By hodling <b>Peons</b>, you can earn <b>pBANANA</b> token (<Banana />). Read more in <Link to="/faqs">FAQs</Link>.
                            </p>
                            <p className="hero__text txt">
                                <b>{props.peonLeftToMin} Peons</b> left can be minted in the current sale. Cost to mint is <b>{props.costToMint} {props.assetToken}</b>. <b>{props.mintedPeon}/{props.totalCapPeon}</b> peons
                                minted so far.
                            </p>
                            <div
                                className="space-x-20 d-flex flex-column flex-md-row
							sm:space-y-20">
                                <button className="btn btn-primary" onClick={props.mint}>
                                    Mint
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
