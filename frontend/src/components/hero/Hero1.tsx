import React from 'react';
import {assetToken} from "../../config";
import {BigNumber, Transaction} from "ethers";

export default function Hero1(props: {
    peonLeftToMin: number,
    costToMint: number,
    mintedPeon: number,
    totalCapPeon: number,
    reload: (tx: Transaction) => void,
    userAddress: string | null,
    mintFee: BigNumber,
    mint: () => void
}) {

    return (
        <div className="hero__1">
            <div className="container">
                <div className="row align-items-center">
                    <div className="col-lg-6">
                        <div className="hero__left space-y-20">
                            <h1 className="hero__title">
                                Peon Ecosystem
                            </h1>
                            <p className="hero__text txt">
                                Peon NFT is an important asset for Peon Ecosystem. It generates pGOLD that could be used as
                                currency in games and also can be used to exchange to other tokens.
                            </p>
                            <p className="hero__text txt">
                                <b>{props.peonLeftToMin} Peons</b> left can be minted in this sale. Cost to mint is <b>{props.costToMint} {assetToken}</b>. <b>{props.mintedPeon}/{props.totalCapPeon}</b> peons
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
                    <div className="col-lg-6">
                        <img
                            className="img-fluid w-full"
                            id="img_js"
                            src="img/bg/in_hero1.png"
                            alt="img"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
