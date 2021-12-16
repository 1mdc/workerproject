import React from 'react';
import {Link} from 'react-router-dom';
// @ts-ignore
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import CardMarketplace from '../../../components/cards/CardMarketplace';
import {Transaction} from "ethers";
import PeonContract from "../../../peoncontract";

export default function MenuCategoriesMarket(props: {contract: PeonContract, assetToken: string, marketPeons: number[], userPeons: number[], userBids: number[],
  recentMinted: number[], userAddress: string | null, reload: (tx: Transaction) => void}) {
  return (
    <div className="w-100">
      <Tabs className=" border-b">
        <TabList className="menu_categories  bg_white py-20 px-15 w-100">
          <Tab>
            <Link className="color_brand" to="/">
              <i className="ri-store-line" />
              <span> Peon Marketplace</span>
            </Link>
          </Tab>
          <Tab>
            <Link to="/">
              <i className="ri-user-line" />
              <span> Your Peons</span>
            </Link>
          </Tab>
          <Tab>
            <Link to="/">
              <i className="ri-auction-line" />
              <span> Your Bids</span>
            </Link>
          </Tab>
          <Tab>
            <Link to="/">
              <i className="ri-time-line" />
              <span> Recent Minted</span>
            </Link>
          </Tab>
        </TabList>
        <TabPanel>
          <div className="container">
            <div className="section mt-100">
              <div>
                <h2 className="section__title mb-20"> Peon Marketplace</h2>
                <div>
                  <div>
                    {props.userAddress ? <CardMarketplace contract={props.contract} assetToken={props.assetToken} peonIds={props.marketPeons} userAddress={props.userAddress} reload={props.reload} /> : <RequestConnectWallet />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="container">
            <div className="section mt-100">
              <div className="section__head">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="section__title"> Your Peons</h2>

                </div>
              </div>
              {props.userAddress ? <CardMarketplace contract={props.contract} assetToken={props.assetToken} peonIds={props.userPeons} userAddress={props.userAddress} reload={props.reload} /> : <RequestConnectWallet />}
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="container">
            <div className="section mt-100">
              <div className="section__head">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="section__title"> Your Bids</h2>

                </div>
              </div>
              {props.userAddress ? <CardMarketplace contract={props.contract} assetToken={props.assetToken} peonIds={props.userBids} userAddress={props.userAddress} reload={props.reload} /> : <RequestConnectWallet />}
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="container">
            <div className="section mt-100">
              <div className="section__head">
                <div className="d-flex justify-content-between align-items-center">
                  <h2 className="section__title"> Recent Minted</h2>

                </div>
              </div>
              {props.userAddress ? <CardMarketplace contract={props.contract} assetToken={props.assetToken} peonIds={props.recentMinted} userAddress={props.userAddress} reload={props.reload} /> : <RequestConnectWallet />}
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}


function RequestConnectWallet() {
  return (<div>
    <p>Please connect wallet to view market</p>
  </div>)
}