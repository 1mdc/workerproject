import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
// @ts-ignore
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import {BigNumber, Transaction} from "ethers";
import {getPeonDetail, Peon} from "../../apis";
import {useForm} from "react-hook-form";
import {acceptBid, cancelBid, getPeonMinedGold, getSigner, harvest, makeBid, transfer} from "../../contract";
import {assetToken} from "../../config";
import {bigToNumber, shortAddress} from "../../utils";
import {toast} from "react-toastify";


interface BidForm {
  amount: number;
}

interface SendForm {
  address: string;
}

export default function CardMarketplace(props: {peonIds: number[], userAddress: string, reload: (tx: Transaction) => void}) {
  return (
    <div>
      <div className="row">
        {props.peonIds.map(peonId => <PeonCard key={peonId} peonId={peonId} userAddress={props.userAddress} reload={props.reload} />)}
      </div>
    </div>
  );
}

function PeonCard(props: {peonId: number, userAddress: string, reload: (tx: Transaction) => void}) {
  const [peon, setPeon] = useState<Peon>();
  const [loading, setLoading] = useState(true);
  const [minedAmount, setMinedAmount] = useState<BigNumber>(BigNumber.from(0.0))
  const bidForm = useForm<BidForm>();
  const sendForm = useForm<SendForm>();
  useEffect(() => {
    setLoading(true);
    setPeon(undefined)
    getPeonDetail(props.peonId).then(data => {
      setPeon(data);
      setLoading(false);
    }).catch(err => {
      setLoading(false)
    })
  }, [])
  useEffect(() => {
    if (peon) {
      if (peon.owner.toLowerCase() === props.userAddress.toLowerCase()) {
        getPeonMinedGold(props.peonId).then((data: BigNumber) => setMinedAmount(data)).catch((err) => toast(err.message))
      }
    }
  }, [peon])
  const bid = (data: BidForm) => {
    makeBid(getSigner(props.userAddress), props.peonId, data.amount).then((tx:Transaction) => {
      setPeon(undefined)
      props.reload(tx);
    }).catch((err) => toast(err.message))
  }
  const cancel = (e: React.FormEvent<HTMLFormElement>) => {
    cancelBid(getSigner(props.userAddress), props.peonId).then((tx:Transaction) => {
      setPeon(undefined)
      props.reload(tx)
    }).catch((err) => toast(err.message))
    e.preventDefault()
  }
  const accept = (e: React.FormEvent<HTMLFormElement>, buyer: string) => {
    acceptBid(getSigner(props.userAddress), props.peonId, buyer).then((tx:Transaction) => {
      setPeon(undefined)
      props.reload(tx)
    }).catch((err) => toast(err.message))
    e.preventDefault()
  }
  const onClaimGold = (e: React.FormEvent<HTMLFormElement>) => {
    harvest(getSigner(props.userAddress), props.peonId).then((tx:Transaction) => {
      setMinedAmount(BigNumber.from(0))
    }).catch((err) => toast(err.message))
    e.preventDefault()
  }
  const gift = (data: SendForm) => {
    transfer(getSigner(props.userAddress), props.peonId, props.userAddress, data.address).then((tx: Transaction) => {
      setPeon(undefined);
    }).catch((err) => toast(err.message))
  }
  
  return <div className="col-2 col-lg-2 col-md-3 col-sm-3" key={props.peonId}>
    {peon ? <div className="card__item four">
      <div className="card_body space-y-10">
        {/* =============== */}
        <div className="card_head">
          <img src={`img/items/item_1.png`} alt="nftimage" />
          {peon && peon.bids.length > 0 ? <div className="likes space-x-3">
            <i className="ri-heart-3-fill" />
            <span className="txt_sm">{peon.bids.length}</span>
          </div>:null}
        </div>
        {/* =============== */}

        <h6 className="card_title">Peon #{props.peonId}</h6>
        <div className="card_footer d-block space-y-10">
          <div className="card_footer justify-content-between">
            <div>
              {peon.purchases.length > 0 ? <p className="txt_sm">Bought: <span className="color_green txt_sm">{bigToNumber(BigNumber.from(peon.purchases.sort((a,b) => a.value > b.value ? 1 : -1)[0].value.toString()), 5, 18)} BNB</span></p> : null}
              {peon.bids.length > 0 ? <p className="txt_sm">Offer: <span className="color_green txt_sm">{bigToNumber(BigNumber.from(peon.bids.sort((a,b) => a.value > b.value ? 1 : -1)[0].value.toString()), 5, 18)} BNB</span></p> : null}
              <p className="txt_sm">Mine: <span className="color_green txt_sm">{parseInt(peon.efficiency.toString()) / 100} pGOLD</span></p>
            </div>
          </div>
          <div className="hr" />
          <div
              className="d-flex
								align-items-center
								space-x-10
								justify-content-between">
            <Popup
                className="custom"
                trigger={
                  <button className="btn btn-sm btn-primary">
                    Details
                  </button>
                }
                position="bottom center">
              <div>
                <div
                    className="popup"
                    id="popup_bid"
                    tabIndex={-1}
                    role="dialog"
                    aria-hidden="true">
                  <div>
                    <div className=" space-y-20">
                      <Tabs className="space-y-20">
                        <div className="d-flex justify-content-between mb-30_reset">
                          <TabList className="d-flex space-x-10 mb-30 nav-tabs">
                            {peon.owner.toLowerCase() === props.userAddress.toLowerCase() ? <Tab className="nav-item">
                                  <Link
                                      className="btn btn-white btn-sm"
                                      data-toggle="tab"
                                      to="#tabs-1"
                                      role="tab">
                                    Details
                                  </Link>
                                </Tab> : <Tab className="nav-item">
                              <Link
                                  className="btn btn-white btn-sm"
                                  data-toggle="tab"
                                  to="#tabs-1"
                                  role="tab">
                                Place Bid
                              </Link>
                            </Tab>}
                            <Tab>
                              <Link
                                  className="btn btn-white btn-sm"
                                  data-toggle="tab"
                                  to="#tabs-2"
                                  role="tab">
                                Bids
                              </Link>
                            </Tab>
                            <Tab>
                              <Link
                                  className="btn btn-white btn-sm"
                                  data-toggle="tab"
                                  to="#tabs-3"
                                  role="tab">
                                Purchases
                              </Link>
                            </Tab>
                            <Tab>
                              <Link
                                  className="btn btn-white btn-sm"
                                  data-toggle="tab"
                                  to="#tabs-4"
                                  role="tab">
                                Transfers
                              </Link>
                            </Tab>
                          </TabList>

                        </div>
                        <div className="hr" />
                        <div className="tab-content">
                          {peon.owner.toLowerCase() === props.userAddress.toLowerCase() ? <TabPanel className="active">
                                <p>
                                  You are owner of this peon. This form allows you to send to another address. Enter the address you want to send to
                                </p>
                                <form onSubmit={sendForm.handleSubmit(gift)}>
                                <input
                                    type="text"
                                    className="form-control"
                                    {...sendForm.register("address")}
                                />
                                <input type="submit" className="btn btn-primary w-full" value="Send" />
                                </form>
                              </TabPanel> : <TabPanel className="active">
                            <form onSubmit={bidForm.handleSubmit(bid)}>
                              <p>
                                Input the amount of {assetToken} you would like to bid for this peon
                              </p>
                              <input
                                  type="text"
                                  className="form-control"
                                  {...bidForm.register("amount")}
                              />
                              {peon.purchases.length > 0 ? <div className="d-flex justify-content-between">
                                <p> Last purchase price:</p>
                                <p className="text-right color_black txt _bold">
                                  {bigToNumber(BigNumber.from(peon.purchases.sort((a,b) => a.value > b.value ? 1 : -1)[0].value.toString()), 5, 18)} {assetToken}
                                </p>
                              </div> : null}
                              {peon.bids.length > 0 ? <div className="d-flex justify-content-between">
                                <p> Highest current bid:</p>
                                <p className="text-right color_black txt _bold">
                                  {bigToNumber(BigNumber.from(peon.bids.sort((a,b) => a.value > b.value ? 1 : -1)[0].value.toString()), 5, 18)} {assetToken}
                                </p>
                              </div> : null}
                              <div className="d-flex justify-content-between">
                                <p> Peon's efficiency:</p>
                                <p className="text-right color_black txt _bold">
                                  {parseInt(peon.efficiency.toString()) / 100} pGOLD
                                </p>
                              </div>
                              <input type="submit" className="btn btn-primary w-full" value="Place a bid" />
                            </form>
                          </TabPanel> }
                          <TabPanel>
                            <div className="space-y-20">
                              {peon.bids.length > 0 ? peon.bids.map(bid => <div className="creator_item creator_card space-x-10">
                                <div className="avatars space-x-10">
                                  <div>
                                    <p className="color_black">
                                      <b>{shortAddress(bid.buyer)}</b> bids <span className="color_brand">{bigToNumber(BigNumber.from(bid.value.toString()), 5, 18)} {assetToken}</span>
                                    </p>
                                    <span className="date color_text">{new Date(bid.time).toLocaleString()}</span>

                                    {peon.owner.toLowerCase() === props.userAddress.toLowerCase() ?<form onSubmit={(e) => accept(e, bid.buyer)}><input className="btn btn-sm btn-primary" type="submit" value="Accept Offer"/></form> : null}
                                    {peon.bids.map(b => b.buyer.toLowerCase()).includes(props.userAddress.toLowerCase()) ? <form onSubmit={cancel}><input className="btn btn-sm btn-primary" type="submit" value="Cancel bid"/></form> : null}
                                  </div>
                                </div>
                              </div>) : <p>No active bids yet. Be the first to make a bid!</p>}
                            </div>
                          </TabPanel>
                          <TabPanel>
                            <div className="space-y-20">
                              {peon.purchases.length > 0 ? peon.purchases.map(purchase => <div className="creator_item creator_card space-x-10">
                                <div className="avatars space-x-10">
                                  <div>
                                    <p className="color_black">
                                      <b>{shortAddress(purchase.from)}</b> bought for <span className="color_brand">{bigToNumber(BigNumber.from(purchase.value.toString()), 5, 18)} {assetToken}</span>
                                    </p>
                                    <span className="date color_text">{new Date(purchase.time).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>) : <p>This peon has never been sold</p>}
                            </div>
                          </TabPanel>
                          <TabPanel>
                            <div className="space-y-20">
                              {peon.transfers.length > 0 ? peon.transfers.map(transfer => <div className="creator_item creator_card space-x-10">
                                <div className="avatars space-x-10">
                                  <div>
                                    {transfer.from === "0x0000000000000000000000000000000000000000" ? <p className="color_black">Minted at <b>{shortAddress(transfer.to)}</b></p> : <p className="color_black">Transferred from <b>{shortAddress(transfer.from)}</b> to <b>{shortAddress(transfer.to)}</b></p>}
                                    <span className="date color_text">{new Date(transfer.time).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>) : <p>No transfer has been done for this peon.</p>}
                            </div>
                          </TabPanel>
                        </div>
                      </Tabs>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </div>
        </div>
      </div>
    </div> : null}
  </div>
}
